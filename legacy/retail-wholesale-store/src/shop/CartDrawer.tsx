import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart, getQuantityRules, formatProductName, formatQty, formatZAR } from "./CartContext";

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    setQty,
    remove,
    clear,
    subtotal,
    orderType,
    openCheckout,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-[70]"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 z-[71] flex h-full w-full flex-col border-l border-stone-800 bg-stone-950 shadow-2xl sm:w-[460px]"
          >
            <div className="flex items-center justify-between border-b border-stone-800 p-6">
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-burgundy-500">
                  {orderType} order
                </div>
                <h3 className="flex items-center gap-2 text-2xl font-serif text-stone-100">
                  <ShoppingBag size={20} /> Your Cart
                </h3>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-stone-800 bg-stone-900">
                    <ShoppingBag size={28} className="text-stone-600" />
                  </div>
                  <h4 className="mb-2 text-xl font-serif text-stone-100">Your cart is empty</h4>
                  <p className="mb-6 text-sm text-stone-500">
                    Browse our selection and add items to get started.
                  </p>
                  <button
                    onClick={closeCart}
                    className="rounded-sm border border-stone-700 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-200 transition-colors hover:bg-stone-900"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-stone-900">
                  {items.map((line) => {
                    const isKg = line.product.unit === "kg";
                    const { step, minQty, maxQty } = getQuantityRules(line.product);

                    const decrement = () => {
                      const next = parseFloat((line.qty - step).toFixed(3));
                      if (next < minQty) remove(line.product.id);
                      else setQty(line.product.id, next);
                    };

                    const increment = () => {
                      const next = parseFloat((line.qty + step).toFixed(3));
                      setQty(line.product.id, maxQty ? Math.min(maxQty, next) : next);
                    };

                    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseFloat(event.target.value);
                      if (Number.isNaN(value)) return;
                      setQty(line.product.id, value);
                    };

                    return (
                      <li key={line.product.id} className="flex gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-burgundy-500">
                            {line.product.category}
                          </div>
                          <h4 className="mb-1 font-serif leading-snug text-stone-100">
                            {formatProductName(line.product.name)}
                          </h4>
                          <div className="mb-3 text-xs text-stone-500">
                            {formatZAR(line.product.price)} / {isKg ? "kg" : "item"}
                            {maxQty && (
                              <span className="ml-1">
                                ({formatQty(minQty, "kg")} - {formatQty(maxQty, "kg")})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-sm border border-stone-800">
                              <button
                                onClick={decrement}
                                aria-label="Decrease"
                                className="flex h-8 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                min={minQty}
                                max={maxQty}
                                step={step}
                                value={line.qty}
                                onChange={handleChange}
                                className="h-8 w-16 bg-transparent text-center text-sm text-stone-100 focus:outline-none"
                              />
                              <button
                                onClick={increment}
                                aria-label="Increase"
                                className="flex h-8 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-stone-500">
                              {isKg ? "kg" : "items"}
                            </span>
                            <button
                              onClick={() => remove(line.product.id)}
                              aria-label="Remove"
                              className="ml-auto text-stone-500 transition-colors hover:text-burgundy-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="w-24 shrink-0 text-right font-serif text-stone-100">
                          {formatZAR(line.product.price * line.qty)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-stone-800 bg-stone-900/50 p-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-widest text-stone-400">Subtotal</span>
                  <span className="text-3xl font-serif text-stone-100">{formatZAR(subtotal)}</span>
                </div>
                <p className="mb-5 text-[11px] leading-relaxed text-stone-500">
                  Prices include VAT. Final totals are confirmed by our team where cut weights can
                  vary slightly.
                </p>
                <button
                  onClick={openCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-burgundy-800 py-4 text-xs font-semibold uppercase tracking-widest text-stone-100 transition-colors hover:bg-burgundy-700"
                >
                  Proceed to Checkout <ArrowRight size={14} />
                </button>
                <button
                  onClick={clear}
                  className="mt-3 w-full py-3 text-[11px] font-semibold uppercase tracking-widest text-stone-500 transition-colors hover:text-burgundy-500"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
