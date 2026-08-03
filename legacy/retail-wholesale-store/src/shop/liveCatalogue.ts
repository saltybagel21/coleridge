import { useEffect, useMemo, useState } from "react";
import type { OrderType, Product, StockStatus } from "./products";

type LiveCatalogueConfig = {
  sheetCsvUrl?: string;
  refreshSeconds?: number;
};

type LiveProductOverride = {
  id: string;
  orderType: OrderType;
  price?: number;
  priceLabel?: string;
  stockStatus?: StockStatus;
  enabled?: boolean;
  note?: string;
};

const CONFIG_URL = "/live-catalogue-config.json";
const MIN_REFRESH_SECONDS = 20;
const DEFAULT_REFRESH_SECONDS = 60;

const normalizeHeader = (header: string) =>
  header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const parseCsv = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
};

const parseBoolean = (value: string | undefined) => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["true", "yes", "y", "1", "enabled", "show"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "disabled", "hide"].includes(normalized)) return false;
  return undefined;
};

const parsePrice = (value: string | undefined) => {
  const cleaned = value?.replace(/R/gi, "").replace(/\s/g, "").replace(",", ".").trim();
  if (!cleaned) return undefined;
  const price = Number.parseFloat(cleaned);
  return Number.isFinite(price) ? price : undefined;
};

const normalizeStockStatus = (value: string | undefined): StockStatus | undefined => {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return undefined;

  if (["in_stock", "instock", "available", "yes", "true"].includes(normalized)) return "in_stock";
  if (["out_of_stock", "outofstock", "sold_out", "soldout", "no", "false"].includes(normalized)) {
    return "out_of_stock";
  }
  if (
    [
      "made_on_order",
      "made_to_order",
      "madeonorder",
      "on_order",
      "onorder",
      "ask",
      "ask_availability",
      "ask_for_availability",
      "availability",
      "fresh_counter",
      "fresh",
    ].includes(normalized)
  ) {
    return "in_stock";
  }

  return undefined;
};

const rowValue = (row: Record<string, string>, keys: string[]) =>
  keys.map((key) => row[normalizeHeader(key)]).find((value) => value != null);

const parseOverrides = (csv: string) => {
  const rows = parseCsv(csv);
  const [headers, ...dataRows] = rows;
  if (!headers?.length) return new Map<string, LiveProductOverride>();

  const normalizedHeaders = headers.map(normalizeHeader);
  const overrides = new Map<string, LiveProductOverride>();

  dataRows.forEach((cells) => {
    const row = normalizedHeaders.reduce<Record<string, string>>((record, header, index) => {
      record[header] = cells[index]?.trim() ?? "";
      return record;
    }, {});

    const id = rowValue(row, ["productId", "id"])?.trim();
    const orderType = rowValue(row, ["orderType", "type"])?.trim().toLowerCase();
    if (!id || (orderType !== "retail" && orderType !== "wholesale")) return;

    const price = parsePrice(rowValue(row, ["price", "currentPrice"]));
    const priceLabel = rowValue(row, ["priceLabel", "label"])?.trim();
    const stockStatus = normalizeStockStatus(rowValue(row, ["stockStatus", "stock", "inStock"]));
    const enabled = parseBoolean(rowValue(row, ["enabled", "showOnSite", "visible"]));
    const note = rowValue(row, ["note", "noteOverride", "productNote"])?.trim();

    overrides.set(`${orderType}:${id}`, {
      id,
      orderType,
      ...(price != null ? { price } : {}),
      ...(priceLabel != null ? { priceLabel: priceLabel || undefined } : {}),
      ...(stockStatus ? { stockStatus } : {}),
      ...(enabled != null ? { enabled } : {}),
      ...(note ? { note } : {}),
    });
  });

  return overrides;
};

const fetchLiveCatalogueConfig = async () => {
  const response = await fetch(`${CONFIG_URL}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as LiveCatalogueConfig;
};

export const useLiveProducts = (baseProducts: Product[], orderType: OrderType) => {
  const [overrides, setOverrides] = useState<Map<string, LiveProductOverride>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const load = async () => {
      try {
        const config = await fetchLiveCatalogueConfig();
        const sheetCsvUrl = config?.sheetCsvUrl?.trim();
        if (!sheetCsvUrl) {
          setOverrides(new Map());
          return;
        }

        const separator = sheetCsvUrl.includes("?") ? "&" : "?";
        const response = await fetch(`${sheetCsvUrl}${separator}cacheBust=${Date.now()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Live catalogue fetch failed: ${response.status}`);

        const csv = await response.text();
        if (!cancelled) setOverrides(parseOverrides(csv));

        const refreshSeconds = Math.max(
          MIN_REFRESH_SECONDS,
          config?.refreshSeconds ?? DEFAULT_REFRESH_SECONDS,
        );
        timeoutId = window.setTimeout(load, refreshSeconds * 1000);
      } catch (error) {
        console.warn("Live catalogue unavailable; using built-in products.", error);
        timeoutId = window.setTimeout(load, DEFAULT_REFRESH_SECONDS * 1000);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return useMemo(
    () =>
      baseProducts
        .map((product) => {
          const override = overrides.get(`${orderType}:${product.id}`);
          if (!override) return product;

          const nextProduct: Product = {
            ...product,
            ...override,
            priceLabel: override.priceLabel !== undefined ? override.priceLabel : product.priceLabel,
          };

          if (override.price != null && override.price > 0 && override.priceLabel === undefined) {
            delete nextProduct.priceLabel;
          }

          return nextProduct;
        })
        .filter((product) => product.enabled !== false),
    [baseProducts, orderType, overrides],
  );
};
