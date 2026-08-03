import { listProducts } from "../_shared/catalogue";
import { noStoreJson } from "../_shared/http";
import type { Env } from "../_shared/types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const products = await listProducts(env.DB);
    return noStoreJson({ products });
  } catch (error) {
    console.error("Unable to load catalogue", error);
    return noStoreJson({ error: "The live catalogue is temporarily unavailable." }, { status: 503 });
  }
};
