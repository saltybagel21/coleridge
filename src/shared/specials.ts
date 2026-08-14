export type SpecialPricingMode = "fixed" | "tiered";

export interface SpecialTier {
  id: string;
  minQty: number | null;
  maxQty: number | null;
  price: number;
}

export interface SpecialOffer {
  id: string;
  productId: string;
  displayName: string;
  pricingMode: SpecialPricingMode;
  fixedPrice: number | null;
  tiers: SpecialTier[];
  sortOrder: number;
}

export interface SpecialCampaign {
  id: string;
  title: string;
  subtitle: string;
  openingLine: string;
  startDate: string;
  endDate: string;
  validityLine: string;
  includeYear: boolean;
  note: string;
  orderInstructions: string;
  published: boolean;
  items: SpecialOffer[];
  customMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveProductSpecial extends SpecialOffer {
  campaignId: string;
  campaignTitle: string;
  campaignSubtitle: string;
  campaignOpeningLine: string;
  startDate: string;
  endDate: string;
}

type PriceableProduct = {
  price: number;
  unit: "kg" | "each";
  specials?: ActiveProductSpecial[];
};

export interface ResolvedPrice {
  unitPrice: number;
  regularPrice: number;
  isSpecial: boolean;
  special?: ActiveProductSpecial;
  tier?: SpecialTier;
}

const quantityMatchesTier = (tier: SpecialTier, quantity: number) =>
  (tier.minQty == null || quantity >= tier.minQty) &&
  (tier.maxQty == null || quantity < tier.maxQty);

export const resolveProductPrice = (product: PriceableProduct, quantity: number): ResolvedPrice => {
  const candidates = (product.specials ?? []).flatMap((special) => {
    if (special.pricingMode === "fixed" && special.fixedPrice != null) {
      return [{ unitPrice: special.fixedPrice, special, tier: undefined }];
    }

    const tier = special.tiers.find((candidate) => quantityMatchesTier(candidate, quantity));
    return tier ? [{ unitPrice: tier.price, special, tier }] : [];
  });

  const best = candidates.sort((a, b) => a.unitPrice - b.unitPrice)[0];
  if (!best || (product.price > 0 && best.unitPrice >= product.price)) {
    return {
      unitPrice: product.price,
      regularPrice: product.price,
      isSpecial: false,
    };
  }

  return {
    unitPrice: best.unitPrice,
    regularPrice: product.price,
    isSpecial: true,
    special: best.special,
    tier: best.tier,
  };
};

export const getLowestSpecialPrice = (product: PriceableProduct) => {
  const prices = (product.specials ?? []).flatMap((special) =>
    special.pricingMode === "fixed"
      ? special.fixedPrice == null
        ? []
        : [special.fixedPrice]
      : special.tiers.map((tier) => tier.price),
  );

  if (!prices.length) return null;
  return Math.min(...prices);
};

export const getPrimarySpecial = (product: PriceableProduct) => product.specials?.[0] ?? null;

const cleanQuantity = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

export const formatTierRange = (tier: SpecialTier, unit: "kg" | "each") => {
  const noun = unit === "kg" ? "kg" : "item";
  const unitLabel = (quantity: number) =>
    unit === "kg" ? "kg" : quantity === 1 ? "item" : "items";

  if (tier.minQty == null && tier.maxQty != null) {
    return `Under ${cleanQuantity(tier.maxQty)} ${unitLabel(tier.maxQty)}`;
  }
  if (tier.minQty != null && tier.maxQty == null) {
    return `${cleanQuantity(tier.minQty)} ${unitLabel(tier.minQty)} or more`;
  }
  if (tier.minQty != null && tier.maxQty != null) {
    return `${cleanQuantity(tier.minQty)} to under ${cleanQuantity(tier.maxQty)} ${unitLabel(tier.maxQty)}`;
  }
  return `Any ${noun} quantity`;
};

export const getJohannesburgDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export type CampaignStatus = "draft" | "scheduled" | "active" | "expired";

export const getCampaignStatus = (
  campaign: Pick<SpecialCampaign, "published" | "startDate" | "endDate">,
  today = getJohannesburgDate(),
): CampaignStatus => {
  if (!campaign.published) return "draft";
  if (campaign.startDate > today) return "scheduled";
  if (campaign.endDate < today) return "expired";
  return "active";
};
