import { authenticateAccess } from "../_shared/access";
import { noStoreJson } from "../_shared/http";
import type { Env, FunctionData } from "../_shared/types";

export const onRequest: PagesFunction<Env, string, FunctionData> = async (context) => {
  const authentication = await authenticateAccess(context.request, context.env);
  if ("message" in authentication) {
    return noStoreJson({ error: authentication.message }, { status: 401 });
  }

  context.data.admin = authentication.identity;
  return context.next();
};
