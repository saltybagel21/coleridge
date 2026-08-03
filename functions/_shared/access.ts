import type { AccessIdentity, Env } from "./types";

type AccessPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
};

type AccessKeys = {
  keys?: JsonWebKey[];
};

type JwtHeader = {
  alg?: string;
  kid?: string;
};

type AuthenticationResult =
  | { ok: true; identity: AccessIdentity }
  | { ok: false; message: string };

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const parseJsonSegment = <T>(segment: string): T =>
  JSON.parse(new TextDecoder().decode(fromBase64Url(segment))) as T;

const normalizeTeamDomain = (teamName: string) => {
  const clean = teamName.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return clean.includes(".") ? clean : `${clean}.cloudflareaccess.com`;
};

const includesAudience = (audience: string | string[] | undefined, expected: string[]) => {
  const supplied = Array.isArray(audience) ? audience : audience ? [audience] : [];
  return expected.some((value) => supplied.includes(value));
};

const isLocalRequest = (request: Request) => {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
};

export const authenticateAccess = async (
  request: Request,
  env: Env,
): Promise<AuthenticationResult> => {
  const configuredEmails = Array.from(
    new Set(
      [env.ADMIN_EMAILS, env.ADMIN_EMAIL]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const teamName = env.ACCESS_TEAM_NAME?.trim();
  const expectedAudiences =
    env.ACCESS_AUD?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];

  if (isLocalRequest(request) && (!teamName || expectedAudiences.length === 0)) {
    return {
      ok: true,
      identity: { email: configuredEmails[0] || "local-admin@coleridgemeat.test" },
    };
  }

  if (configuredEmails.length === 0 || !teamName || expectedAudiences.length === 0) {
    return { ok: false, message: "The owner dashboard security settings are incomplete." };
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return { ok: false, message: "Cloudflare Access authentication is required." };

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, message: "The access token is invalid." };

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = parseJsonSegment<JwtHeader>(encodedHeader);
    const payload = parseJsonSegment<AccessPayload>(encodedPayload);
    if (header.alg !== "RS256" || !header.kid) {
      return { ok: false, message: "The access token uses an unsupported signature." };
    }

    const teamDomain = normalizeTeamDomain(teamName);
    const issuer = `https://${teamDomain}`;
    const keysResponse = await fetch(`${issuer}/cdn-cgi/access/certs`, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!keysResponse.ok) return { ok: false, message: "Cloudflare Access keys are unavailable." };

    const keySet = (await keysResponse.json()) as AccessKeys;
    const key = keySet.keys?.find(
      (candidate) => (candidate as JsonWebKey & { kid?: string }).kid === header.kid,
    );
    if (!key) return { ok: false, message: "The access signing key was not found." };

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
    if (!verified) return { ok: false, message: "The access token signature is invalid." };

    const now = Math.floor(Date.now() / 1000);
    const email = payload.email?.trim().toLowerCase();
    const validClaims =
      payload.iss === issuer &&
      includesAudience(payload.aud, expectedAudiences) &&
      typeof payload.exp === "number" &&
      payload.exp > now &&
      (payload.nbf == null || payload.nbf <= now) &&
      Boolean(email && configuredEmails.includes(email));

    if (!validClaims || !email) {
      return { ok: false, message: "This account is not authorised for the owner dashboard." };
    }

    return { ok: true, identity: { email } };
  } catch {
    return { ok: false, message: "The access token could not be verified." };
  }
};
