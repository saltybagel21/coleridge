import { deleteProduct, getProduct, updateProduct } from "../../_shared/catalogue";
import { noStoreJson } from "../../_shared/http";
import type { Env } from "../../_shared/types";
import { validateProduct } from "../../_shared/validation";

export const onRequestPatch: PagesFunction<Env, "id"> = async ({ request, env, params }) => {
  try {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return noStoreJson({ error: "Product ID is required." }, { status: 400 });

    const current = await getProduct(env.DB, id);
    if (!current) return noStoreJson({ error: "Product not found." }, { status: 404 });

    const body: unknown = await request.json();
    const validation = validateProduct(body, {
      id,
      defaultSortOrder: current.sortOrder ?? 0,
    });
    if ("error" in validation) return noStoreJson({ error: validation.error }, { status: 400 });

    const product = await updateProduct(env.DB, id, validation.product);
    return noStoreJson({ product });
  } catch (error) {
    console.error("Unable to update product", error);
    return noStoreJson({ error: "The product could not be updated." }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env, "id"> = async ({ env, params }) => {
  try {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return noStoreJson({ error: "Product ID is required." }, { status: 400 });
    const deleted = await deleteProduct(env.DB, id);
    if (!deleted) return noStoreJson({ error: "Product not found." }, { status: 404 });
    return noStoreJson({ deleted: true });
  } catch (error) {
    console.error("Unable to delete product", error);
    return noStoreJson({ error: "The product could not be deleted." }, { status: 500 });
  }
};
