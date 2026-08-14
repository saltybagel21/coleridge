import { SPECIALS_SHOP_URL } from "../config/site";
import type { SpecialCampaign } from "../shared/specials";
import { formatTierRange } from "../shared/specials";
import type { Product } from "../shop/products";

export const formatSpecialMoney = (value: number) => `R${value.toFixed(2)}`;

export const formatCampaignDate = (value: string, includeYear: boolean) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  });
};

export const buildSpecialsMessage = (campaign: SpecialCampaign, products: Product[]) => {
  const byId = new Map(products.map((product) => [product.id, product]));
  const groups = new Map<string, typeof campaign.items>();

  campaign.items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((item) => {
      const product = byId.get(item.productId);
      if (!product) return;
      const current = groups.get(product.category) ?? [];
      current.push(item);
      groups.set(product.category, current);
    });

  const lines: string[] = [`*${campaign.title || "Coleridge Meat Specials"}*`];
  if (campaign.subtitle) lines.push(`_${campaign.subtitle}_`);

  if (campaign.validityLine) {
    lines.push(campaign.validityLine);
  } else if (campaign.startDate && campaign.endDate) {
    lines.push(
      `Valid ${formatCampaignDate(campaign.startDate, campaign.includeYear)} to ${formatCampaignDate(campaign.endDate, campaign.includeYear)}`,
    );
  }

  if (campaign.openingLine) lines.push("", campaign.openingLine);

  groups.forEach((items, category) => {
    lines.push("", `*${category.toUpperCase()}*`);
    items.forEach((item) => {
      const product = byId.get(item.productId);
      if (!product) return;
      const name = item.displayName || product.name;

      if (item.pricingMode === "fixed" && item.fixedPrice != null) {
        lines.push(`- *${name}* - ${formatSpecialMoney(item.fixedPrice)}/${product.unit}`);
        if (product.price > item.fixedPrice) {
          const saving = product.price - item.fixedPrice;
          const percent = Math.round((saving / product.price) * 100);
          lines.push(
            `  Was ${formatSpecialMoney(product.price)}/${product.unit} | Save ${formatSpecialMoney(saving)} (${percent}%)`,
          );
        }
        return;
      }

      lines.push(`- *${name}*`);
      item.tiers
        .slice()
        .sort((a, b) => (a.minQty ?? -1) - (b.minQty ?? -1))
        .forEach((tier) => {
          lines.push(`  ${formatTierRange(tier, product.unit)}: ${formatSpecialMoney(tier.price)}/${product.unit}`);
        });
    });
  });

  if (campaign.note) lines.push("", `_${campaign.note}_`);

  lines.push("", "*Order online*", SPECIALS_SHOP_URL);
  if (campaign.orderInstructions) lines.push(campaign.orderInstructions);
  lines.push("", "*Coleridge Meat*", "18 Tennant Road, Cloetesville, Stellenbosch", "WhatsApp / Call: *061 127 5756*");

  return lines.join("\n");
};
