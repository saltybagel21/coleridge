import type { Product, StockStatus, Unit } from "../../src/shop/products";

type ValidationResult =
  | { ok: true; product: Product }
  | { ok: false; error: string };

const text = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const optionalNumber = (value: unknown) => {
  if (value === "" || value == null) return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

export const validateProduct = (
  value: unknown,
  options: { id: string; defaultSortOrder: number },
): ValidationResult => {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid product data." };
  const input = value as Record<string, unknown>;
  const name = text(input.name, 120);
  const category = text(input.category, 80);
  const note = text(input.note, 360);
  const priceLabel = text(input.priceLabel, 40);
  const price = optionalNumber(input.price);
  const unit = input.unit as Unit;
  const stockStatus = input.stockStatus as StockStatus;

  if (!name) return { ok: false, error: "Product name is required." };
  if (!category) return { ok: false, error: "Category is required." };
  if (price == null || price > 1_000_000) return { ok: false, error: "Enter a valid price." };
  if (unit !== "kg" && unit !== "each") return { ok: false, error: "Choose a valid unit." };
  if (stockStatus !== "in_stock" && stockStatus !== "out_of_stock") {
    return { ok: false, error: "Choose a valid stock status." };
  }

  const minQty = optionalNumber(input.minQty);
  const qtyStep = optionalNumber(input.qtyStep);
  const maxQty = optionalNumber(input.maxQty);
  if (maxQty != null && minQty != null && maxQty < minQty) {
    return { ok: false, error: "Maximum quantity cannot be below the minimum." };
  }

  if (input.quantityOptions != null && !Array.isArray(input.quantityOptions)) {
    return { ok: false, error: "Specific order quantities must be a list." };
  }
  const rawQuantityOptions = Array.isArray(input.quantityOptions) ? input.quantityOptions : [];
  if (rawQuantityOptions.length > 20) {
    return { ok: false, error: "Add no more than 20 specific order quantities." };
  }
  const quantityOptions = Array.from(
    new Set(
      rawQuantityOptions.map((value) => {
        const quantity = typeof value === "number" ? value : Number(value);
        return Number.isFinite(quantity) && quantity > 0 && quantity <= 1_000_000
          ? Number(quantity.toFixed(3))
          : NaN;
      }),
    ),
  ).sort((a, b) => a - b);
  if (quantityOptions.some((quantity) => !Number.isFinite(quantity))) {
    return { ok: false, error: "Enter only positive specific order quantities." };
  }

  const requestedSort = optionalNumber(input.sortOrder);
  const sortOrder = Math.round(requestedSort ?? options.defaultSortOrder);

  return {
    ok: true,
    product: {
      id: options.id,
      name,
      category,
      price,
      ...(priceLabel ? { priceLabel } : {}),
      unit,
      ...(note ? { note } : {}),
      ...(minQty != null ? { minQty } : {}),
      ...(qtyStep != null && qtyStep > 0 ? { qtyStep } : {}),
      ...(maxQty != null ? { maxQty } : {}),
      ...(quantityOptions.length ? { quantityOptions } : {}),
      stockStatus,
      enabled: input.enabled !== false,
      sortOrder,
    },
  };
};
