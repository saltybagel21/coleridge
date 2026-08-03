import { noStoreJson } from "../_shared/http";
import type { Env, FunctionData } from "../_shared/types";

export const onRequestGet: PagesFunction<Env, string, FunctionData> = async ({ data }) =>
  noStoreJson({ authenticated: true, email: data.admin?.email });
