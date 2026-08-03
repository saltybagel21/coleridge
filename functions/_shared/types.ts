export interface Env {
  DB: D1Database;
  ADMIN_EMAIL?: string;
  ACCESS_TEAM_NAME?: string;
  ACCESS_AUD?: string;
}

export interface AccessIdentity {
  email: string;
}

export interface FunctionData {
  [key: string]: unknown;
  admin?: AccessIdentity;
}
