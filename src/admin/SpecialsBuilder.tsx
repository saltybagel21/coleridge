import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgePercent,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Megaphone,
  Package,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Product } from "../shop/products";

type CatalogueResponse = { products: Product[] };
type SessionResponse = { authenticated: true; email: string };

type CampaignDetails = {
  title: string;
  openingLine: string;
  startDate: string;
  endDate: string;
  note: string;
};

type DealItem = {
  productId: string;
  specialPrice: string;
};

type SavedDraft = {
  details: CampaignDetails;
  selectedItems: DealItem[];
  category: string;
  onlyAvailable: boolean;
};

type CampaignTemplate = {
  id: string;
  label: string;
  title: string;
  openingLine: string;
  note: string;
};

const DRAFT_KEY = "cm-specials-builder-v2";

const EMPTY_DETAILS: CampaignDetails = {
  title: "Weekly Specials",
  openingLine: "Fresh value from the Coleridge Meat counter.",
  startDate: "",
  endDate: "",
  note: "While stocks last. Please confirm availability when ordering.",
};

const TEMPLATES: CampaignTemplate[] = [
  {
    id: "weekly",
    label: "Weekly",
    title: "Weekly Specials",
    openingLine: "Fresh value from the Coleridge Meat counter.",
    note: "While stocks last. Please confirm availability when ordering.",
  },
  {
    id: "braai",
    label: "Braai",
    title: "Weekend Braai Specials",
    openingLine: "Get the fire ready with these Coleridge Meat favourites.",
    note: "Available while stocks last. Order early for the weekend.",
  },
  {
    id: "month-end",
    label: "Month-end",
    title: "Month-End Value",
    openingLine: "Stock up and make your budget go further.",
    note: "Limited quantities available. Please confirm your order with our team.",
  },
  {
    id: "freezer",
    label: "Freezer",
    title: "Freezer Fillers",
    openingLine: "Practical family favourites at special prices.",
    note: "Perfect for stocking up. Available while stocks last.",
  },
];

const readJson = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
};

const loadDraft = (): SavedDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDraft;
    if (!parsed.details || !Array.isArray(parsed.selectedItems)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveDraft = (draft: SavedDraft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Draft persistence is a convenience; the builder remains usable without it.
  }
};

const formatDate = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (value: number) => `R${value.toFixed(2)}`;

const numericPrice = (value: string) => {
  const price = Number.parseFloat(value);
  return Number.isFinite(price) && price > 0 ? price : null;
};

const messagePrice = (product: Product, specialPrice: string) => {
  const price = numericPrice(specialPrice);
  if (price != null) return `${formatMoney(price)}/${product.unit}`;
  return product.priceLabel || "Ask for price";
};

const discountPercent = (product: Product, specialPrice: string) => {
  const price = numericPrice(specialPrice);
  if (price == null || product.price <= 0 || price >= product.price) return 0;
  return Math.round(((product.price - price) / product.price) * 100);
};

const buildMessage = (
  details: CampaignDetails,
  items: Array<{ product: Product; specialPrice: string }>,
) => {
  const lines: string[] = [];
  const groups = new Map<string, Array<{ product: Product; specialPrice: string }>>();

  items.forEach((item) => {
    const current = groups.get(item.product.category) ?? [];
    current.push(item);
    groups.set(item.product.category, current);
  });

  lines.push(`*${details.title.trim() || "Coleridge Meat Specials"}*`);
  lines.push("_Coleridge Meat | Stellenbosch_");

  if (details.startDate && details.endDate) {
    lines.push(`Valid ${formatDate(details.startDate)} to ${formatDate(details.endDate)}`);
  } else if (details.startDate) {
    lines.push(`Valid from ${formatDate(details.startDate)}`);
  } else if (details.endDate) {
    lines.push(`Valid until ${formatDate(details.endDate)}`);
  }

  if (details.openingLine.trim()) {
    lines.push("");
    lines.push(details.openingLine.trim());
  }

  groups.forEach((categoryItems, category) => {
    lines.push("");
    lines.push(`*${category.toUpperCase()}*`);

    categoryItems.forEach(({ product, specialPrice }) => {
      const price = numericPrice(specialPrice);
      lines.push(`- *${product.name}* - ${messagePrice(product, specialPrice)}`);

      if (price != null && product.price > 0 && price < product.price) {
        const saving = product.price - price;
        const percent = discountPercent(product, specialPrice);
        lines.push(
          `  Was ${formatMoney(product.price)}/${product.unit} | Save ${formatMoney(saving)} (${percent}%)`,
        );
      }
    });
  });

  if (details.note.trim()) {
    lines.push("");
    lines.push(`_${details.note.trim()}_`);
  }

  lines.push("");
  lines.push("*To order*");
  lines.push("Reply to this message and our team will confirm availability and collection or delivery.");
  lines.push("");
  lines.push("*Coleridge Meat*");
  lines.push("18 Tennant Road, Cloetesville, Stellenbosch");
  lines.push("WhatsApp / Call: *061 127 5756*");

  return lines.join("\n");
};

const renderWhatsAppLine = (line: string) => {
  const parts = line.split(/(\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={`${part}-${index}`}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const SpecialsBuilder: React.FC = () => {
  const savedDraft = useMemo(() => loadDraft(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(savedDraft?.category ?? "All");
  const [onlyAvailable, setOnlyAvailable] = useState(savedDraft?.onlyAvailable ?? true);
  const [details, setDetails] = useState<CampaignDetails>(savedDraft?.details ?? EMPTY_DETAILS);
  const [selectedItems, setSelectedItems] = useState<DealItem[]>(savedDraft?.selectedItems ?? []);
  const [customDiscount, setCustomDiscount] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [session, catalogue] = await Promise.all([
        fetch("/admin-api/session", { cache: "no-store" }).then((response) =>
          readJson<SessionResponse>(response),
        ),
        fetch("/admin-api/products", { cache: "no-store" }).then((response) =>
          readJson<CatalogueResponse>(response),
        ),
      ]);
      setEmail(session.email);
      setProducts(catalogue.products);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The live catalogue could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Specials Builder | Coleridge Meat";
    const robots = document.querySelector('meta[name="robots"]');
    const previousRobots = robots?.getAttribute("content") ?? null;
    robots?.setAttribute("content", "noindex, nofollow");
    void load();
    return () => {
      if (robots && previousRobots) robots.setAttribute("content", previousRobots);
    };
  }, []);

  useEffect(() => {
    saveDraft({ details, selectedItems, category, onlyAvailable });
  }, [details, selectedItems, category, onlyAvailable]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const categories = useMemo(
    () =>
      Array.from(new Set<string>(products.map((product) => product.category))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [products],
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((item) => item.productId)),
    [selectedItems],
  );

  const filteredProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return products.filter((product) => {
      const available = product.enabled !== false && product.stockStatus !== "out_of_stock";
      return (
        (category === "All" || product.category === category) &&
        (!onlyAvailable || available) &&
        (!lower ||
          product.name.toLowerCase().includes(lower) ||
          product.category.toLowerCase().includes(lower) ||
          product.note?.toLowerCase().includes(lower))
      );
    });
  }, [products, query, category, onlyAvailable]);

  const selectedProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return selectedItems
      .map((item) => {
        const product = byId.get(item.productId);
        return product ? { ...item, product } : null;
      })
      .filter((item): item is DealItem & { product: Product } => item !== null);
  }, [products, selectedItems]);

  const message = useMemo(() => buildMessage(details, selectedProducts), [details, selectedProducts]);
  const dateError = Boolean(details.startDate && details.endDate && details.endDate < details.startDate);
  const invalidPriceCount = selectedProducts.filter(
    ({ product, specialPrice }) => numericPrice(specialPrice) == null && !product.priceLabel,
  ).length;
  const canSend = selectedProducts.length > 0 && !dateError && invalidPriceCount === 0;
  const discountedCount = selectedProducts.filter(({ product, specialPrice }) =>
    Boolean(discountPercent(product, specialPrice)),
  ).length;
  const averageDiscount = discountedCount
    ? Math.round(
        selectedProducts.reduce(
          (sum, { product, specialPrice }) => sum + discountPercent(product, specialPrice),
          0,
        ) / discountedCount,
      )
    : 0;

  const toggleProduct = (product: Product) => {
    setSelectedItems((current) => {
      if (current.some((item) => item.productId === product.id)) {
        return current.filter((item) => item.productId !== product.id);
      }
      return [
        ...current,
        { productId: product.id, specialPrice: product.price > 0 ? product.price.toFixed(2) : "" },
      ];
    });
  };

  const updatePrice = (productId: string, specialPrice: string) => {
    setSelectedItems((current) =>
      current.map((item) => (item.productId === productId ? { ...item, specialPrice } : item)),
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedItems.length) return;
    setSelectedItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const applyDiscount = (percentage: number) => {
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage >= 100) return;
    setSelectedItems((current) =>
      current.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product || product.price <= 0) return item;
        return { ...item, specialPrice: (product.price * (1 - percentage / 100)).toFixed(2) };
      }),
    );
    setNotice(`${percentage}% discount applied to selected products.`);
  };

  const restorePrices = () => {
    setSelectedItems((current) =>
      current.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return {
          ...item,
          specialPrice: product && product.price > 0 ? product.price.toFixed(2) : "",
        };
      }),
    );
    setNotice("Standard prices restored.");
  };

  const applyTemplate = (template: CampaignTemplate) => {
    setDetails((current) => ({
      ...current,
      title: template.title,
      openingLine: template.openingLine,
      note: template.note,
    }));
    setNotice(`${template.label} campaign wording applied.`);
  };

  const copyMessage = async () => {
    if (!canSend) return;
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    setNotice("Specials message copied.");
    window.setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsApp = () => {
    if (!canSend) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const resetDraft = () => {
    setDetails(EMPTY_DETAILS);
    setSelectedItems([]);
    setQuery("");
    setCategory("All");
    setOnlyAvailable(true);
    setCustomDiscount("");
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore storage restrictions.
    }
    setNotice("Draft cleared.");
  };

  const inputClass =
    "w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-burgundy-500";
  const labelClass =
    "mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400";

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-950 text-stone-200">
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-burgundy-700/50 bg-burgundy-900/40 text-burgundy-200">
              <Megaphone size={19} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-xl text-stone-100">Specials Builder</div>
              <div className="truncate text-xs text-stone-500">Coleridge Meat</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/"
              title="Catalogue manager"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-300 transition-colors hover:bg-stone-900 hover:text-white"
            >
              <Package size={16} /> <span className="hidden sm:inline">Catalogue</span>
            </a>
            <button
              type="button"
              onClick={() => void load()}
              title="Refresh live products"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-900 hover:text-white"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <a
              href="/cdn-cgi/access/logout"
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-900 hover:text-white"
            >
              <LogOut size={16} />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 border-b border-stone-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">
              Owner tools
            </div>
            <h1 className="mt-2 font-serif text-3xl text-stone-100 sm:text-4xl">
              Build a WhatsApp campaign
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Pick live catalogue products, set offer prices and send a polished message to any
              WhatsApp contact or broadcast list.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span>{email ? `Signed in as ${email}` : "Checking secure session"}</span>
            <span className="text-stone-700">|</span>
            <span>Draft saves on this device</span>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-red-900/60 bg-red-950/35 px-4 py-3 text-sm text-red-100">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-md border border-emerald-800/60 bg-emerald-950 px-4 py-3 text-sm text-emerald-100 shadow-2xl">
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border-b border-stone-800 pb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Selected</div>
            <div className="mt-2 font-serif text-3xl text-stone-100">{selectedProducts.length}</div>
          </div>
          <div className="border-b border-stone-800 pb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Discounted</div>
            <div className="mt-2 font-serif text-3xl text-emerald-300">{discountedCount}</div>
          </div>
          <div className="border-b border-stone-800 pb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Average saving</div>
            <div className="mt-2 font-serif text-3xl text-burgundy-300">
              {averageDiscount ? `${averageDiscount}%` : "-"}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="campaign-heading">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">
                    Step 1
                  </div>
                  <h2 id="campaign-heading" className="mt-1 font-serif text-2xl text-stone-100">
                    Campaign details
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-700 px-3 text-xs text-stone-400 transition-colors hover:bg-stone-900 hover:text-white"
                >
                  <RotateCcw size={14} /> Clear
                </button>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-stone-700 bg-stone-900 px-3 text-xs text-stone-300 transition-colors hover:border-burgundy-600 hover:text-white"
                  >
                    <Sparkles size={13} /> {template.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={labelClass}>Campaign title</span>
                  <input
                    value={details.title}
                    onChange={(event) => setDetails((current) => ({ ...current, title: event.target.value }))}
                    className={inputClass}
                    placeholder="Weekend Braai Specials"
                  />
                </label>
                <label>
                  <span className={labelClass}>Starts</span>
                  <input
                    type="date"
                    value={details.startDate}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, startDate: event.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Ends</span>
                  <input
                    type="date"
                    value={details.endDate}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, endDate: event.target.value }))
                    }
                    className={`${inputClass} ${dateError ? "border-red-700" : ""}`}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass}>Opening line</span>
                  <input
                    value={details.openingLine}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, openingLine: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="Fresh value from the counter."
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass}>Terms or order note</span>
                  <textarea
                    value={details.note}
                    onChange={(event) => setDetails((current) => ({ ...current, note: event.target.value }))}
                    className={`${inputClass} min-h-24 resize-y`}
                    placeholder="While stocks last."
                  />
                </label>
              </div>
              {dateError && <p className="mt-2 text-xs text-red-300">The end date is before the start date.</p>}
            </section>

            <section className="border-t border-stone-800 pt-8" aria-labelledby="products-heading">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">
                Step 2
              </div>
              <h2 id="products-heading" className="mt-1 font-serif text-2xl text-stone-100">
                Pick products
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Search live products"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      title="Clear search"
                      className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-stone-500 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
                  <option>All</option>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <label className="mt-3 inline-flex cursor-pointer items-center gap-3 text-xs text-stone-400">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) => setOnlyAvailable(event.target.checked)}
                  className="h-4 w-4 accent-burgundy-600"
                />
                Show only products currently in stock and visible
              </label>

              <div className="mt-4 max-h-[540px] overflow-y-auto rounded-md border border-stone-800 bg-stone-950">
                {loading ? (
                  <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-stone-500">
                    <Loader2 size={18} className="animate-spin" /> Loading live catalogue
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex min-h-48 items-center justify-center text-sm text-stone-500">
                    No products match these filters.
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const selected = selectedIds.has(product.id);
                    const unavailable = product.enabled === false || product.stockStatus === "out_of_stock";
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product)}
                        className={`flex w-full items-center gap-3 border-b border-stone-800 px-4 py-3 text-left transition-colors last:border-b-0 ${
                          selected ? "bg-burgundy-950/45" : "hover:bg-stone-900"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                            selected
                              ? "border-burgundy-500 bg-burgundy-700 text-white"
                              : "border-stone-700 text-transparent"
                          }`}
                        >
                          <Check size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-stone-100">{product.name}</span>
                          <span className="mt-1 block truncate text-[11px] text-stone-500">
                            {product.category}{unavailable ? " | Out of stock or hidden" : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-stone-300">
                          {product.price > 0 ? `${formatMoney(product.price)}/${product.unit}` : product.priceLabel || "POA"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-8">
            <section aria-labelledby="offers-heading">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">
                    Step 3
                  </div>
                  <h2 id="offers-heading" className="mt-1 font-serif text-2xl text-stone-100">
                    Set offer prices
                  </h2>
                </div>
                {selectedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={restorePrices}
                    className="inline-flex h-9 items-center gap-2 text-xs text-stone-400 transition-colors hover:text-white"
                  >
                    <RefreshCw size={13} /> Restore prices
                  </button>
                )}
              </div>

              {selectedProducts.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-stone-800 py-3">
                  <span className="mr-1 inline-flex items-center gap-2 text-xs text-stone-500">
                    <BadgePercent size={14} /> Apply to all
                  </span>
                  {[5, 10, 15, 20].map((percentage) => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => applyDiscount(percentage)}
                      className="h-8 rounded-md border border-stone-700 px-3 text-xs font-semibold text-stone-300 transition-colors hover:border-burgundy-600 hover:text-white"
                    >
                      {percentage}%
                    </button>
                  ))}
                  <div className="flex h-8 overflow-hidden rounded-md border border-stone-700">
                    <input
                      value={customDiscount}
                      onChange={(event) => setCustomDiscount(event.target.value)}
                      inputMode="decimal"
                      className="w-20 bg-stone-950 px-2 text-xs text-stone-100 outline-none"
                      placeholder="Custom"
                    />
                    <button
                      type="button"
                      onClick={() => applyDiscount(Number.parseFloat(customDiscount))}
                      title="Apply custom discount"
                      className="flex w-8 items-center justify-center border-l border-stone-700 text-stone-400 hover:bg-stone-900 hover:text-white"
                    >
                      <Percent size={13} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {selectedProducts.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-stone-800 px-6 text-center">
                    <Plus size={20} className="text-stone-600" />
                    <p className="mt-3 text-sm text-stone-400">Select products from the live catalogue.</p>
                    <p className="mt-1 text-xs text-stone-600">They will appear here in message order.</p>
                  </div>
                ) : (
                  selectedProducts.map(({ product, specialPrice }, index) => {
                    const percent = discountPercent(product, specialPrice);
                    const invalid = numericPrice(specialPrice) == null && !product.priceLabel;
                    return (
                      <div key={product.id} className="rounded-md border border-stone-800 bg-stone-900/40 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex shrink-0 flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveItem(index, -1)}
                              disabled={index === 0}
                              title="Move up"
                              className="flex h-7 w-7 items-center justify-center rounded border border-stone-700 text-stone-500 hover:text-white disabled:opacity-25"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(index, 1)}
                              disabled={index === selectedProducts.length - 1}
                              title="Move down"
                              className="flex h-7 w-7 items-center justify-center rounded border border-stone-700 text-stone-500 hover:text-white disabled:opacity-25"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-stone-100">{product.name}</div>
                                <div className="mt-1 text-[11px] text-stone-500">
                                  Normal: {product.price > 0 ? `${formatMoney(product.price)}/${product.unit}` : product.priceLabel || "POA"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleProduct(product)}
                                title="Remove product"
                                className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-600 hover:text-red-300"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                              <label className="relative block flex-1">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">R</span>
                                <input
                                  value={specialPrice}
                                  onChange={(event) => updatePrice(product.id, event.target.value)}
                                  inputMode="decimal"
                                  className={`${inputClass} pl-8 ${invalid ? "border-red-700" : ""}`}
                                  placeholder="Offer price"
                                />
                              </label>
                              <span className="w-14 shrink-0 text-xs text-stone-500">/{product.unit}</span>
                              {percent > 0 && (
                                <span className="shrink-0 rounded border border-emerald-800 bg-emerald-950/60 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                                  -{percent}%
                                </span>
                              )}
                            </div>
                            {invalid && <p className="mt-2 text-xs text-red-300">Enter a valid offer price.</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="border-t border-stone-800 pt-8" aria-labelledby="preview-heading">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">
                    Step 4
                  </div>
                  <h2 id="preview-heading" className="mt-1 font-serif text-2xl text-stone-100">
                    Preview and send
                  </h2>
                </div>
                <div className="text-right text-[11px] text-stone-500">
                  <div>{message.length.toLocaleString("en-ZA")} characters</div>
                  <div>{selectedProducts.length} products</div>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-stone-800 bg-[#0b141a] p-4 sm:p-5">
                <div className="ml-auto max-w-[92%] break-words rounded-md rounded-tr-none bg-[#005c4b] px-4 py-3 text-[13px] leading-6 text-white shadow-lg [overflow-wrap:anywhere] sm:max-w-[88%]">
                  {message.split("\n").map((line, index) => (
                    <p key={`${line}-${index}`} className={line ? "min-h-6" : "h-3"}>
                      {renderWhatsAppLine(line)}
                    </p>
                  ))}
                </div>
              </div>

              {message.length > 3500 && (
                <p className="mt-3 text-xs text-amber-300">
                  This is a long message. Consider using fewer products for easier reading.
                </p>
              )}
              {!selectedProducts.length && (
                <p className="mt-3 text-xs text-stone-500">Select at least one product before sending.</p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openWhatsApp}
                  disabled={!canSend}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 transition-colors hover:bg-[#3ee477] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Send size={17} /> Open WhatsApp <ExternalLink size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void copyMessage()}
                  disabled={!canSend}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-stone-700 bg-stone-900 px-5 text-xs font-bold uppercase tracking-[0.14em] text-stone-200 transition-colors hover:border-stone-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  {copied ? "Copied" : "Copy message"}
                </button>
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-stone-500">
                <Clipboard size={14} className="mt-0.5 shrink-0" />
                WhatsApp opens with the message ready, then Stefan chooses the contact, group or broadcast list.
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpecialsBuilder;
