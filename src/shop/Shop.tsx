import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Plus,
  Store,
  Building2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  ShieldCheck,
  Clock3,
  Sparkles,
  LockKeyhole,
  MessageCircle,
  KeyRound,
  Camera,
  X,
} from "lucide-react";
import {
  PUBLIC_PRODUCTS,
  RETAIL_PRODUCTS,
  WHOLESALE_PRODUCTS,
  CATEGORY_ORDER,
} from "./products";
import type { Product } from "./products";
import { useLiveProducts } from "./liveCatalogue";
import { useCart, getLinePricing, getQuantityRules, formatProductName, formatQty, formatZAR } from "./CartContext";
import { formatTierRange, getLowestSpecialPrice, getPrimarySpecial } from "../shared/specials";

type OrderMode = "retail" | "wholesale";

type ShopFocusTarget = {
  orderType?: OrderMode;
  category?: string;
  query?: string;
};

const formatCampaignDateForShop = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
};

const SHOP_FOCUS_STORAGE = "coleridge-shop-focus-v1";
const SHOP_FOCUS_EVENT = "coleridge:shop-focus";
const WHOLESALE_ACCESS_EVENT = "coleridge:wholesale-access";
const WHOLESALE_ACCESS_MODAL_EVENT = "coleridge:wholesale-access-modal";

export const queueShopFocus = (target: ShopFocusTarget) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHOP_FOCUS_STORAGE, JSON.stringify(target));
  } catch {}
  window.dispatchEvent(new CustomEvent(SHOP_FOCUS_EVENT));
};

const emitWholesaleAccessState = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WHOLESALE_ACCESS_EVENT));
};

export const openWholesaleAccessModal = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WHOLESALE_ACCESS_MODAL_EVENT));
};

const consumeShopFocus = (): ShopFocusTarget | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SHOP_FOCUS_STORAGE);
    if (!raw) return null;
    window.localStorage.removeItem(SHOP_FOCUS_STORAGE);
    return JSON.parse(raw) as ShopFocusTarget;
  } catch {
    return null;
  }
};

const CATEGORY_VISUALS: Record<
  string,
  { image?: string; tagline: string; objectPosition?: string }
> = {
  Beef: {
    image: "/images/site/shop-category-beef.webp",
    tagline: "Premium cuts, aged and butchered in-store.",
    objectPosition: "center 40%",
  },
  Lamb: {
    image: "/images/site/shop-category-lamb.webp",
    tagline: "Free-range, tender and full of flavour.",
    objectPosition: "center 50%",
  },
  Chicken: {
    image: "/images/site/shop-category-chicken.webp",
    tagline: "Whole birds, fillets, wings and braai cuts.",
    objectPosition: "center 52%",
  },
  "Ready to Cook": {
    image: "/images/site/shop-category-ready-to-cook.webp",
    tagline: "Marinated, seasoned and ready for the fire.",
    objectPosition: "center 40%",
  },
  Ostrich: {
    image: "/images/site/shop-category-ostrich.webp",
    tagline: "Lean, distinctive and proudly South African.",
    objectPosition: "center 40%",
  },
  Fish: {
    image: "/images/site/shop-category-fish.webp",
    tagline: "Fresh catches, sourced and ready to cook.",
    objectPosition: "center 62%",
  },
  "Cheese & Pantry": {
    image: "/images/site/shop-category-cheese-board.jpg",
    tagline: "Artisan selections and essential pantry lines.",
    objectPosition: "center 55%",
  },
  "Budget Items": {
    image: "/images/site/shop-category-budget.webp",
    tagline: "Quality cuts, exceptional value.",
    objectPosition: "center 40%",
  },
  Minces: {
    image: "/images/site/shop-category-minces.webp",
    tagline: "Steak-quality mince, vacuum packed and consistent.",
    objectPosition: "center 50%",
  },
  Cheese: {
    image: "/images/site/shop-category-cheese-board.jpg",
    tagline: "Artisan and bulk cheese for the trade.",
    objectPosition: "center 55%",
  },
  "Bulk & Pantry": {
    image: "/images/site/shop-category-bulk-pantry.webp",
    tagline: "Large-format pantry lines built for the trade.",
    objectPosition: "center 52%",
  },
  "Beef Primals": {
    image: "/images/site/shop-category-beef.webp",
    tagline: "Fresh vacuum-packed primals for dependable quality.",
    objectPosition: "center 40%",
  },
  "Prepared Beef": {
    image: "/images/site/shop-category-ready-to-cook.webp",
    tagline: "Portioned, cleaned and prepared by our butchery team.",
    objectPosition: "center 40%",
  },
  "Lamb & Mutton": {
    image: "/images/site/shop-category-lamb.webp",
    tagline: "Whole lamb, braai cuts, roasts and comforting stews.",
    objectPosition: "center 50%",
  },
  Mince: {
    image: "/images/site/shop-category-minces.webp",
    tagline: "Fresh steak mince in a choice of lean blends.",
    objectPosition: "center 50%",
  },
  "Boerewors & Sausages": {
    image: "/images/selection-boerewors.webp",
    tagline: "House recipes for breakfasts, rolls and the braai.",
    objectPosition: "center 48%",
  },
  "Patties & Meatballs": {
    image: "/images/site/shop-category-patties-meatballs.webp",
    tagline: "House-made favourites portioned for easy service.",
    objectPosition: "center 50%",
  },
  "Marinated Products": {
    image: "/images/site/shop-category-marinated-products.webp",
    tagline: "Seasoned chicken favourites ready for the pan or fire.",
    objectPosition: "center 50%",
  },
  "Kebabs & Sosaties": {
    image: "/images/site/shop-category-kebabs-sosaties.webp",
    tagline: "Cocktail portions, braai kebabs and espetadas made to order.",
    objectPosition: "center 50%",
  },
  "Eggs & Chips": {
    image: "/images/site/shop-category-eggs-chips.webp",
    tagline: "Kitchen staples for homes, bakeries and food service.",
    objectPosition: "center 50%",
  },
  "Frozen Vegetables": {
    image: "/images/site/shop-category-frozen-vegetables.webp",
    tagline: "Practical frozen vegetable lines in dependable pack sizes.",
    objectPosition: "center 50%",
  },
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Ostrich: "linear-gradient(135deg, #12253d 0%, #0c0a09 100%)",
  Fish: "linear-gradient(135deg, #0c2430 0%, #0c0a09 100%)",
  "Cheese & Pantry": "linear-gradient(135deg, #1d1a12 0%, #0c0a09 100%)",
  "Budget Items": "linear-gradient(135deg, #151821 0%, #0c0a09 100%)",
  Minces: "linear-gradient(135deg, #10233f 0%, #0c0a09 100%)",
  Cheese: "linear-gradient(135deg, #1d1a12 0%, #0c0a09 100%)",
  "Bulk & Pantry": "linear-gradient(135deg, #13202b 0%, #0c0a09 100%)",
};

const ORDER_MODES: Array<{
  key: OrderMode;
  icon: React.ReactNode;
  kicker: string;
  title: string;
  desc: string;
  image: string;
  bullets: string[];
}> = [
  {
    key: "retail",
    icon: <Store className="w-6 h-6 text-burgundy-300" />,
    kicker: "For home cooks and braais",
    title: "Retail Counter",
    desc:
      "Browse the daily counter for family dinners, braai staples and made-to-order cuts prepared with the same care as in store.",
    image: "/images/site/order-retail.webp",
    bullets: ["Daily cuts", "Family sizing", "Butcher-packed"],
  },
  {
    key: "wholesale",
    icon: <Building2 className="w-6 h-6 text-burgundy-300" />,
    kicker: "For trade, kitchens and resellers",
    title: "Wholesale Desk",
    desc:
      "Move straight into trade packs, bulk formats and dependable repeat ordering with team confirmation before fulfilment.",
    image: "/images/site/order-wholesale.webp",
    bullets: ["Bulk formats", "Consistent pricing", "Trade-ready"],
  },
];

const SERVICE_POINTS = [
  {
    icon: <ShieldCheck size={15} />,
    title: "Butcher-confirmed",
    text: "Every order is reviewed by the team before collection or delivery.",
  },
  {
    icon: <Clock3 size={15} />,
    title: "Freshly prepared",
    text: "Cuts, mince and marinated products are packed with order timing in mind.",
  },
  {
    icon: <Sparkles size={15} />,
    title: "Counter quality",
    text: "The online store mirrors the premium in-store approach, not a generic catalogue.",
  },
];

const RETAIL_SIGNALS = ["Premium cuts", "Braai-ready packs", "Same-day collection"];
const WHOLESALE_SIGNALS = ["Trade packs", "Bulk pricing", "Repeat ordering"];
const WHOLESALE_ACCESS_CODE = "2002";
const WHOLESALE_ACCESS_STORAGE = "coleridge-wholesale-access-v1";
const STEFAN_WHATSAPP_NUMBER = "27611275756";
const RETAIL_LOCKED_DESKTOP_BANNER =
  "/images/site/retail-locked-banner.webp";
const PRODUCT_PHOTOS_ENABLED = false;

const getScrollBehavior = (): ScrollBehavior => {
  if (typeof window === "undefined") {
    return "auto";
  }

  return window.innerWidth < 1024 || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
};

const getStoredWholesaleAccess = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(WHOLESALE_ACCESS_STORAGE) === "granted";
  } catch {
    return false;
  }
};

const setStoredWholesaleAccess = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WHOLESALE_ACCESS_STORAGE, "granted");
  } catch {}
  emitWholesaleAccessState();
};

const scrollToElementWithOffset = (id: string, offset = 96) => {
  const target = document.getElementById(id);
  if (!target) return;

  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
  window.scrollTo({ top, behavior: getScrollBehavior() });
};

const scrollToDeliveryInfo = () => {
  scrollToElementWithOffset("delivery-info");

  if (window.location.hash !== "#delivery-info") {
    window.history.replaceState(null, "", "#delivery-info");
  }
};

const scrollToShopGrid = () => {
  window.setTimeout(() => {
    scrollToElementWithOffset("shop-grid");
  }, 120);
};

const getOrderMeta = (product: Product) => {
  const rules = getQuantityRules(product);

  if (rules.options?.length) {
    return rules.options.length === 1 ? formatQty(rules.options[0], product.unit) : `${rules.options.length} order sizes`;
  }

  if (rules.maxQty != null) {
    return `${formatQty(rules.minQty, product.unit)}-${formatQty(rules.maxQty, product.unit)}`;
  }
  if (rules.minQty > (product.unit === "kg" ? 0.1 : 1)) {
    return `Min ${formatQty(rules.minQty, product.unit)}`;
  }
  return product.unit === "kg" ? `Steps of ${formatQty(rules.step, product.unit)}` : "Sold per item";
};

const getFulfilmentTag = (product: Product) => {
  if (product.stockStatus === "out_of_stock") return "Out of stock";
  return "In stock";
};

const getProductBlurb = (product: Product) =>
  product.note ?? "Prepared with the same premium counter standard as in store.";

const getStockBadgeClass = (product: Product) => {
  if (product.stockStatus === "out_of_stock") {
    return "border-red-800/60 bg-red-950/45 text-red-100";
  }
  return "border-emerald-700/50 bg-emerald-950/35 text-emerald-100";
};

export const PublicShopIntro: React.FC = () => {
  const signals = ["Premium cuts", "Made-to-order lines", "Team-confirmed orders"];

  return (
    <section
      id="shop"
      className="relative overflow-hidden border-y border-stone-900 bg-stone-950 py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(36,83,136,0.22),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-12 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-burgundy-700/40 bg-burgundy-900/35 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-burgundy-300">
              Online Butcher
            </div>
            <h2 className="max-w-3xl text-4xl font-serif leading-tight text-stone-100 md:text-6xl">
              One counter, prepared around your order
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-400 md:text-lg">
              Browse the complete Coleridge selection in one place, from fresh cuts and house-made
              favourites to kitchen staples. Every order is checked and confirmed by our team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {signals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-stone-300"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-stone-800/80 bg-stone-950/70 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-sm">
            {SERVICE_POINTS.map((point) => (
              <div key={point.title} className="flex items-start gap-3 border-b border-stone-800/70 px-2 py-4 last:border-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-burgundy-700/40 bg-burgundy-900/30 text-burgundy-300">
                  {point.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-200">{point.title}</div>
                  <p className="mt-1 text-sm leading-6 text-stone-400">{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToShopGrid}
          className="group relative mt-14 min-h-[370px] w-full overflow-hidden rounded-[32px] border border-burgundy-600/70 text-left shadow-[0_28px_80px_-34px_rgba(16,35,63,0.8)] transition-transform duration-500 hover:-translate-y-1 lg:min-h-[320px]"
        >
          <img
            src={RETAIL_LOCKED_DESKTOP_BANNER}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950/94 via-stone-950/70 to-stone-950/20" />
          <div className="relative flex h-full min-h-[370px] flex-col justify-between p-7 md:p-8 lg:min-h-[320px] lg:max-w-[58rem]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-burgundy-700/40 bg-stone-950/75 text-burgundy-300 backdrop-blur-sm">
                <Store size={23} />
              </div>
              <span className="rounded-full bg-burgundy-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-950">
                Open now
              </span>
            </div>
            <div className="mt-12 max-w-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-burgundy-300">For every Coleridge customer</div>
              <h3 className="mt-3 text-3xl font-serif text-stone-100 sm:text-4xl">The Coleridge Online Counter</h3>
              <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
                Shop current prices and availability, then send the order to Stefan for final confirmation.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100">
                Browse products <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </button>

        <div className="mt-6 border-l-2 border-burgundy-600 pl-5 text-sm leading-6 text-stone-400">
          Products marked as made to order or available upon request can take up to two days to prepare.
        </div>
      </div>
    </section>
  );
};

export const ShopSwitch: React.FC = () => {
  const { orderType, setOrderType } = useCart();
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const requestFormRef = useRef<HTMLDivElement | null>(null);
  const requestNameInputRef = useRef<HTMLInputElement | null>(null);
  const [isWholesaleUnlocked, setWholesaleUnlocked] = useState(false);
  const [showWholesaleAccess, setShowWholesaleAccess] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestDetails, setRequestDetails] = useState({
    fullName: "",
    companyName: "",
    phoneNumber: "",
    email: "",
    orderNotes: "",
  });

  useEffect(() => {
    setWholesaleUnlocked(getStoredWholesaleAccess());
  }, []);

  useEffect(() => {
    if (!isWholesaleUnlocked && orderType === "wholesale") {
      setOrderType("retail");
    }
  }, [isWholesaleUnlocked, orderType, setOrderType]);

  useEffect(() => {
    if (!showWholesaleAccess) {
      setAccessCode("");
      setAccessError("");
      setRequestError("");
      setRequestSent(false);
    }
  }, [showWholesaleAccess]);

  useEffect(() => {
    const handleOpenWholesaleAccess = () => {
      openWholesaleAccess();
    };

    window.addEventListener(WHOLESALE_ACCESS_MODAL_EVENT, handleOpenWholesaleAccess as EventListener);
    return () =>
      window.removeEventListener(
        WHOLESALE_ACCESS_MODAL_EVENT,
        handleOpenWholesaleAccess as EventListener
      );
  }, []);

  const visibleModes = isWholesaleUnlocked
    ? ORDER_MODES
    : ORDER_MODES.filter((mode) => mode.key === "retail");

  const openWholesaleAccess = () => {
    setShowWholesaleAccess(true);
    setAccessError("");
    setRequestError("");
    setRequestSent(false);
  };

  const handleWholesaleRequestChange =
    (field: keyof typeof requestDetails) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRequestError("");
      setRequestDetails((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleWholesaleCardClick = () => {
    if (isWholesaleUnlocked) {
      setOrderType("wholesale");
      scrollToShopGrid();
      return;
    }

    openWholesaleAccess();
  };

  const scrollToWholesaleForm = () => {
    const container = modalScrollRef.current;
    const target = requestNameInputRef.current ?? requestFormRef.current;

    if (!container || !target) return;

    const top =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      24;

    container.scrollTo({
      top: Math.max(0, top),
      behavior: getScrollBehavior(),
    });
  };

  const handleWholesaleCodeSubmit = () => {
    if (accessCode.trim() !== WHOLESALE_ACCESS_CODE) {
      setAccessError("That code is incorrect. Please request access from Stefan if you do not have the wholesale code yet.");
      return;
    }

    setStoredWholesaleAccess();
    setWholesaleUnlocked(true);
    setShowWholesaleAccess(false);
    setAccessCode("");
    setAccessError("");
    setOrderType("wholesale");
    scrollToShopGrid();
  };

  const handleWholesaleRequest = () => {
    if (
      !requestDetails.fullName.trim() ||
      !requestDetails.companyName.trim() ||
      !requestDetails.phoneNumber.trim()
    ) {
      setRequestError("Please add your name, company name and phone number so Stefan has what he needs to approve access.");
      return;
    }

    const message = [
      "Hi Stefan, I would like wholesale access for the Coleridge Meat website.",
      "",
      `Name: ${requestDetails.fullName.trim()}`,
      `Company: ${requestDetails.companyName.trim()}`,
      `Phone: ${requestDetails.phoneNumber.trim()}`,
      `Email: ${requestDetails.email.trim() || "Not provided"}`,
      `Business details: ${requestDetails.orderNotes.trim() || "Not provided"}`,
      "",
      "Please send me the wholesale access code when approved.",
    ].join("\n");

    const url = `https://wa.me/${STEFAN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setRequestError("");
    setRequestSent(true);
  };

  const renderAccessCodePanel = (className = "") => (
    <div
      className={`rounded-[24px] border border-stone-800 bg-stone-950/65 p-5 shadow-[0_22px_64px_-40px_rgba(0,0,0,0.8)] ${className}`.trim()}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        Already approved?
      </p>
      <h4 className="mt-2 text-2xl font-serif text-stone-100">Unlock the wholesale counter</h4>
      <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
        Enter the code Stefan sent you and the wholesale counter will unlock on this device right
        away.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <KeyRound
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500"
          />
          <input
            value={accessCode}
            onChange={(event) => {
              setAccessCode(event.target.value);
              setAccessError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleWholesaleCodeSubmit();
              }
            }}
            placeholder="Enter wholesale code"
            className="w-full rounded-full border border-stone-800 bg-stone-900/80 py-3 pl-11 pr-4 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleWholesaleCodeSubmit}
          className="inline-flex items-center justify-center rounded-full bg-burgundy-800 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition-colors hover:bg-burgundy-700"
        >
          Unlock wholesale
        </button>
      </div>

      {accessError && (
        <p className="mt-4 rounded-[18px] border border-burgundy-900/50 bg-burgundy-950/30 px-4 py-3 text-sm leading-6 text-burgundy-100">
          {accessError}
        </p>
      )}
    </div>
  );

  return (
    <>
      <section
        id="shop"
        className="relative overflow-hidden border-y border-stone-900 bg-stone-950 py-24 md:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(36,83,136,0.22),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/6" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-burgundy-700/40 bg-burgundy-900/35 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-burgundy-300">
                Online Counter
              </div>
              <h2 className="max-w-3xl text-4xl font-serif leading-tight text-stone-100 md:text-6xl">
                {isWholesaleUnlocked
                  ? "Choose the counter that fits your order"
                  : "Shop the retail counter now, then unlock wholesale when you need it"}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-stone-400 md:text-lg">
                {isWholesaleUnlocked
                  ? "Shop retail for family meals and braais, or request wholesale access for larger service orders and resale buying. Every order is still confirmed by our team before anything is final."
                  : "Start with the retail counter for family meals and braais. If you are ordering for trade, kitchens or resale, unlock the wholesale counter with the approval flow already set up for Stefan."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {(orderType === "retail" ? RETAIL_SIGNALS : WHOLESALE_SIGNALS).map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-stone-300"
                  >
                    {signal}
                  </span>
                ))}
                {!isWholesaleUnlocked && (
                  <span className="rounded-full border border-burgundy-800/50 bg-burgundy-900/30 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-burgundy-200">
                    Wholesale locked
                  </span>
                )}
                {isWholesaleUnlocked && (
                  <span className="rounded-full border border-emerald-800/50 bg-emerald-900/25 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-200">
                    Wholesale approved
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-stone-800/80 bg-stone-950/70 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-sm">
              {SERVICE_POINTS.map((point) => (
                <div
                  key={point.title}
                  className="flex items-start gap-3 rounded-[20px] border border-stone-800/70 bg-white/[0.02] px-4 py-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-burgundy-700/40 bg-burgundy-900/30 text-burgundy-300">
                    {point.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-200">
                      {point.title}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-stone-400">{point.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-14 grid gap-6 ${isWholesaleUnlocked ? "lg:grid-cols-2" : ""}`}>
            {visibleModes.map((mode) => {
              const isWholesaleMode = mode.key === "wholesale";
              const active = orderType === mode.key;
              const isLocked = isWholesaleMode && !isWholesaleUnlocked;
              const isRetailOnly = !isWholesaleUnlocked && mode.key === "retail";

              return (
                <motion.button
                  key={mode.key}
                  type="button"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    if (isWholesaleMode) {
                      handleWholesaleCardClick();
                      return;
                    }

                    setOrderType(mode.key);
                    scrollToShopGrid();
                  }}
                  className={`group relative overflow-hidden rounded-[32px] border text-left transition-all duration-500 ${
                    isRetailOnly ? "min-h-[370px] lg:min-h-[320px]" : "min-h-[370px]"
                  } ${
                    active
                      ? "border-burgundy-600/70 shadow-[0_28px_80px_-34px_rgba(16,35,63,0.8)]"
                      : "border-stone-800/90 hover:border-burgundy-700/45"
                  }`}
                >
                  {isRetailOnly ? (
                    <picture>
                      <source media="(min-width: 1024px)" srcSet={RETAIL_LOCKED_DESKTOP_BANNER} />
                      <img
                        src={mode.image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  ) : (
                    <img
                      src={mode.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-950/92 via-stone-950/68 to-stone-950/20" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(36,83,136,0.35),transparent_32%)] opacity-80" />
                  {isLocked && <div className="absolute inset-0 bg-stone-950/35 backdrop-blur-[2px]" />}

                  <div
                    className={`relative flex h-full flex-col justify-between p-7 md:p-8 ${
                      isRetailOnly ? "lg:max-w-[58rem]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-burgundy-700/40 bg-stone-950/75 backdrop-blur-sm">
                        {mode.icon}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] ${
                          active
                            ? "bg-burgundy-500 text-stone-950"
                            : isWholesaleMode && isWholesaleUnlocked
                              ? "border border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
                            : isLocked
                              ? "border border-burgundy-700/60 bg-stone-950/80 text-burgundy-200"
                              : "border border-stone-700/70 bg-stone-950/70 text-stone-300"
                        }`}
                      >
                        {active
                          ? "Selected"
                          : isWholesaleMode && isWholesaleUnlocked
                            ? "Approved access"
                            : isLocked
                              ? "Code required"
                              : "Choose"}
                      </span>
                    </div>

                    <div className="mt-12 max-w-lg">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-burgundy-300">
                        {mode.kicker}
                      </div>
                      <h3 className="mt-4 text-3xl font-serif text-stone-100 md:text-4xl">
                        {mode.title}
                      </h3>
                      <p className="mt-4 max-w-md text-sm leading-7 text-stone-300 md:text-base">
                        {mode.desc}
                      </p>
                      {isLocked && (
                        <p className="mt-4 max-w-md text-xs leading-6 uppercase tracking-[0.18em] text-stone-400">
                          Wholesale pricing is protected. Request access from Stefan to receive
                          your code.
                        </p>
                      )}
                      {isWholesaleMode && isWholesaleUnlocked && (
                        <p className="mt-4 max-w-md text-xs leading-6 uppercase tracking-[0.18em] text-emerald-200">
                          Access approved on this device. Enter the wholesale counter at any time.
                        </p>
                      )}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      {mode.bullets.map((bullet) => (
                        <span
                          key={bullet}
                          className="rounded-full border border-white/10 bg-stone-950/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-300 backdrop-blur-sm"
                        >
                          {bullet}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100">
                        {isLocked ? "Request access" : "Enter mode"} <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {!isWholesaleUnlocked && (
            <div className="mt-6 rounded-[28px] border border-burgundy-800/40 bg-[linear-gradient(135deg,rgba(16,35,63,0.3),rgba(12,10,9,0.92))] p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-burgundy-700/40 bg-stone-950/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-200">
                    <LockKeyhole size={14} />
                    Wholesale Access
                  </div>
                  <h3 className="mt-4 text-2xl font-serif text-stone-100 md:text-3xl">
                    Need bulk pricing or the trade counter?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300">
                    Open the wholesale unlock form to enter your code or send Stefan your business
                    details for approval. Once approved, the wholesale desk comes straight back next
                    to retail in the current two-counter layout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openWholesaleAccess}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-burgundy-800 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition-colors hover:bg-burgundy-700"
                >
                  Unlock Wholesale
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showWholesaleAccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-stone-950/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wholesale-access-title"
              className="mx-auto my-0 w-full max-w-5xl overflow-hidden rounded-[28px] border border-stone-800 bg-stone-950 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] sm:my-auto sm:rounded-[32px]"
            >
              <div
                ref={modalScrollRef}
                className="grid max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain lg:max-h-[min(880px,calc(100svh-4rem))] lg:grid-cols-[0.94fr_1.06fr]"
              >
                <div className="border-b border-stone-800 bg-[linear-gradient(180deg,rgba(16,35,63,0.4),rgba(12,10,9,0.96))] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                  <div className="inline-flex items-center gap-2 rounded-full border border-burgundy-700/40 bg-burgundy-900/35 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-burgundy-200">
                    <LockKeyhole size={14} />
                    Wholesale access
                  </div>
                  <h3 id="wholesale-access-title" className="mt-6 text-3xl font-serif text-stone-100 sm:text-4xl">
                    Request your wholesale code
                  </h3>
                  <p className="mt-5 max-w-md text-sm leading-7 text-stone-300">
                    Wholesale pricing is reserved for restaurants, resellers and larger-format
                    buying. Send your details straight to Stefan on WhatsApp and he can approve
                    access and share your code.
                  </p>

                  <div className="mt-6 lg:hidden">{renderAccessCodePanel()}</div>

                  <div className="mt-8 space-y-4">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-300">
                        What to include
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-400">
                        Your name, company, phone number and a short note about what you plan to
                        buy helps Stefan review the request quickly.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-300">
                        Quick unlock
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-400">
                        On phones and tablets, the unlock panel sits directly above these details
                        so you can reach it without fighting the screen.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-burgundy-700/30 bg-burgundy-950/20 p-4 lg:hidden">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-200">
                        Scroll for the form
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        Need a code? The wholesale request form is just below this section.
                      </p>
                      <button
                        type="button"
                        onClick={scrollToWholesaleForm}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-burgundy-700/40 bg-stone-950/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-100 transition-colors hover:border-burgundy-500 hover:text-white"
                      >
                        Jump to request form
                        <ArrowRight size={14} className="rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>

                <div ref={requestFormRef} className="p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                        Access form
                      </p>
                      <h4 className="mt-2 text-2xl font-serif text-stone-100">
                        Send your details to Stefan
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWholesaleAccess(false)}
                      className="rounded-full border border-stone-700 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mb-8 hidden lg:block">{renderAccessCodePanel()}</div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <input
                      ref={requestNameInputRef}
                      value={requestDetails.fullName}
                      onChange={handleWholesaleRequestChange("fullName")}
                      placeholder="Full name"
                      className="rounded-[18px] border border-stone-800 bg-stone-900/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                    />
                    <input
                      value={requestDetails.companyName}
                      onChange={handleWholesaleRequestChange("companyName")}
                      placeholder="Company name"
                      className="rounded-[18px] border border-stone-800 bg-stone-900/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                    />
                    <input
                      value={requestDetails.phoneNumber}
                      onChange={handleWholesaleRequestChange("phoneNumber")}
                      placeholder="Phone number"
                      className="rounded-[18px] border border-stone-800 bg-stone-900/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                    />
                    <input
                      value={requestDetails.email}
                      onChange={handleWholesaleRequestChange("email")}
                      placeholder="Email address"
                      className="rounded-[18px] border border-stone-800 bg-stone-900/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                    />
                  </div>

                  <textarea
                    value={requestDetails.orderNotes}
                    onChange={handleWholesaleRequestChange("orderNotes")}
                    placeholder="What kind of wholesale products or quantities are you looking for?"
                    rows={4}
                    className="mt-4 w-full rounded-[18px] border border-stone-800 bg-stone-900/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleWholesaleRequest}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#20bd5a]"
                  >
                    <MessageCircle size={15} />
                    Send to Stefan on WhatsApp
                  </button>

                  {requestError && (
                    <p className="mt-4 rounded-[18px] border border-burgundy-900/50 bg-burgundy-950/30 px-4 py-3 text-sm leading-6 text-burgundy-100">
                      {requestError}
                    </p>
                  )}

                  {requestSent && (
                    <div className="mt-4 rounded-[20px] border border-emerald-900/50 bg-emerald-950/20 px-4 py-4 text-sm leading-6 text-emerald-100">
                      Your WhatsApp request has been prepared for Stefan. Once he approves it, use
                      the code he sends you to unlock the wholesale counter on this device.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const WholesaleFloatingButton: React.FC = () => {
  const [isWholesaleUnlocked, setWholesaleUnlocked] = useState(getStoredWholesaleAccess());

  useEffect(() => {
    const syncWholesaleAccess = () => {
      setWholesaleUnlocked(getStoredWholesaleAccess());
    };

    syncWholesaleAccess();
    window.addEventListener(WHOLESALE_ACCESS_EVENT, syncWholesaleAccess);
    window.addEventListener("storage", syncWholesaleAccess);

    return () => {
      window.removeEventListener(WHOLESALE_ACCESS_EVENT, syncWholesaleAccess);
      window.removeEventListener("storage", syncWholesaleAccess);
    };
  }, []);

  if (isWholesaleUnlocked) {
    return null;
  }

  return (
    <motion.button
      type="button"
      onClick={openWholesaleAccessModal}
      className="fixed bottom-4 left-4 z-[55] inline-flex items-center gap-2 rounded-full border border-burgundy-700/40 bg-[linear-gradient(135deg,rgba(16,35,63,0.96),rgba(12,10,9,0.94))] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] transition-colors hover:border-burgundy-500/50 hover:bg-[linear-gradient(135deg,rgba(23,54,95,0.98),rgba(12,10,9,0.96))] md:bottom-6 md:left-6 md:px-5"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Unlock wholesale access"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-burgundy-700/40 bg-black/20 text-burgundy-200">
        <LockKeyhole size={15} />
      </span>
      <span className="hidden sm:inline">Unlock Wholesale</span>
      <span className="sm:hidden">Wholesale</span>
      <ArrowRight size={14} className="text-burgundy-200" />
    </motion.button>
  );
};

const CategoryBanner: React.FC<{ category: string; count: number }> = ({ category, count }) => {
  const visual = CATEGORY_VISUALS[category];
  const fallbackGradient =
    CATEGORY_GRADIENTS[category] ?? "linear-gradient(135deg, #10233f 0%, #0c0a09 100%)";

  return (
    <div className="relative mb-7 overflow-hidden rounded-[28px] border border-stone-800/80 bg-stone-900 min-h-[240px] sm:min-h-[280px]">
      {visual?.image ? (
        <img
          src={visual.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: visual.objectPosition ?? "center 45%" }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: fallbackGradient }} />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-950/60 to-stone-950/12" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/78 via-transparent to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-stone-950/55 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-300 backdrop-blur-sm">
            Butcher&apos;s Counter
          </span>
          <span className="rounded-full border border-burgundy-700/35 bg-burgundy-900/35 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-300">
            {count} item{count === 1 ? "" : "s"}
          </span>
        </div>

        <div className="max-w-xl">
          <h4 className="text-3xl font-serif text-stone-50 sm:text-4xl">{category}</h4>
          <p className="mt-3 max-w-md text-sm leading-6 text-stone-300 sm:text-base">
            {visual?.tagline ?? "A refined selection prepared with the same care as the in-store counter."}
          </p>
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; index: number; anchorId?: string }> = ({ product, index, anchorId }) => {
  const { add, orderType } = useCart();
  const [flash, setFlash] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showSpecialPricing, setShowSpecialPricing] = useState(false);
  const [showQuantityPicker, setShowQuantityPicker] = useState(false);
  const rules = getQuantityRules(product);
  const hasPhoto = PRODUCT_PHOTOS_ENABLED && Boolean(product.image);
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const primarySpecial = getPrimarySpecial(product);
  const lowestSpecialPrice = getLowestSpecialPrice(product);
  const hasActiveSpecial = Boolean(
    primarySpecial &&
      lowestSpecialPrice != null &&
      (product.price === 0 || lowestSpecialPrice < product.price),
  );
  const quantitySpecial = primarySpecial?.pricingMode === "tiered" ? primarySpecial : null;
  const sortedSpecialTiers = quantitySpecial?.tiers.slice().sort((a, b) => (a.minQty ?? -1) - (b.minQty ?? -1)) ?? [];
  const previewTiers = sortedSpecialTiers.slice(0, sortedSpecialTiers.length > 3 ? 2 : 3);

  const addQuantity = (quantity: number) => {
    if (isOutOfStock) return;
    add(product, orderType, quantity);
    setShowSpecialPricing(false);
    setShowQuantityPicker(false);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 750);
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    if (rules.options && rules.options.length > 1) {
      setShowSpecialPricing(false);
      setShowQuantityPicker(true);
      return;
    }
    addQuantity(rules.minQty);
  };

  useEffect(() => {
    if (!showPhoto && !showSpecialPricing && !showQuantityPicker) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPhoto(false);
        setShowSpecialPricing(false);
        setShowQuantityPicker(false);
      }
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPhoto, showSpecialPricing, showQuantityPicker]);

  return (
    <>
      <motion.article
        id={anchorId}
        layout
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut", delay: Math.min(index * 0.035, 0.35) }}
        whileHover={{ y: -4 }}
        className="group relative h-[454px] overflow-hidden rounded-[26px] border border-stone-800/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5 shadow-[0_22px_64px_-42px_rgba(0,0,0,0.95)] transition-all duration-300 hover:border-burgundy-700/55"
      >
        {PRODUCT_PHOTOS_ENABLED && product.image && (
          <>
            <img
              src={product.image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:block"
            />
            <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(12,10,9,0.78),rgba(12,10,9,0.84)),radial-gradient(circle_at_top_right,rgba(16,35,63,0.42),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:block" />
          </>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(36,83,136,0.18),transparent_32%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative grid h-full grid-rows-[84px_76px_96px_minmax(0,1fr)_104px]">
          <div className="min-w-0">
            <div className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">
              {product.category}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div
                className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${getStockBadgeClass(product)}`}
              >
                {getFulfilmentTag(product)}
              </div>
              <div className="shrink-0 whitespace-nowrap rounded-full border border-stone-700/80 bg-stone-950/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-300 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.9)]">
                {getOrderMeta(product)}
              </div>
            </div>
            <div className="mt-2 h-6 min-w-0">
              {hasActiveSpecial && (
                <div className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-emerald-700/60 bg-emerald-950/65 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  {quantitySpecial ? "Buy more, save more" : "Special price"}
                </div>
              )}
            </div>
          </div>

          <h4 className="h-full overflow-hidden pb-1 pt-3 text-2xl font-serif leading-[1.2] text-stone-100 transition-colors duration-300 group-hover:text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {formatProductName(product.name)}
          </h4>

          {quantitySpecial ? (
            <button type="button" onClick={() => setShowSpecialPricing(true)} className="mt-1 h-[5.5rem] w-full rounded-md border border-emerald-900/60 bg-emerald-950/25 px-3 py-2 text-left transition-colors hover:border-emerald-700/70 hover:bg-emerald-950/40" aria-label={`View all special prices for ${product.name}`}>
              <span className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300"><span>Price by order size</span><ArrowRight size={11} /></span>
              {previewTiers.map((tier) => <span key={tier.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[11px] leading-[17px] text-stone-300"><span>{formatTierRange(tier, product.unit)}</span><strong className="whitespace-nowrap text-emerald-200">{formatZAR(tier.price)}/{product.unit === "kg" ? "kg" : "item"}</strong></span>)}
              {sortedSpecialTiers.length > previewTiers.length && <span className="block text-[10px] leading-[17px] text-stone-500">View all {sortedSpecialTiers.length} prices</span>}
            </button>
          ) : (
            <p className="h-full overflow-hidden pt-2 text-sm leading-6 text-stone-400 transition-colors duration-300 group-hover:text-stone-200 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
              {getProductBlurb(product)}
            </p>
          )}

          <div className="flex min-h-0 items-end">
            {hasPhoto && (
              <button
                type="button"
                onClick={() => setShowPhoto(true)}
                className="inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-blue-300/20 bg-stone-950/42 px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100/85 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_14px_34px_-24px_rgba(59,130,246,0.9)] backdrop-blur-sm transition-all duration-200 hover:border-blue-200/40 hover:bg-blue-950/34 hover:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-300/45 focus:ring-offset-2 focus:ring-offset-stone-950"
                aria-label={`View photo of ${product.name}`}
              >
                <Camera size={15} strokeWidth={2.2} />
                View Photo
              </button>
            )}
          </div>

          <div className="grid min-w-0 grid-rows-[32px_minmax(0,1fr)] border-t border-stone-800/80 pt-4">
            <div className="break-words text-[10px] font-semibold uppercase leading-4 tracking-[0.2em] text-stone-500 transition-colors duration-300 group-hover:text-stone-300">
              {hasActiveSpecial ? primarySpecial?.campaignTitle : `per ${product.unit === "kg" ? "kg" : "item"}`}
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
              <div className="min-w-0">
                {hasActiveSpecial && lowestSpecialPrice != null ? (
                  <>
                    <div className={`whitespace-nowrap font-serif leading-[1.15] text-emerald-200 ${quantitySpecial ? "text-[22px]" : "text-2xl"}`}>
                      {quantitySpecial ? "From " : ""}{formatZAR(lowestSpecialPrice)}<span className="ml-1 text-xs font-sans text-emerald-300">/{product.unit === "kg" ? "kg" : "item"}</span>
                    </div>
                    {product.price > 0 && <div className="mt-1 text-xs text-stone-500 line-through">{formatZAR(product.price)}</div>}
                  </>
                ) : (
                  <div className="text-2xl font-serif leading-[1.15] text-stone-100">
                    {product.priceLabel ?? formatZAR(product.price)}
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`inline-flex h-9 w-[92px] shrink-0 items-center justify-center gap-2 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
                  isOutOfStock
                    ? "cursor-not-allowed border border-red-800/60 bg-red-950/40 text-red-100"
                    : flash
                    ? "bg-stone-100 text-stone-950"
                    : "bg-burgundy-800 text-stone-100 shadow-[0_12px_28px_-16px_rgba(16,35,63,0.9)] hover:bg-burgundy-700"
                }`}
                aria-label={`Add ${product.name} to cart`}
              >
                {isOutOfStock ? (
                  <>Out</>
                ) : flash ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    Added
                  </>
                ) : (
                  <>
                    <Plus size={13} strokeWidth={2.5} />
                    Add
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showQuantityPicker && rules.options?.length && (
          <motion.div className="fixed inset-0 z-[97] overflow-y-auto bg-stone-950/88 px-4 py-6 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuantityPicker(false)}>
            <div className="flex min-h-full items-center justify-center">
              <motion.div role="dialog" aria-modal="true" aria-labelledby={`quantity-picker-title-${product.id}`} className="w-full max-w-md rounded-lg border border-stone-700 bg-stone-950 p-5 shadow-2xl sm:p-7" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                  <div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-300">Choose order quantity</div><h3 id={`quantity-picker-title-${product.id}`} className="mt-2 font-serif text-3xl text-stone-100">{formatProductName(product.name)}</h3></div>
                  <button type="button" onClick={() => setShowQuantityPicker(false)} aria-label="Close quantity picker" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-700 text-stone-400 hover:bg-stone-900 hover:text-white"><X size={17} /></button>
                </div>
                <div className="mt-6 grid gap-2">
                  {rules.options.map((option) => {
                    const pricing = getLinePricing(product, option);
                    return (
                      <button key={option} type="button" onClick={() => addQuantity(option)} className="flex min-h-14 items-center justify-between gap-4 rounded-md border border-stone-700 bg-stone-900/55 px-4 text-left transition-colors hover:border-burgundy-600 hover:bg-stone-900">
                        <strong className="text-base text-stone-100">{formatQty(option, product.unit)}</strong>
                        <span className="text-sm text-stone-400">{pricing.unitPrice === 0 && product.priceLabel ? "Total to confirm" : `${formatZAR(pricing.lineTotal)} total`}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpecialPricing && quantitySpecial && (
          <motion.div className="fixed inset-0 z-[96] overflow-y-auto bg-stone-950/88 px-4 py-6 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSpecialPricing(false)}>
            <div className="flex min-h-full items-center justify-center">
              <motion.div role="dialog" aria-modal="true" aria-labelledby={`special-pricing-title-${product.id}`} className="w-full max-w-lg rounded-lg border border-emerald-900/60 bg-stone-950 p-5 shadow-2xl sm:p-7" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">Buy more, save more</div><h3 id={`special-pricing-title-${product.id}`} className="mt-2 font-serif text-3xl text-stone-100">{formatProductName(product.name)}</h3><p className="mt-2 text-sm text-stone-500">Minimum order {formatQty(rules.minQty, product.unit)}. Your price updates automatically when your cart reaches a new quantity.</p></div><button type="button" onClick={() => setShowSpecialPricing(false)} aria-label="Close special pricing" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-700 text-stone-400 hover:bg-stone-900 hover:text-white"><X size={17} /></button></div>
                <div className="mt-6 overflow-hidden rounded-md border border-stone-800">
                  {sortedSpecialTiers.map((tier) => <div key={tier.id} className="flex items-center justify-between gap-4 border-b border-stone-800 bg-stone-900/35 px-4 py-3 last:border-0"><span className="text-sm text-stone-300">{formatTierRange(tier, product.unit)}</span><strong className="text-base text-emerald-200">{formatZAR(tier.price)} / {product.unit === "kg" ? "kg" : "item"}</strong></div>)}
                </div>
                {product.price > 0 && <div className="mt-3 text-xs text-stone-500">Normal price: {formatZAR(product.price)} / {product.unit === "kg" ? "kg" : "item"}</div>}
                <button type="button" onClick={handleAdd} disabled={isOutOfStock} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-burgundy-700 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-burgundy-600 disabled:opacity-40"><Plus size={15} /> Add minimum order to cart</button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {PRODUCT_PHOTOS_ENABLED && showPhoto && product.image && (
          <motion.div
            className="fixed inset-0 z-[95] overflow-y-auto bg-stone-950/84 px-4 py-5 backdrop-blur-md sm:px-6 sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPhoto(false)}
          >
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`product-photo-title-${product.id}`}
                className="relative w-full max-w-4xl overflow-hidden rounded-[30px] border border-stone-700/70 bg-stone-950 shadow-[0_34px_120px_-38px_rgba(0,0,0,1)]"
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowPhoto(false)}
                  className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-stone-950/70 text-stone-100 backdrop-blur-md transition-colors hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-300/55"
                  aria-label="Close product photo"
                >
                  <X size={18} />
                </button>

                <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="relative min-h-[300px] bg-stone-900 sm:min-h-[420px]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0.05),rgba(12,10,9,0.28))]" />
                  </div>

                  <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-burgundy-300">
                        {product.category}
                      </div>
                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                        {getOrderMeta(product)}
                      </div>
                      <h3
                        id={`product-photo-title-${product.id}`}
                        className="mt-6 text-3xl font-serif leading-tight text-stone-100 sm:text-4xl"
                      >
                        {formatProductName(product.name)}
                      </h3>
                      <p className="mt-5 text-sm leading-7 text-stone-300">
                        {getProductBlurb(product)}
                      </p>
                    </div>

                    <div className="mt-8 border-t border-stone-800 pt-6">
                      <div className="text-4xl font-serif leading-none text-stone-100">
                        {product.priceLabel ?? formatZAR(product.price)}
                      </div>
                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                        per {product.unit === "kg" ? "kg" : "item"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const ShopGrid: React.FC = () => {
  const { openCart, count, setOrderType, syncProducts } = useCart();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(() =>
    new URLSearchParams(window.location.search).get("view") === "specials" ? "Specials" : "All",
  );
  const categoryScrollerRef = useRef<HTMLDivElement | null>(null);
  const [categoryScroll, setCategoryScroll] = useState({
    canBack: false,
    canForward: false,
    thumbWidth: 100,
    thumbOffset: 0,
  });
  const products = useLiveProducts(PUBLIC_PRODUCTS, "retail");
  const specialProducts = useMemo(
    () => products.filter((product) => (product.specials?.length ?? 0) > 0),
    [products],
  );
  const activeCampaigns = useMemo(() => {
    const campaigns = new Map<string, { id: string; title: string; endDate: string; offers: number }>();
    specialProducts.forEach((product) => {
      product.specials?.forEach((special) => {
        const current = campaigns.get(special.campaignId);
        campaigns.set(special.campaignId, {
          id: special.campaignId,
          title: special.campaignTitle,
          endDate: special.endDate,
          offers: (current?.offers ?? 0) + 1,
        });
      });
    });
    return Array.from(campaigns.values());
  }, [specialProducts]);
  const order = useMemo(() => {
    const ordered = products
      .map((product, index) => ({ product, index }))
      .sort(
        (a, b) =>
          (a.product.sortOrder ?? a.index + 1) - (b.product.sortOrder ?? b.index + 1) ||
          a.index - b.index,
      );
    return Array.from(new Set<string>(ordered.map(({ product }) => product.category)));
  }, [products]);

  useEffect(() => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) return;

    const updateScrollState = () => {
      const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const thumbWidth = scroller.scrollWidth > 0
        ? Math.max(12, Math.min(100, (scroller.clientWidth / scroller.scrollWidth) * 100))
        : 100;
      const thumbOffset = maxScroll > 0
        ? (scroller.scrollLeft / maxScroll) * (100 - thumbWidth)
        : 0;
      setCategoryScroll({
        canBack: scroller.scrollLeft > 2,
        canForward: scroller.scrollLeft < maxScroll - 2,
        thumbWidth,
        thumbOffset,
      });
    };

    updateScrollState();
    const frame = window.requestAnimationFrame(updateScrollState);
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);

    return () => {
      window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [order, specialProducts.length]);

  useEffect(() => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) return;
    const activeButton = scroller.querySelector<HTMLElement>(
      `[data-category-tab="${CSS.escape(activeCat)}"]`,
    );
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCat]);

  useEffect(() => {
    if (activeCat !== "All" && activeCat !== "Specials" && !order.includes(activeCat)) {
      setActiveCat("All");
    }
  }, [activeCat, order]);

  const scrollCategories = (direction: -1 | 1) => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * Math.max(240, scroller.clientWidth * 0.72), behavior: "smooth" });
  };

  useEffect(() => {
    syncProducts(products);
  }, [products, syncProducts]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        (activeCat === "All" ||
          (activeCat === "Specials" ? (product.specials?.length ?? 0) > 0 : product.category === activeCat)) &&
        (!lower ||
          product.name.toLowerCase().includes(lower) ||
          product.category.toLowerCase().includes(lower) ||
          (product.note?.toLowerCase().includes(lower) ?? false))
    );
  }, [products, query, activeCat]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    filtered.forEach((product) => {
      if (!map.has(product.category)) map.set(product.category, []);
      map.get(product.category)!.push(product);
    });
    return order
      .filter((category) => map.has(category))
      .map((category) => ({ category, items: map.get(category)! }));
  }, [filtered, order]);

  useEffect(() => {
    const applyQueuedFocus = () => {
      const focus = consumeShopFocus();
      if (!focus) return;

      setOrderType("retail");

      setActiveCat(focus.category ?? "All");
      setQuery(focus.query ?? "");

      window.setTimeout(() => {
        scrollToElementWithOffset("shop-grid");
      }, 160);
    };

    applyQueuedFocus();
    window.addEventListener(SHOP_FOCUS_EVENT, applyQueuedFocus as EventListener);
    return () => window.removeEventListener(SHOP_FOCUS_EVENT, applyQueuedFocus as EventListener);
  }, [setOrderType]);

  return (
    <section id="shop-grid" className="relative overflow-hidden bg-stone-950 py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(36,83,136,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {activeCampaigns.length > 0 && (
          <div className="mb-12 border-y border-emerald-900/60 bg-emerald-950/20 py-6">
            <div className="flex flex-col gap-5 px-1 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                  <Sparkles size={14} /> Specials live now
                </div>
                <h3 className="mt-2 font-serif text-3xl text-stone-100">
                  {activeCampaigns.map((campaign) => campaign.title).join(" | ")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  {specialProducts.length} products have active special pricing. Quantity discounts update automatically as you change the amount in your cart.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-500">
                  {activeCampaigns.map((campaign) => (
                    <span key={campaign.id}>{campaign.offers} offers, ending {formatCampaignDateForShop(campaign.endDate)}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveCat("Specials");
                  setQuery("");
                  window.setTimeout(() => scrollToElementWithOffset("first-special-product", 88), 180);
                }}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-emerald-600"
              >
                View specials <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.88fr] xl:items-end">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-10 bg-burgundy-500" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-burgundy-400">
                Complete selection
              </div>
              <div className="h-px w-10 bg-burgundy-500" />
            </div>
            <h3 className="mx-auto max-w-3xl text-4xl font-serif leading-tight text-stone-100 md:text-5xl">
              Browse the online counter with confidence
            </h3>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-stone-400">
              Search by cut, shop by category and build an order from the complete Coleridge Meat
              catalogue. Availability and final weights are confirmed by our team.
            </p>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-stone-800/80 bg-stone-900/75 px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Categories
                </div>
                <div className="mt-3 text-3xl font-serif text-stone-100">{grouped.length}</div>
              </div>
              <div className="rounded-[22px] border border-stone-800/80 bg-stone-900/75 px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Products shown
                </div>
                <div className="mt-3 text-3xl font-serif text-stone-100">{filtered.length}</div>
              </div>
              <div className="rounded-[22px] border border-stone-800/80 bg-stone-900/75 px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Cart items
                </div>
                <div className="mt-3 text-3xl font-serif text-stone-100">{count}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-stone-800/80 bg-stone-900/80 p-5 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-sm">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Refine the counter
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500"
                  size={16}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, categories or notes"
                  className="w-full rounded-full border border-stone-800 bg-stone-950/80 py-3 pl-11 pr-4 text-sm text-stone-200 placeholder:text-stone-600 focus:border-burgundy-700 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={openCart}
                className="inline-flex items-center justify-between rounded-full bg-burgundy-800 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-100 transition-colors duration-200 hover:bg-burgundy-700"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag size={15} />
                  View cart
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] text-stone-950">
                  {count}
                </span>
              </button>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/6 bg-white/[0.02] px-4 py-4 text-sm leading-6 text-stone-400">
              Place your order online and we will confirm availability, portioning and final totals
              with you before collection or fulfilment is final. No online payment is taken at
              checkout. Stellenbosch deliveries run Monday to Saturday, and orders in by 7:00 AM
              can qualify for same-day delivery. Outside Stellenbosch, deliveries are scheduled by
              arrangement.
            </div>
            <button
              type="button"
              onClick={scrollToDeliveryInfo}
              className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-burgundy-300 transition-colors hover:text-stone-100"
            >
              View delivery info
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              disabled={!categoryScroll.canBack}
              title="Previous categories"
              aria-label="Scroll to previous categories"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-200 transition-colors hover:border-stone-500 hover:bg-stone-800 disabled:cursor-default disabled:opacity-25 md:flex"
            >
              <ChevronLeft size={19} />
            </button>
            <div
              ref={categoryScrollerRef}
              onWheel={(event) => {
                const scroller = categoryScrollerRef.current;
                if (!scroller || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
                const maxScroll = scroller.scrollWidth - scroller.clientWidth;
                const canMove = event.deltaY > 0
                  ? scroller.scrollLeft < maxScroll - 2
                  : scroller.scrollLeft > 2;
                if (!canMove) return;
                event.preventDefault();
                scroller.scrollLeft += event.deltaY;
              }}
              className="min-w-0 flex-1 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex min-w-max gap-2">
                {["All", ...(specialProducts.length ? ["Specials"] : []), ...order].map((category) => {
                  const active = activeCat === category;

                  return (
                    <motion.button
                      key={category}
                      type="button"
                      data-category-tab={category}
                      aria-current={active ? "page" : undefined}
                      whileHover={active ? undefined : { y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveCat(category)}
                      className={`relative whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors ${
                        active
                          ? "border-burgundy-700 bg-burgundy-800 text-stone-100"
                          : "border-stone-700/70 bg-stone-900/70 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                      }`}
                    >
                      {category}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              disabled={!categoryScroll.canForward}
              title="More categories"
              aria-label="Scroll to more categories"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-200 transition-colors hover:border-stone-500 hover:bg-stone-800 disabled:cursor-default disabled:opacity-25 md:flex"
            >
              <ChevronRight size={19} />
            </button>
          </div>
          <div className="mx-1 mt-1 h-1 overflow-hidden rounded-full bg-stone-800 md:mx-[52px]" aria-hidden="true">
            <div
              className="h-full rounded-full bg-burgundy-600 transition-[width,transform] duration-150"
              style={{
                width: `${categoryScroll.thumbWidth}%`,
                transform: `translateX(${categoryScroll.thumbOffset / (categoryScroll.thumbWidth / 100)}%)`,
              }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`public-${activeCat}-${query}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-10"
          >
            {grouped.length === 0 ? (
              <div className="rounded-[28px] border border-stone-800/80 bg-stone-900/60 px-6 py-20 text-center">
                <div className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
                  No matches
                </div>
                <p className="mt-3 text-stone-400">
                  Try a broader product name or switch to another category.
                </p>
              </div>
            ) : (
              grouped.map((group, groupIndex) => (
                <div key={group.category} className="mb-16 last:mb-0">
                  <CategoryBanner category={group.category} count={group.items.length} />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {group.items.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} anchorId={activeCat === "Specials" && groupIndex === 0 && index === 0 ? "first-special-product" : undefined} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
