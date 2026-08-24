import { reorderProducts } from "../../_shared/catalogue";
import { noStoreJson } from "../../_shared/http";
import type { Env } from "../../_shared/types";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body: unknown = await request.json();
    const productIds =
      body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).productIds)
        ? (body as { productIds: unknown[] }).productIds
        : null;

    if (
      !productIds ||
      productIds.length === 0 ||
      productIds.length > 500 ||
      productIds.some((id) => typeof id !== "string" || id.length === 0 || id.length > 64)
    ) {
      return noStoreJson({ error: "A valid product order is required." }, { status: 400 });
    }

    const products = await reorderProducts(env.DB, productIds as string[]);
    return noStoreJson({ products });
  } catch (error) {
    console.error("Unable to reorder products", error);
    const message = error instanceof Error ? error.message : "The product order could not be saved.";
    return noStoreJson({ error: message }, { status: 400 });
  }
};
