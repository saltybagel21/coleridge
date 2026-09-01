import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { resolveProductPrice } from "../shared/specials";
import type { OrderType, Product } from "./products";
import { getQuantityRules, sanitizeProductQuantity } from "./quantityRules";

export { getQuantityRules } from "./quantityRules";

export interface CartLine {
  product: Product;
  qty: number;
  orderType: OrderType;
  packs?: number[];
  customerNote?: string;
}

const quantitiesMatch = (left: number, right: number) => Math.abs(left - right) < 0.0001;

const sumPacks = (packs: number[]) =>
  Number(packs.reduce((total, pack) => total + pack, 0).toFixed(3));

const normaliseLinePacks = (product: Product, line: Pick<CartLine, "qty" | "packs">) => {
  const options = getQuantityRules(product).options;
  if (!options?.length) return undefined;

  const validPacks = (line.packs ?? []).filter((pack) =>
    options.some((option) => quantitiesMatch(option, pack)),
  );
  if (validPacks.length) return validPacks;

  const matchingPack = options.find((option) => quantitiesMatch(option, line.qty));
  return [matchingPack ?? options[0]];
};

export const getCartLinePacks = (line: CartLine) =>
  normaliseLinePacks(line.product, line) ?? [];

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
  addPack: (id: string, pack: number) => void;
  removePack: (id: string, pack: number) => void;
  setLineNote: (id: string, note: string) => void;
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
      const rules = getQuantityRules(p);
      const pack = rules.options?.find((option) => quantitiesMatch(option, qty)) ?? rules.options?.[0];
      const existing = prev.find(l => l.product.id === p.id);
      if (existing) {
        if (pack != null) {
          const packs = [...(normaliseLinePacks(p, existing) ?? []), pack];
          const nextQty = sumPacks(packs);
          if (rules.maxQty != null && nextQty > rules.maxQty) return prev;
          return prev.map((line) =>
            line.product.id === p.id ? { ...line, product: p, packs, qty: nextQty } : line,
          );
        }
        return prev.map(l =>
          l.product.id === p.id
            ? { ...l, product: p, qty: sanitizeProductQuantity(p, l.qty + qty) }
            : l
        );
      }
      if (pack != null) {
        return [...prev, { product: p, qty: pack, packs: [pack], orderType: ot }];
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

  const addPack: CartState["addPack"] = (id, pack) => {
    setItems((current) => current.map((line) => {
      if (line.product.id !== id) return line;
      const rules = getQuantityRules(line.product);
      const option = rules.options?.find((candidate) => quantitiesMatch(candidate, pack));
      if (option == null) return line;
      const packs = [...(normaliseLinePacks(line.product, line) ?? []), option];
      const qty = sumPacks(packs);
      return rules.maxQty != null && qty > rules.maxQty ? line : { ...line, packs, qty };
    }));
  };

  const removePack: CartState["removePack"] = (id, pack) => {
    setItems((current) => current.flatMap((line) => {
      if (line.product.id !== id) return [line];
      const packs = normaliseLinePacks(line.product, line) ?? [];
      const removeIndex = packs.findIndex((candidate) => quantitiesMatch(candidate, pack));
      if (removeIndex < 0) return [line];
      const nextPacks = packs.filter((_, index) => index !== removeIndex);
      return nextPacks.length ? [{ ...line, packs: nextPacks, qty: sumPacks(nextPacks) }] : [];
    }));
  };

  const setLineNote: CartState["setLineNote"] = (id, note) => {
    setItems((current) => current.map((line) =>
      line.product.id === id ? { ...line, customerNote: note.slice(0, 240) } : line,
    ));
  };

  const syncProducts = useCallback<CartState["syncProducts"]>((products) => {
    const latest = new Map<string, Product>(
      products.map((product): [string, Product] => [product.id, product]),
    );
    setItems((current) =>
      current.flatMap((line) => {
        const product = latest.get(line.product.id);
        if (!product) return [];
        const packs = normaliseLinePacks(product, line);
        return [{
          ...line,
          product,
          qty: packs ? sumPacks(packs) : sanitizeProductQuantity(product, line.qty),
          ...(packs ? { packs } : { packs: undefined }),
        }];
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
    add, setQty, addPack, removePack, setLineNote, remove, syncProducts, clear,
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
