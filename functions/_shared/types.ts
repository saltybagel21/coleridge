export interface Env {
  DB: D1Database;
  ADMIN_EMAIL?: string;
  ADMIN_EMAILS?: string;
  ACCESS_TEAM_NAME?: string;
  ACCESS_AUD?: string;
  FIREBASE_PROJECT_ID?: string;
}

export interface AccessIdentity {
  email: string;
}

export interface FunctionData {
  [key: string]: unknown;
  admin?: AccessIdentity;
}
