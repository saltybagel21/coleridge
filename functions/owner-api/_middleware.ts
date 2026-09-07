import { authenticateOwnerSession } from "../_shared/ownerAuth";
import { noStoreJson } from "../_shared/http";
import type { Env, FunctionData } from "../_shared/types";

export const onRequest: PagesFunction<Env, string, FunctionData> = async (context) => {
  const pathname = new URL(context.request.url).pathname.replace(/\/+$/, "");
  if (pathname === "/owner-api/login" || pathname === "/owner-api/logout") {
    return context.next();
  }

  const method = context.request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const origin = context.request.headers.get("origin");
    if (!origin || origin !== new URL(context.request.url).origin) {
      return noStoreJson({ error: "This request is not allowed." }, { status: 403 });
    }
  }

  const authentication = await authenticateOwnerSession(context.request, context.env);
  if ("message" in authentication) {
    return noStoreJson({ error: authentication.message }, { status: 401 });
  }

  context.data.admin = authentication.identity;
  return context.next();
};
