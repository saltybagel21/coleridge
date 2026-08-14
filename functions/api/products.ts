import { listProducts } from "../_shared/catalogue";
import { noStoreJson } from "../_shared/http";
import { listActiveSpecialCampaigns } from "../_shared/specials";
import type { Env } from "../_shared/types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const [products, campaigns] = await Promise.all([
      listProducts(env.DB),
      listActiveSpecialCampaigns(env.DB),
    ]);
    const specialsByProduct = new Map<string, NonNullable<(typeof products)[number]["specials"]>>();

    campaigns.forEach((campaign) => {
      campaign.items.forEach((offer) => {
        const specials = specialsByProduct.get(offer.productId) ?? [];
        specials.push({
          ...offer,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          campaignSubtitle: campaign.subtitle,
          campaignOpeningLine: campaign.openingLine,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        });
        specialsByProduct.set(offer.productId, specials);
      });
    });

    return noStoreJson({
      products: products.map((product) => ({
        ...product,
        ...(specialsByProduct.has(product.id) ? { specials: specialsByProduct.get(product.id) } : {}),
      })),
    });
  } catch (error) {
    console.error("Unable to load catalogue", error);
    return noStoreJson({ error: "The live catalogue is temporarily unavailable." }, { status: 503 });
  }
};
