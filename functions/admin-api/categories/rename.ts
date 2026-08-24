import { listProducts, renameCategory } from "../../_shared/catalogue";
import { noStoreJson } from "../../_shared/http";
import type { Env } from "../../_shared/types";

const cleanCategory = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body: unknown = await request.json();
    const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const currentName = cleanCategory(input.currentName);
    const nextName = cleanCategory(input.nextName);

    if (!currentName || !nextName) {
      return noStoreJson({ error: "Both category names are required." }, { status: 400 });
    }
    if (["all", "specials"].includes(nextName.toLowerCase())) {
      return noStoreJson({ error: "That name is reserved by the shop navigation." }, { status: 400 });
    }

    const products = await listProducts(env.DB, true);
    if (!products.some((product) => product.category === currentName)) {
      return noStoreJson({ error: "Category not found." }, { status: 404 });
    }

    const renamed = currentName === nextName ? 0 : await renameCategory(env.DB, currentName, nextName);
    const updatedProducts = currentName === nextName ? products : await listProducts(env.DB, true);
    return noStoreJson({ products: updatedProducts, renamed });
  } catch (error) {
    console.error("Unable to rename category", error);
    return noStoreJson({ error: "The category could not be renamed." }, { status: 500 });
  }
};
