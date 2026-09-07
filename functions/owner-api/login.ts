import {
  createOwnerSessionCookie,
  loginRateLimitKey,
  ownerSecurityIsConfigured,
  verifyOwnerPassword,
} from "../_shared/ownerAuth";
import { noStoreJson } from "../_shared/http";
import type { Env } from "../_shared/types";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 8;

type Attempt = {
  attempts: number;
  window_started: number;
  blocked_until: number;
};

const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
};

const recordFailure = async (env: Env, key: string, current: Attempt | null, now: number) => {
  const windowStarted = current && now - current.window_started < WINDOW_SECONDS ? current.window_started : now;
  const attempts = current && windowStarted === current.window_started ? current.attempts + 1 : 1;
  const blockedUntil = attempts >= MAX_ATTEMPTS ? now + WINDOW_SECONDS : 0;
  await env.DB.prepare(
    `INSERT INTO owner_login_attempts (id, attempts, window_started, blocked_until)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(id) DO UPDATE SET
       attempts = excluded.attempts,
       window_started = excluded.window_started,
       blocked_until = excluded.blocked_until`,
  )
    .bind(key, attempts, windowStarted, blockedUntil)
    .run();
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!sameOrigin(request) || !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return noStoreJson({ error: "This sign-in request is not allowed." }, { status: 403 });
  }
  if (!ownerSecurityIsConfigured(env)) {
    return noStoreJson({ error: "The owner dashboard security settings are incomplete." }, { status: 503 });
  }

  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS owner_login_attempts (
        id TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL,
        window_started INTEGER NOT NULL,
        blocked_until INTEGER NOT NULL
      )`,
    ).run();

    const now = Math.floor(Date.now() / 1000);
    const key = await loginRateLimitKey(request, env.OWNER_SESSION_SECRET!.trim());
    const current = await env.DB.prepare(
      "SELECT attempts, window_started, blocked_until FROM owner_login_attempts WHERE id = ?1",
    )
      .bind(key)
      .first<Attempt>();
    if (current && current.blocked_until > now) {
      return noStoreJson(
        { error: "Too many sign-in attempts. Please wait 15 minutes and try again." },
        { status: 429, headers: { "retry-after": String(current.blocked_until - now) } },
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > 1024) {
      await recordFailure(env, key, current, now);
      return noStoreJson({ error: "The password is incorrect." }, { status: 401 });
    }

    let body: { password?: unknown } | null = null;
    try {
      body = JSON.parse(rawBody) as { password?: unknown };
    } catch {
      body = null;
    }
    const password = typeof body?.password === "string" ? body.password : "";
    const valid =
      password.length > 0 &&
      password.length <= 256 &&
      (await verifyOwnerPassword(password, env.OWNER_PASSWORD_HASH!.trim()));
    if (!valid) {
      await recordFailure(env, key, current, now);
      return noStoreJson({ error: "The password is incorrect." }, { status: 401 });
    }

    await env.DB.prepare("DELETE FROM owner_login_attempts WHERE id = ?1").bind(key).run();
    const cookie = await createOwnerSessionCookie(env);
    return noStoreJson(
      { authenticated: true, email: "Owner" },
      { status: 200, headers: { "set-cookie": cookie } },
    );
  } catch {
    return noStoreJson({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
};
