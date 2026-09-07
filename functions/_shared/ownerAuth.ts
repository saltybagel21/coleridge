import type { AccessIdentity, Env } from "./types";

const COOKIE_NAME = "__Host-coleridge_owner_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();

type AuthenticationResult =
  | { ok: true; identity: AccessIdentity }
  | { ok: false; message: string };

const toBase64Url = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const constantTimeEqual = (left: Uint8Array, right: Uint8Array) => {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
};

const isLocalRequest = (request: Request) => {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
};

const importSessionKey = (secret: string, usages: KeyUsage[]) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );

const sign = async (value: string, secret: string) => {
  const key = await importSessionKey(secret, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
};

const getCookie = (request: Request, name: string) => {
  const cookie = request.headers.get("cookie") || "";
  for (const entry of cookie.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    if (entry.slice(0, separator).trim() === name) return entry.slice(separator + 1).trim();
  }
  return null;
};

export const ownerSecurityIsConfigured = (env: Env) =>
  Boolean(env.OWNER_PASSWORD_HASH?.trim() && env.OWNER_SESSION_SECRET?.trim());

export const verifyOwnerPassword = async (password: string, storedValue: string) => {
  const normalized = storedValue.trim();
  if (!normalized.includes(":") && !normalized.includes("$")) {
    try {
      const expected = fromBase64Url(normalized);
      const derived = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
      return constantTimeEqual(derived, expected);
    } catch {
      return false;
    }
  }

  const [scheme, iterationsValue, saltValue, hashValue] = normalized.replace(/\$/g, ":").split(":");
  const iterations = Number(iterationsValue);
  if (
    scheme !== "pbkdf2-sha256" ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 1_000_000 ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  try {
    const expected = fromBase64Url(hashValue);
    const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
      "deriveBits",
    ]);
    const derived = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(saltValue), iterations },
        passwordKey,
        expected.length * 8,
      ),
    );
    return constantTimeEqual(derived, expected);
  } catch {
    return false;
  }
};

export const createOwnerSessionCookie = async (env: Env) => {
  const secret = env.OWNER_SESSION_SECRET?.trim();
  if (!secret) throw new Error("Owner session security is not configured.");

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_SECONDS;
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(18)));
  const payload = `v1.${issuedAt}.${expiresAt}.${nonce}`;
  const signature = await sign(payload, secret);
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
};

export const clearOwnerSessionCookie = () =>
  `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

export const authenticateOwnerSession = async (
  request: Request,
  env: Env,
): Promise<AuthenticationResult> => {
  if (!ownerSecurityIsConfigured(env)) {
    if (isLocalRequest(request)) return { ok: true, identity: { email: "Owner" } };
    return { ok: false, message: "The owner dashboard security settings are incomplete." };
  }

  const token = getCookie(request, COOKIE_NAME);
  if (!token) return { ok: false, message: "Please enter the owner password." };

  try {
    const parts = token.split(".");
    if (parts.length !== 5 || parts[0] !== "v1") {
      return { ok: false, message: "Your owner session is invalid. Please sign in again." };
    }

    const [version, issuedValue, expiresValue, nonce, signature] = parts;
    const issuedAt = Number(issuedValue);
    const expiresAt = Number(expiresValue);
    const now = Math.floor(Date.now() / 1000);
    if (
      !Number.isInteger(issuedAt) ||
      !Number.isInteger(expiresAt) ||
      issuedAt > now + 300 ||
      expiresAt <= now ||
      expiresAt - issuedAt !== SESSION_SECONDS ||
      nonce.length < 16
    ) {
      return { ok: false, message: "Your owner session has expired. Please sign in again." };
    }

    const payload = `${version}.${issuedValue}.${expiresValue}.${nonce}`;
    const key = await importSessionKey(env.OWNER_SESSION_SECRET!.trim(), ["verify"]);
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!verified) {
      return { ok: false, message: "Your owner session is invalid. Please sign in again." };
    }

    return { ok: true, identity: { email: "Owner" } };
  } catch {
    return { ok: false, message: "Your owner session is invalid. Please sign in again." };
  }
};

export const loginRateLimitKey = async (request: Request, secret: string) => {
  const address = request.headers.get("cf-connecting-ip") || "unknown";
  return sign(`login:${address}`, secret);
};
