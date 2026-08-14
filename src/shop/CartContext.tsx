import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { resolveProductPrice } from "../shared/specials";
import type { OrderType, Product } from "./products";

export interface CartLine {
  product: Product;
  qty: number;
  orderType: OrderType;
}

export interface QuantityRules {
  minQty: number;
  step: number;
  maxQty?: number;
}

export const getLinePricing = (product: Product, qty: number) => {
  const resolved = resolveProductPrice(product, qty);
  return {
    ...resolved,
    lineTotal: resolved.unitPrice * qty,
  };
};

export const getQuantityRules = (product: Product): QuantityRules => {
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
  const inferredLooseStep =
    /any quantity|made on order|cut size requested|single vacuum|individually wrapped|specify weight|wrapped individually/.test(note)
      ? 0.1
      : 0.1;

  return {
    minQty: product.minQty ?? inferredPackRule?.minQty ?? 0.5,
    step: product.qtyStep ?? inferredPackRule?.step ?? inferredLooseStep,
    maxQty: product.maxQty,
  };
};

const sanitizeQty = (product: Product, qty: number) => {
  const { minQty, step, maxQty } = getQuantityRules(product);

  if (!Number.isFinite(qty)) return minQty;

  const stepsFromMin = Math.round((qty - minQty) / step);
  const snapped = minQty + Math.max(0, stepsFromMin) * step;
  const rounded = parseFloat(snapped.toFixed(3));
  const clampedMin = Math.max(minQty, rounded);

  if (maxQty != null) {
    return parseFloat(Math.min(maxQty, clampedMin).toFixed(3));
  }

  return clampedMin;
};

interface CartState {
  items: CartLine[];
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  add: (p: Product, orderType: OrderType, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  syncProducts: (products: Product[]) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const CartCtx = createContext<CartState | null>(null);
const STORAGE = "coleridge-cart-v2";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("retail");
  const [isOpen, setOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

  // Load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.items)) setItems(saved.items);
      setOrderType("retail");
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify({ items, orderType })); } catch {}
  }, [items, orderType]);

  // Clear cart when switching modes — retail and wholesale products have different IDs/prices
  const handleSetOrderType = (_type: OrderType) => {
    setOrderType("retail");
  };

  const add: CartState["add"] = (p, ot, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(l => l.product.id === p.id);
      if (existing) {
        return prev.map(l =>
          l.product.id === p.id
            ? { ...l, qty: sanitizeQty(p, l.qty + qty) }
            : l
        );
      }
      return [...prev, { product: p, qty: sanitizeQty(p, qty), orderType: ot }];
    });
    setOpen(true);
  };

  const setQty: CartState["setQty"] = (id, qty) => {
    if (qty <= 0) return remove(id);
    setItems(prev =>
      prev.map(l =>
        l.product.id === id
          ? { ...l, qty: sanitizeQty(l.product, qty) }
          : l
      )
    );
  };

  const remove: CartState["remove"] = (id) => {
    setItems(prev => prev.filter(l => l.product.id !== id));
  };

  const syncProducts = useCallback<CartState["syncProducts"]>((products) => {
    const latest = new Map<string, Product>(
      products.map((product): [string, Product] => [product.id, product]),
    );
    setItems((current) =>
      current.flatMap((line) => {
        const product = latest.get(line.product.id);
        if (!product) return [];
        return [{ ...line, product, qty: sanitizeQty(product, line.qty) }];
      }),
    );
  }, []);

  const clear = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, line) => sum + getLinePricing(line.product, line.qty).lineTotal, 0),
    [items]
  );
  const count = useMemo(() => items.length, [items]);

  const value: CartState = {
    items, orderType, setOrderType: handleSetOrderType,
    add, setQty, remove, syncProducts, clear,
    subtotal, count,
    isOpen, openCart: () => setOpen(true), closeCart: () => setOpen(false),
    isCheckoutOpen,
    openCheckout: () => { setCheckoutOpen(true); setOpen(false); },
    closeCheckout: () => setCheckoutOpen(false),
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

export const formatZAR = (n: number) =>
  "R" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const formatProductName = (name: string) =>
  name.replace(/\s(\d+(?:\.\d+)?)(kg|g)\b/gi, (match, amount: string, unit: string, offset: number, fullName: string) => {
    const prefix = fullName.slice(0, offset);
    const isAlreadyGrouped = prefix.lastIndexOf("(") > prefix.lastIndexOf(")");
    const followsPackMultiplier = prefix.trimEnd().toLowerCase().endsWith("x");

    if (isAlreadyGrouped || followsPackMultiplier) {
      return match;
    }

    return ` (${amount}${unit.toLowerCase()})`;
  });

export const formatQty = (qty: number, unit: Product["unit"]) => {
  const clean = Number.isInteger(qty) ? qty.toString() : qty.toFixed(1).replace(/\.0$/, "");
  return unit === "kg" ? `${clean} kg` : `${clean} item${qty === 1 ? "" : "s"}`;
};
