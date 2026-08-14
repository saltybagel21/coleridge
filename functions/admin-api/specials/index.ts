import { noStoreJson } from "../../_shared/http";
import { listProducts } from "../../_shared/catalogue";
import {
  insertSpecialCampaign,
  listSpecialCampaigns,
  validateSpecialCampaign,
} from "../../_shared/specials";
import type { Env } from "../../_shared/types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const campaigns = await listSpecialCampaigns(env.DB);
    return noStoreJson({ campaigns });
  } catch (error) {
    console.error("Unable to list special campaigns", error);
    return noStoreJson({ error: "Special campaigns could not be loaded." }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const now = new Date().toISOString();
    const body: unknown = await request.json();
    const products = await listProducts(env.DB, true);
    const validation = validateSpecialCampaign(body, {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      productsById: new Map(products.map((product) => [product.id, product])),
    });
    if ("error" in validation) return noStoreJson({ error: validation.error }, { status: 400 });

    const campaign = await insertSpecialCampaign(env.DB, validation.campaign);
    return noStoreJson({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Unable to create special campaign", error);
    return noStoreJson({ error: "The special campaign could not be saved." }, { status: 500 });
  }
};
