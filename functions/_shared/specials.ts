import type {
  SpecialCampaign,
  SpecialOffer,
  SpecialTier,
} from "../../src/shared/specials";
import { getJohannesburgDate } from "../../src/shared/specials";
import type { Product } from "../../src/shop/products";
import { getQuantityRules, isQuantityOnStep } from "../../src/shop/quantityRules";

type CampaignRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  published: number;
  payload: string;
  created_at: string;
  updated_at: string;
};

const CREATE_SPECIALS = `
  CREATE TABLE IF NOT EXISTS special_campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

let specialsReady: Promise<void> | undefined;

const initialiseSpecials = async (db: D1Database) => {
  await db.prepare(CREATE_SPECIALS).run();
  await db
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_special_campaigns_active ON special_campaigns(published, start_date, end_date, updated_at)",
    )
    .run();
};

export const ensureSpecials = (db: D1Database) => {
  if (!specialsReady) {
    specialsReady = initialiseSpecials(db).catch((error) => {
      specialsReady = undefined;
      throw error;
    });
  }
  return specialsReady;
};

const rowToCampaign = (row: CampaignRow): SpecialCampaign => {
  const payload = JSON.parse(row.payload) as SpecialCampaign;
  return {
    ...payload,
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const listSpecialCampaigns = async (db: D1Database) => {
  await ensureSpecials(db);
  const result = await db
    .prepare("SELECT * FROM special_campaigns ORDER BY updated_at DESC")
    .all<CampaignRow>();
  return result.results.map(rowToCampaign);
};

export const listActiveSpecialCampaigns = async (
  db: D1Database,
  today = getJohannesburgDate(),
) => {
  await ensureSpecials(db);
  const result = await db
    .prepare(
      `SELECT * FROM special_campaigns
       WHERE published = 1 AND start_date <= ? AND end_date >= ?
       ORDER BY updated_at DESC`,
    )
    .bind(today, today)
    .all<CampaignRow>();
  return result.results.map(rowToCampaign);
};

export const getSpecialCampaign = async (db: D1Database, id: string) => {
  await ensureSpecials(db);
  const row = await db
    .prepare("SELECT * FROM special_campaigns WHERE id = ?")
    .bind(id)
    .first<CampaignRow>();
  return row ? rowToCampaign(row) : null;
};

export const insertSpecialCampaign = async (db: D1Database, campaign: SpecialCampaign) => {
  await ensureSpecials(db);
  await db
    .prepare(
      `INSERT INTO special_campaigns
       (id, title, start_date, end_date, published, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      campaign.id,
      campaign.title,
      campaign.startDate,
      campaign.endDate,
      campaign.published ? 1 : 0,
      JSON.stringify(campaign),
      campaign.createdAt,
      campaign.updatedAt,
    )
    .run();
  return getSpecialCampaign(db, campaign.id);
};

export const updateSpecialCampaign = async (db: D1Database, campaign: SpecialCampaign) => {
  await ensureSpecials(db);
  await db
    .prepare(
      `UPDATE special_campaigns SET
       title = ?, start_date = ?, end_date = ?, published = ?, payload = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      campaign.title,
      campaign.startDate,
      campaign.endDate,
      campaign.published ? 1 : 0,
      JSON.stringify(campaign),
      campaign.updatedAt,
      campaign.id,
    )
    .run();
  return getSpecialCampaign(db, campaign.id);
};

export const deleteSpecialCampaign = async (db: D1Database, id: string) => {
  await ensureSpecials(db);
  const result = await db.prepare("DELETE FROM special_campaigns WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
};

const cleanText = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const cleanPrice = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 1_000_000) return null;
  return Math.round((number + Number.EPSILON) * 100) / 100;
};

const cleanBoundary = (value: unknown) => {
  if (value === "" || value == null) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000 ? number : undefined;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type ValidationResult =
  | { ok: true; campaign: SpecialCampaign }
  | { ok: false; error: string };

export const validateSpecialCampaign = (
  value: unknown,
  options: {
    id: string;
    createdAt: string;
    updatedAt: string;
    productsById?: Map<string, Product>;
  },
): ValidationResult => {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid campaign data." };
  const input = value as Record<string, unknown>;
  const title = cleanText(input.title, 100);
  const startDate = cleanText(input.startDate, 10);
  const endDate = cleanText(input.endDate, 10);

  if (!title) return { ok: false, error: "Campaign title is required." };
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    return { ok: false, error: "Choose a valid start and end date." };
  }
  if (endDate < startDate) return { ok: false, error: "End date cannot be before the start date." };

  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 100) {
    return { ok: false, error: "Select at least one product for the campaign." };
  }

  const productIds = new Set<string>();
  const items: SpecialOffer[] = [];

  for (let itemIndex = 0; itemIndex < input.items.length; itemIndex += 1) {
    const rawItem = input.items[itemIndex];
    if (!rawItem || typeof rawItem !== "object") return { ok: false, error: "Invalid campaign product." };
    const item = rawItem as Record<string, unknown>;
    const productId = cleanText(item.productId, 64);
    const displayName = cleanText(item.displayName, 120);
    const pricingMode = item.pricingMode === "tiered" ? "tiered" : "fixed";
    const product = options.productsById?.get(productId);

    if (!productId || productIds.has(productId)) {
      return { ok: false, error: "Each campaign product must be selected once." };
    }
    if (options.productsById && !product) {
      return { ok: false, error: `${displayName || productId} is no longer in the catalogue.` };
    }
    productIds.add(productId);

    let fixedPrice: number | null = null;
    let tiers: SpecialTier[] = [];

    if (pricingMode === "fixed") {
      fixedPrice = cleanPrice(item.fixedPrice);
      if (fixedPrice == null) return { ok: false, error: `Enter a valid offer price for ${displayName || productId}.` };
    } else {
      if (!Array.isArray(item.tiers) || item.tiers.length === 0 || item.tiers.length > 10) {
        return { ok: false, error: `Add at least one price tier for ${displayName || productId}.` };
      }

      const quantityRules = product ? getQuantityRules(product) : null;
      for (let tierIndex = 0; tierIndex < item.tiers.length; tierIndex += 1) {
        const rawTier = item.tiers[tierIndex];
        if (!rawTier || typeof rawTier !== "object") return { ok: false, error: "Invalid price tier." };
        const tier = rawTier as Record<string, unknown>;
        const minQty = cleanBoundary(tier.minQty);
        const maxQty = cleanBoundary(tier.maxQty);
        const price = cleanPrice(tier.price);

        if (minQty == null || minQty === undefined || maxQty === undefined || price == null) {
          return { ok: false, error: `Complete every tier for ${displayName || productId}.` };
        }
        if (quantityRules && minQty < quantityRules.minQty) {
          return { ok: false, error: `${displayName || productId} tiers must start at ${quantityRules.minQty} or higher.` };
        }
        if (quantityRules && !isQuantityOnStep(minQty, quantityRules)) {
          return { ok: false, error: `${displayName || productId} tier minimums must follow its ${quantityRules.step} quantity step.` };
        }
        if (quantityRules && maxQty != null && !isQuantityOnStep(maxQty, quantityRules)) {
          return { ok: false, error: `${displayName || productId} tier limits must follow its ${quantityRules.step} quantity step.` };
        }
        if (quantityRules?.maxQty != null && (minQty > quantityRules.maxQty || (maxQty != null && maxQty > quantityRules.maxQty))) {
          return { ok: false, error: `${displayName || productId} tiers cannot exceed its maximum order quantity.` };
        }
        if (minQty != null && maxQty != null && minQty >= maxQty) {
          return { ok: false, error: `A tier maximum must be above its minimum for ${displayName || productId}.` };
        }

        tiers.push({
          id: cleanText(tier.id, 64) || `${options.id}-${itemIndex}-${tierIndex}`,
          minQty,
          maxQty,
          price,
        });
      }

      tiers = tiers.sort((a, b) => (a.minQty ?? -1) - (b.minQty ?? -1));
      for (let tierIndex = 1; tierIndex < tiers.length; tierIndex += 1) {
        const previous = tiers[tierIndex - 1];
        const current = tiers[tierIndex];
        if (previous.maxQty == null || current.minQty == null || current.minQty < previous.maxQty) {
          return { ok: false, error: `Price tiers cannot overlap for ${displayName || productId}.` };
        }
      }
    }

    items.push({
      id: cleanText(item.id, 64) || `${options.id}-${itemIndex}`,
      productId,
      displayName,
      pricingMode,
      fixedPrice,
      tiers,
      sortOrder: itemIndex,
    });
  }

  const customMessage = cleanText(input.customMessage, 5000);

  return {
    ok: true,
    campaign: {
      id: options.id,
      title,
      subtitle: cleanText(input.subtitle, 120),
      openingLine: cleanText(input.openingLine, 300),
      startDate,
      endDate,
      validityLine: cleanText(input.validityLine, 180),
      includeYear: input.includeYear !== false,
      note: cleanText(input.note, 400),
      orderInstructions: cleanText(input.orderInstructions, 400),
      published: input.published === true,
      items,
      customMessage: customMessage || null,
      createdAt: options.createdAt,
      updatedAt: options.updatedAt,
    },
  };
};
