import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { resolveProductPrice } from "../shared/specials";
import type { OrderType, Product } from "./products";
import { getQuantityRules, sanitizeProductQuantity } from "./quantityRules";

export { getQuantityRules } from "./quantityRules";

export interface CartLine {
  product: Product;
  qty: number;
  orderType: OrderType;
}

export const getLinePricing = (product: Product, qty: number) => {
  const resolved = resolveProductPrice(product, qty);
  return {
    ...resolved,
    lineTotal: resolved.unitPrice * qty,
  };
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
        const hasSpecificOptions = Boolean(getQuantityRules(p).options?.length);
        return prev.map(l =>
          l.product.id === p.id
            ? { ...l, product: p, qty: sanitizeProductQuantity(p, hasSpecificOptions ? qty : l.qty + qty) }
            : l
        );
      }
      return [...prev, { product: p, qty: sanitizeProductQuantity(p, qty), orderType: ot }];
    });
    setOpen(true);
  };

  const setQty: CartState["setQty"] = (id, qty) => {
    if (qty <= 0) return remove(id);
    setItems(prev =>
      prev.map(l =>
        l.product.id === id
          ? { ...l, qty: sanitizeProductQuantity(l.product, qty) }
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
        return [{ ...line, product, qty: sanitizeProductQuantity(product, line.qty) }];
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
  const clean = Number.isInteger(qty)
    ? qty.toString()
    : qty.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return unit === "kg" ? `${clean} kg` : `${clean} item${qty === 1 ? "" : "s"}`;
};
