export interface Env {
  DB: D1Database;
  ADMIN_EMAIL?: string;
  ADMIN_EMAILS?: string;
  ACCESS_TEAM_NAME?: string;
  ACCESS_AUD?: string;
  OWNER_PASSWORD_HASH?: string;
  OWNER_SESSION_SECRET?: string;
}

export interface AccessIdentity {
  email: string;
}

export interface FunctionData {
  [key: string]: unknown;
  admin?: AccessIdentity;
}
