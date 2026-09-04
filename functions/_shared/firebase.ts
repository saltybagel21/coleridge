import type { AccessIdentity, Env } from "./types";

type FirebasePayload = {
  aud?: string;
  auth_time?: number;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
};

type FirebaseKeys = { keys?: JsonWebKey[] };
type JwtHeader = { alg?: string; kid?: string };

type AuthenticationResult =
  | { ok: true; identity: AccessIdentity }
  | { ok: false; message: string };

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const FIREBASE_KEYS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const parseJsonSegment = <T>(segment: string): T =>
  JSON.parse(new TextDecoder().decode(fromBase64Url(segment))) as T;

const configuredEmails = (env: Env) =>
  Array.from(
    new Set(
      [env.ADMIN_EMAILS, env.ADMIN_EMAIL]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

const isLocalRequest = (request: Request) => {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
};

export const authenticateFirebase = async (
  request: Request,
  env: Env,
): Promise<AuthenticationResult> => {
  const emails = configuredEmails(env);
  const projectId = env.FIREBASE_PROJECT_ID?.trim();

  if (isLocalRequest(request) && !projectId) {
    return { ok: true, identity: { email: emails[0] || "local-admin@coleridgemeat.test" } };
  }

  if (!projectId || emails.length === 0) {
    return { ok: false, message: "The owner dashboard security settings are incomplete." };
  }

  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return { ok: false, message: "Please sign in with an approved Google account." };

  try {
    const token = match[1];
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, message: "The sign-in token is invalid." };

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = parseJsonSegment<JwtHeader>(encodedHeader);
    const payload = parseJsonSegment<FirebasePayload>(encodedPayload);
    if (header.alg !== "RS256" || !header.kid) {
      return { ok: false, message: "The sign-in token uses an unsupported signature." };
    }

    const keysResponse = await fetch(FIREBASE_KEYS_URL, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!keysResponse.ok) return { ok: false, message: "Google sign-in verification is unavailable." };

    const keySet = (await keysResponse.json()) as FirebaseKeys;
    const key = keySet.keys?.find(
      (candidate) => (candidate as JsonWebKey & { kid?: string }).kid === header.kid,
    );
    if (!key) return { ok: false, message: "The Google signing key was not found." };

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      fromBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
    if (!verified) return { ok: false, message: "The sign-in token signature is invalid." };

    const now = Math.floor(Date.now() / 1000);
    const email = payload.email?.trim().toLowerCase();
    const validClaims =
      payload.iss === `https://securetoken.google.com/${projectId}` &&
      payload.aud === projectId &&
      typeof payload.sub === "string" &&
      payload.sub.length > 0 &&
      payload.sub.length <= 128 &&
      typeof payload.exp === "number" &&
      payload.exp > now &&
      typeof payload.iat === "number" &&
      payload.iat <= now + 300 &&
      typeof payload.auth_time === "number" &&
      payload.auth_time >= now - THIRTY_DAYS_SECONDS &&
      payload.email_verified === true &&
      Boolean(email && emails.includes(email));

    if (!validClaims || !email) {
      return { ok: false, message: "This Google account is not authorised for the owner dashboard." };
    }

    return { ok: true, identity: { email } };
  } catch {
    return { ok: false, message: "The Google sign-in token could not be verified." };
  }
};
