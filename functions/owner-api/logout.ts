import { clearOwnerSessionCookie } from "../_shared/ownerAuth";
import { noStoreJson } from "../_shared/http";
import type { Env } from "../_shared/types";

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return noStoreJson({ error: "This sign-out request is not allowed." }, { status: 403 });
  }

  return noStoreJson(
    { authenticated: false },
    { status: 200, headers: { "set-cookie": clearOwnerSessionCookie() } },
  );
};
