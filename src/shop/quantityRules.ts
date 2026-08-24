import type { Product } from "./products";

export interface QuantityRules {
  minQty: number;
  step: number;
  maxQty?: number;
  options?: number[];
}

const cleanQuantityOptions = (product: Product) =>
  Array.from(
    new Set(
      (product.quantityOptions ?? [])
        .filter((option) => Number.isFinite(option) && option > 0)
        .map((option) => Number(option.toFixed(3))),
    ),
  ).sort((a, b) => a - b);

export const getQuantityRules = (product: Product): QuantityRules => {
  const options = cleanQuantityOptions(product);
  if (options.length) {
    return {
      minQty: options[0],
      step: options.length > 1 ? Number((options[1] - options[0]).toFixed(3)) : 1,
      maxQty: options[options.length - 1],
      options,
    };
  }

  const isKg = product.unit === "kg";
  const note = (product.note ?? "").toLowerCase();

  if (!isKg) {
    return {
      minQty: product.minQty ?? 1,
      step: product.qtyStep ?? 1,
      maxQty: product.maxQty,
    };
  }

  const inferPackRule = () => {
    if (/5kg/.test(note)) return { minQty: 5, step: 5 };
    if (/2\.5kg/.test(note)) return { minQty: 2.5, step: 2.5 };
    if (/2kg/.test(note)) return { minQty: 2, step: 2 };
    if (/1kg bags?/.test(note)) return { minQty: 1, step: 1 };
    if (/700g/.test(note)) return { minQty: 0.7, step: 0.1 };
    if (/400g/.test(note)) return { minQty: 0.4, step: 0.1 };
    if (/300g/.test(note)) return { minQty: 0.3, step: 0.1 };
    if (/100g/.test(note)) return { minQty: 0.1, step: 0.1 };
    return null;
  };

  const inferredPackRule = inferPackRule();
  return {
    minQty: product.minQty ?? inferredPackRule?.minQty ?? 0.5,
    step: product.qtyStep ?? inferredPackRule?.step ?? 0.1,
    maxQty: product.maxQty,
  };
};

export const isQuantityOnStep = (quantity: number, rules: QuantityRules) => {
  if (rules.options?.length) {
    return rules.options.some((option) => Math.abs(option - quantity) < 0.0001);
  }
  if (quantity < rules.minQty) return false;
  const steps = (quantity - rules.minQty) / rules.step;
  return Math.abs(steps - Math.round(steps)) < 0.0001;
};

export const sanitizeProductQuantity = (product: Product, quantity: number) => {
  const { minQty, step, maxQty, options } = getQuantityRules(product);
  if (!Number.isFinite(quantity)) return minQty;

  if (options?.length) {
    return options.reduce((closest, option) =>
      Math.abs(option - quantity) < Math.abs(closest - quantity) ? option : closest,
    );
  }

  const stepsFromMin = Math.round((quantity - minQty) / step);
  const snapped = minQty + Math.max(0, stepsFromMin) * step;
  const rounded = Number(snapped.toFixed(3));
  const clampedMin = Math.max(minQty, rounded);

  return maxQty == null ? clampedMin : Number(Math.min(maxQty, clampedMin).toFixed(3));
};
