import { insertProduct, listProducts, nextSortOrder } from "../../_shared/catalogue";
import { noStoreJson } from "../../_shared/http";
import type { Env } from "../../_shared/types";
import { slugify, validateProduct } from "../../_shared/validation";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const products = await listProducts(env.DB, true);
    return noStoreJson({ products });
  } catch (error) {
    console.error("Unable to load owner catalogue", error);
    return noStoreJson({ error: "The catalogue could not be loaded." }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body: unknown = await request.json();
    const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const name = typeof input.name === "string" ? input.name : "product";
    const baseId = slugify(name) || "product";
    const id = `${baseId}-${crypto.randomUUID().slice(0, 8)}`;
    const sortOrder = await nextSortOrder(env.DB);
    const validation = validateProduct(body, { id, defaultSortOrder: sortOrder });
    if ("error" in validation) return noStoreJson({ error: validation.error }, { status: 400 });

    const product = await insertProduct(env.DB, validation.product);
    return noStoreJson({ product }, { status: 201 });
  } catch (error) {
    console.error("Unable to create product", error);
    return noStoreJson({ error: "The product could not be created." }, { status: 500 });
  }
};
