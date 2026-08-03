import { useEffect, useState } from "react";
import type { OrderType, Product } from "./products";

type CatalogueResponse = {
  products: Product[];
};

const REFRESH_MS = 60_000;

const isCatalogueResponse = (value: unknown): value is CatalogueResponse => {
  if (!value || typeof value !== "object") return false;
  return Array.isArray((value as CatalogueResponse).products);
};

export const useLiveProducts = (baseProducts: Product[], _orderType?: OrderType) => {
  const [products, setProducts] = useState<Product[]>(baseProducts);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const schedule = () => {
      if (cancelled) return;
      timeoutId = window.setTimeout(load, REFRESH_MS);
    };

    const load = async () => {
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }

      try {
        const response = await fetch(`/api/products?v=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Catalogue request failed with ${response.status}`);

        const data: unknown = await response.json();
        if (!isCatalogueResponse(data)) throw new Error("Catalogue response was invalid");
        if (!cancelled) setProducts(data.products);
      } catch (error) {
        console.warn("Live catalogue unavailable; using the built-in catalogue.", error);
      } finally {
        schedule();
      }
    };

    const refreshNow = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      void load();
    };

    void load();
    window.addEventListener("focus", refreshNow);
    document.addEventListener("visibilitychange", refreshNow);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("focus", refreshNow);
      document.removeEventListener("visibilitychange", refreshNow);
    };
  }, [baseProducts]);

  return products;
};
