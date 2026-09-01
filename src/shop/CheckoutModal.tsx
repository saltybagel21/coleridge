import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import { useCart, getCartLinePacks, getLinePricing, formatProductName, formatQty, formatZAR } from "./CartContext";

const BUSINESS_WHATSAPP_NUMBER = "27611275756";
const DELIVERY_MINIMUM = 300;
const STELLENBOSCH_DELIVERY_TERMS = ["stellenbosch", "cloetesville"];
const CUSTOMER_DETAILS_STORAGE = "coleridge-customer-details-v1";

interface CheckoutForm {
  fullName: string;
  phone: string;
  email: string;
  company: string;
  fulfilment: "collection" | "delivery";
  address: string;
  notes: string;
}

const empty: CheckoutForm = {
  fullName: "",
  phone: "",
  email: "",
  company: "",
  fulfilment: "collection",
  address: "",
  notes: "",
};

const readRememberedDetails = (): CheckoutForm => {
  if (typeof window === "undefined") return empty;
  try {
    const saved = JSON.parse(window.localStorage.getItem(CUSTOMER_DETAILS_STORAGE) ?? "null");
    if (!saved || typeof saved !== "object") return empty;
    return {
      fullName: typeof saved.fullName === "string" ? saved.fullName : "",
      phone: typeof saved.phone === "string" ? saved.phone : "",
      email: typeof saved.email === "string" ? saved.email : "",
      company: typeof saved.company === "string" ? saved.company : "",
      fulfilment: saved.fulfilment === "delivery" ? "delivery" : "collection",
      address: typeof saved.address === "string" ? saved.address : "",
      notes: "",
    };
  } catch {
    return empty;
  }
};

const formatPackBreakdown = (packs: number[], unit: "kg" | "each") => {
  const counts = new Map<number, number>();
  packs.forEach((pack) => counts.set(pack, (counts.get(pack) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([pack, count]) => `${formatQty(pack, unit)}${count > 1 ? ` x ${count}` : ""}`)
    .join(" + ");
};

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, closeCheckout, items, subtotal } = useCart();
  const [form, setForm] = useState<CheckoutForm>(readRememberedDetails);
  const [rememberDetails, setRememberDetails] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const isOutsideStellenboschDelivery =
    form.fulfilment === "delivery" &&
    form.address.trim().length > 0 &&
    !STELLENBOSCH_DELIVERY_TERMS.some((term) =>
      form.address.trim().toLowerCase().includes(term)
    );

  const update = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 9) {
      nextErrors.phone = "Valid phone required";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Valid email required";
    }
    if (form.fulfilment === "delivery" && !form.address.trim()) {
      nextErrors.address = "Required for delivery";
    }
    if (
      isOutsideStellenboschDelivery &&
      subtotal < DELIVERY_MINIMUM
    ) {
      nextErrors.fulfilment = `Delivery outside Stellenbosch requires a minimum order of ${formatZAR(DELIVERY_MINIMUM)}.`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildOrderSummary = () => {
    const lines = items
      .map((line) => {
        const pricing = getLinePricing(line.product, line.qty);
        const special = pricing.isSpecial ? ` _(${pricing.special?.campaignTitle || "Special"})_` : "";
        const packs = getCartLinePacks(line);
        const packDetail = packs.length ? `\n  Packs: ${formatPackBreakdown(packs, line.product.unit)}` : "";
        const packingNote = line.customerNote?.trim() ? `\n  Packing note: ${line.customerNote.trim().replace(/\s+/g, " ")}` : "";
        return `- *${formatProductName(line.product.name)}* - ${formatQty(line.qty, line.product.unit)} @ ${pricing.unitPrice === 0 && line.product.priceLabel ? line.product.priceLabel : formatZAR(pricing.unitPrice)} = ${pricing.unitPrice === 0 && line.product.priceLabel ? "To confirm" : formatZAR(pricing.lineTotal)}${special}${packDetail}${packingNote}`;
      })
      .join("\n");

    const detailLines = [
      `Name: ${form.fullName}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email.trim() || "Not provided"}`,
      `Company: ${form.company.trim() || "-"}`,
      `Fulfilment: ${form.fulfilment === "collection" ? "Collection" : "Delivery"}`,
    ];

    if (form.fulfilment === "delivery") {
      detailLines.push(`Address: ${form.address.trim()}`);
      if (isOutsideStellenboschDelivery) {
        detailLines.push(
          `Delivery note: Delivery outside Stellenbosch requires a minimum order of ${formatZAR(DELIVERY_MINIMUM)}.`
        );
      }
    }

    return `*New Online Order*
_Coleridge Meat Online Store_

*Customer details*
${detailLines.join("\n")}

*Order summary*
${lines}

*Estimated total:* ${formatZAR(subtotal)}
Final total is confirmed once weights, availability, ask-for-price items and pack sizes are checked.
${form.fulfilment === "delivery" ? "EFT payment must reflect before the order is loaded for delivery." : ""}

*Notes*
${form.notes.trim() || "-"}

_No payment is taken online. Please confirm this order and we will finalize the details with the customer._`;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || items.length === 0) return;
    setStatus("submitting");

    try {
      if (rememberDetails) {
        window.localStorage.setItem(CUSTOMER_DETAILS_STORAGE, JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          fulfilment: form.fulfilment,
          address: form.address.trim(),
        }));
      } else {
        window.localStorage.removeItem(CUSTOMER_DETAILS_STORAGE);
      }
      const body = buildOrderSummary();
      const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`;
      const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      if (!opened) {
        window.location.href = whatsappUrl;
      }

      setStatus("success");
    } catch {
      setStatus("idle");
    }
  };

  const handleClose = () => {
    closeCheckout();
    window.setTimeout(() => {
      setStatus("idle");
      setForm(readRememberedDetails());
      setErrors({});
    }, 400);
  };

  const inputBase =
    "w-full px-4 py-3 bg-stone-950 border rounded-sm text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none transition-colors";
  const inputOk = "border-stone-800 focus:border-burgundy-700";
  const inputErr = "border-burgundy-600 focus:border-burgundy-500";

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-stone-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[81] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8"
            onClick={handleClose}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="my-auto w-full max-w-2xl rounded-sm border border-stone-800 bg-stone-900 shadow-2xl"
            >
              {status === "success" ? (
                <div className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-burgundy-700 bg-burgundy-900/30"
                  >
                    <CheckCircle2 className="text-burgundy-400" size={40} />
                  </motion.div>
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-burgundy-500">
                    WhatsApp Ready
                  </div>
                  <h3 className="mb-4 text-3xl font-serif text-stone-100 md:text-4xl">Almost there.</h3>
                  <p className="mx-auto mb-8 max-w-md leading-relaxed text-stone-400">
                    Your order draft has been opened in WhatsApp for{" "}
                    <span className="text-stone-200">061 127 5756</span>. Press send there if
                    needed, then our team will confirm availability, final weights and collection or
                    delivery details with you directly.
                  </p>
                  <button
                    onClick={handleClose}
                    className="rounded-sm bg-burgundy-800 px-8 py-4 text-xs font-semibold uppercase tracking-widest text-stone-100 transition-colors hover:bg-burgundy-700"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="flex items-start justify-between gap-4 border-b border-stone-800 p-6 sm:p-8">
                    <div>
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-burgundy-500">
                        Online checkout
                      </div>
                      <h3 className="text-2xl font-serif text-stone-100 sm:text-3xl">
                        Confirm your details
                      </h3>
                      <p className="mt-2 text-sm text-stone-500">
                        We&apos;ll prepare your order as a WhatsApp message to Stefan for quick
                        confirmation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-800 text-stone-400 transition-colors hover:text-stone-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="max-h-[60vh] space-y-5 overflow-y-auto p-6 sm:p-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                          Full Name *
                        </label>
                        <input
                          autoComplete="name"
                          value={form.fullName}
                          onChange={(event) => update("fullName", event.target.value)}
                          className={`${inputBase} ${errors.fullName ? inputErr : inputOk}`}
                          placeholder="Jane Smith"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-burgundy-400">{errors.fullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={form.phone}
                          onChange={(event) => update("phone", event.target.value)}
                          className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
                          placeholder="061 234 5678"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-xs text-burgundy-400">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(event) => update("email", event.target.value)}
                          className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                          placeholder="you@example.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-burgundy-400">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                          Company (optional)
                        </label>
                        <input
                          autoComplete="organization"
                          value={form.company}
                          onChange={(event) => update("company", event.target.value)}
                          className={`${inputBase} ${inputOk}`}
                          placeholder="Business name, if applicable"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                        Fulfilment *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["collection", "delivery"] as const).map((option) => (
                          <button
                            type="button"
                            key={option}
                            onClick={() => update("fulfilment", option)}
                            className={`rounded-sm border py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                              form.fulfilment === option
                                ? "border-burgundy-700 bg-burgundy-800 text-stone-100"
                                : "border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200"
                            }`}
                          >
                            {option === "collection" ? "Collect In-Store" : "Arrange Delivery"}
                          </button>
                        ))}
                      </div>
                      {errors.fulfilment && (
                        <p className="mt-2 text-xs text-burgundy-400">{errors.fulfilment}</p>
                      )}
                      {form.fulfilment === "delivery" && (
                        <p className="mt-2 text-xs leading-relaxed text-stone-500">
                          Stellenbosch delivery is free. Kraaifontein, Brackenfell, Durbanville,
                          Joostebergvlakte and Kuils River are R50, and delivery outside
                          Stellenbosch starts from {formatZAR(DELIVERY_MINIMUM)}.
                        </p>
                      )}
                    </div>

                    {form.fulfilment === "delivery" && (
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                          Delivery Address *
                        </label>
                        <input
                          autoComplete="street-address"
                          value={form.address}
                          onChange={(event) => update("address", event.target.value)}
                          className={`${inputBase} ${errors.address ? inputErr : inputOk}`}
                          placeholder="Street, suburb, city, postcode"
                        />
                        {errors.address && (
                          <p className="mt-1 text-xs text-burgundy-400">{errors.address}</p>
                        )}
                      </div>
                    )}

                    <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-stone-800 bg-stone-950/55 p-4">
                      <input type="checkbox" checked={rememberDetails} onChange={(event) => setRememberDetails(event.target.checked)} className="mt-0.5 h-4 w-4 accent-burgundy-700" />
                      <span>
                        <span className="block text-sm font-medium text-stone-200">Remember my details on this device</span>
                        <span className="mt-1 block text-xs leading-5 text-stone-500">Your contact and delivery details stay in this browser so the next order is quicker.</span>
                      </span>
                    </label>

                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                        Notes / Special Requests
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={(event) => update("notes", event.target.value)}
                        rows={3}
                        className={`${inputBase} ${inputOk} resize-none`}
                        placeholder="Cut preferences, collection time, allergies, etc."
                      />
                    </div>

                    <div className="rounded-sm border border-stone-800 bg-stone-950 p-4">
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-burgundy-500">
                        Order summary
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        {items.map((line) => {
                          const pricing = getLinePricing(line.product, line.qty);
                          const packs = getCartLinePacks(line);
                          return (
                          <li key={line.product.id} className="flex justify-between gap-3 text-stone-300">
                            <span className="min-w-0">
                              <span className="block truncate">{formatQty(line.qty, line.product.unit)} - {formatProductName(line.product.name)}{pricing.isSpecial && <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-300">Special</span>}</span>
                              {packs.length ? <span className="mt-1 block text-xs text-stone-500">{formatPackBreakdown(packs, line.product.unit)}</span> : null}
                              {line.customerNote?.trim() ? <span className="mt-1 block text-xs italic text-stone-500">{line.customerNote.trim()}</span> : null}
                            </span>
                            <span className="shrink-0 text-stone-400">{formatZAR(pricing.lineTotal)}</span>
                          </li>
                          );
                        })}
                      </ul>
                      <div className="mt-4 flex items-baseline justify-between border-t border-stone-800 pt-4">
                        <span className="text-xs uppercase tracking-widest text-stone-400">Total</span>
                        <span className="text-2xl font-serif text-stone-100">{formatZAR(subtotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-stone-800 bg-stone-950/40 p-6 sm:p-8">
                    <button
                      type="submit"
                      disabled={status === "submitting" || items.length === 0}
                      className="flex w-full items-center justify-center gap-2 rounded-sm bg-burgundy-800 py-4 text-xs font-semibold uppercase tracking-widest text-stone-100 transition-colors hover:bg-burgundy-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "submitting" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Opening WhatsApp...
                        </>
                      ) : (
                        <>
                          <MessageCircle size={16} /> Submit on WhatsApp
                        </>
                      )}
                    </button>
                    <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-500">
                      No payment is taken online. Your order opens in WhatsApp so our team can
                      confirm availability, weights and final totals with you first. Delivery orders
                      are only loaded once EFT payment reflects.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
