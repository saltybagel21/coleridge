import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BadgePercent,
  CalendarDays,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileText,
  FileDown,
  ListChecks,
  Loader2,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { SpecialCampaign, SpecialOffer, SpecialTier } from "../shared/specials";
import { getCampaignStatus, getJohannesburgDate } from "../shared/specials";
import type { Product } from "../shop/products";
import { buildSpecialsMessage, formatCampaignDate, formatSpecialMoney } from "./specialsMessage";

type CatalogueResponse = { products: Product[] };
type CampaignsResponse = { campaigns: SpecialCampaign[] };
type SessionResponse = { authenticated: true; email: string };
type CampaignForm = Omit<SpecialCampaign, "id" | "createdAt" | "updatedAt">;

type CampaignTemplate = {
  id: string;
  label: string;
  title: string;
  openingLine: string;
  note: string;
  custom?: boolean;
};

const CUSTOM_TEMPLATES_KEY = "cm-specials-custom-templates-v2";

const BUILT_IN_TEMPLATES: CampaignTemplate[] = [
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

const addDays = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

const emptyCampaign = (): CampaignForm => {
  const today = getJohannesburgDate();
  return {
    title: "Weekly Specials",
    subtitle: "Coleridge Meat | Stellenbosch",
    openingLine: "Fresh value from the Coleridge Meat counter.",
    startDate: today,
    endDate: addDays(today, 6),
    validityLine: "",
    includeYear: true,
    note: "While stocks last. Please confirm availability when ordering.",
    orderInstructions: "Order through the website and our team will confirm availability, collection or delivery.",
    published: false,
    items: [],
    customMessage: null,
  };
};

const toCampaign = (form: CampaignForm, id = "preview"): SpecialCampaign => ({
  ...form,
  id,
  createdAt: "",
  updatedAt: "",
});

const readJson = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
};

const loadCustomTemplates = (): CampaignTemplate[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || "[]") as CampaignTemplate[];
    return Array.isArray(parsed) ? parsed.filter((template) => template.custom) : [];
  } catch {
    return [];
  }
};

const makeId = () => crypto.randomUUID();
const numericValue = (value: string) => (value === "" ? null : Number(value));

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

const statusStyles = {
  active: "border-emerald-800/70 bg-emerald-950/45 text-emerald-200",
  scheduled: "border-blue-800/70 bg-blue-950/45 text-blue-200",
  draft: "border-stone-700 bg-stone-900 text-stone-300",
  expired: "border-amber-900/70 bg-amber-950/35 text-amber-200",
} as const;

const SpecialsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<SpecialCampaign[]>([]);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<CampaignForm>(emptyCampaign);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"builder" | "campaigns">("builder");
  const [messageView, setMessageView] = useState<"preview" | "edit">("preview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CampaignTemplate[]>(loadCustomTemplates);
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpecialCampaign | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [session, catalogue, specials] = await Promise.all([
        fetch("/admin-api/session", { cache: "no-store" }).then((response) => readJson<SessionResponse>(response)),
        fetch("/admin-api/products", { cache: "no-store" }).then((response) => readJson<CatalogueResponse>(response)),
        fetch("/admin-api/specials", { cache: "no-store" }).then((response) => readJson<CampaignsResponse>(response)),
      ]);
      setEmail(session.email);
      setProducts(catalogue.products);
      setCampaigns(specials.campaigns);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The specials workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Specials Manager | Coleridge Meat";
    const robots = document.querySelector('meta[name="robots"]');
    const previousRobots = robots?.getAttribute("content") ?? null;
    robots?.setAttribute("content", "noindex, nofollow");
    void load();
    return () => {
      if (robots && previousRobots) robots.setAttribute("content", previousRobots);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
    } catch {
      // Presets are an optional convenience.
    }
  }, [customTemplates]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const categories = useMemo(
    () => Array.from(new Set<string>(products.map((product) => product.category))).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const selectedIds = useMemo(() => new Set(form.items.map((item) => item.productId)), [form.items]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const filteredProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return products.filter((product) => {
      const available = product.enabled !== false && product.stockStatus !== "out_of_stock";
      return (
        (category === "All" || product.category === category) &&
        (!onlyAvailable || available) &&
        (!lower || product.name.toLowerCase().includes(lower) || product.category.toLowerCase().includes(lower))
      );
    });
  }, [products, query, category, onlyAvailable]);

  const message = useMemo(
    () => form.customMessage ?? buildSpecialsMessage(toCampaign(form, editingId ?? "preview"), products),
    [form, editingId, products],
  );

  const validationError = useMemo(() => {
    if (!form.title.trim()) return "Add a campaign title.";
    if (!form.startDate || !form.endDate) return "Choose the campaign dates.";
    if (form.endDate < form.startDate) return "The end date cannot be before the start date.";
    if (!form.items.length) return "Select at least one product.";

    for (const item of form.items) {
      const product = productById.get(item.productId);
      if (item.pricingMode === "fixed") {
        if (item.fixedPrice == null || item.fixedPrice <= 0) return `Enter a valid price for ${product?.name ?? "each offer"}.`;
      } else {
        if (!item.tiers.length) return `Add a price tier for ${product?.name ?? "each offer"}.`;
        const tiers = item.tiers.slice().sort((a, b) => (a.minQty ?? -1) - (b.minQty ?? -1));
        for (let index = 0; index < tiers.length; index += 1) {
          const tier = tiers[index];
          if (tier.price <= 0) return `Complete every tier for ${product?.name ?? "the offer"}.`;
          if (tier.minQty != null && tier.maxQty != null && tier.minQty >= tier.maxQty) {
            return `A tier maximum must be above its minimum for ${product?.name ?? "the offer"}.`;
          }
          const previous = tiers[index - 1];
          if (previous && (previous.maxQty == null || tier.minQty == null || tier.minQty < previous.maxQty)) {
            return `Price tiers overlap for ${product?.name ?? "the offer"}.`;
          }
        }
      }
    }
    return "";
  }, [form, productById]);

  const updateForm = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === "customMessage" ? {} : {}) }));
  };

  const updateItem = (productId: string, update: (item: SpecialOffer) => SpecialOffer) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => (item.productId === productId ? update(item) : item)),
      customMessage: null,
    }));
  };

  const toggleProduct = (product: Product) => {
    setForm((current) => {
      const exists = current.items.some((item) => item.productId === product.id);
      const items = exists
        ? current.items.filter((item) => item.productId !== product.id)
        : [
            ...current.items,
            {
              id: makeId(),
              productId: product.id,
              displayName: product.name,
              pricingMode: "fixed" as const,
              fixedPrice: product.price > 0 ? product.price : null,
              tiers: [],
              sortOrder: current.items.length,
            },
          ];
      return { ...current, items: items.map((item, index) => ({ ...item, sortOrder: index })), customMessage: null };
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.items.length) return;
    setForm((current) => {
      const items = current.items.slice();
      [items[index], items[target]] = [items[target], items[index]];
      return { ...current, items: items.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })), customMessage: null };
    });
  };

  const setPricingMode = (item: SpecialOffer, mode: "fixed" | "tiered") => {
    const product = productById.get(item.productId);
    const threshold = product?.unit === "each" ? 10 : 3;
    updateItem(item.productId, (current) => ({
      ...current,
      pricingMode: mode,
      fixedPrice: mode === "fixed" ? current.fixedPrice ?? product?.price ?? null : null,
      tiers:
        mode === "tiered"
          ? current.tiers.length
            ? current.tiers
            : [
                { id: makeId(), minQty: null, maxQty: threshold, price: product?.price ?? 0 },
                { id: makeId(), minQty: threshold, maxQty: null, price: product?.price ?? 0 },
              ]
          : [],
    }));
  };

  const updateTier = (productId: string, tierId: string, changes: Partial<SpecialTier>) => {
    updateItem(productId, (item) => ({
      ...item,
      tiers: item.tiers.map((tier) => (tier.id === tierId ? { ...tier, ...changes } : tier)),
    }));
  };

  const addTier = (item: SpecialOffer) => {
    const product = productById.get(item.productId);
    updateItem(item.productId, (current) => ({
      ...current,
      tiers: [
        ...current.tiers,
        { id: makeId(), minQty: null, maxQty: null, price: product?.price ?? 0 },
      ],
    }));
  };

  const removeTier = (productId: string, tierId: string) => {
    updateItem(productId, (item) => ({ ...item, tiers: item.tiers.filter((tier) => tier.id !== tierId) }));
  };

  const applyTemplate = (template: CampaignTemplate) => {
    setForm((current) => ({
      ...current,
      title: template.title,
      openingLine: template.openingLine,
      note: template.note,
      customMessage: null,
    }));
    setNotice(`${template.label} wording applied.`);
  };

  const addCustomTemplate = () => {
    const label = presetName.trim();
    if (!label) return;
    setCustomTemplates((current) => [
      ...current,
      {
        id: makeId(),
        label: label.slice(0, 24),
        title: form.title,
        openingLine: form.openingLine,
        note: form.note,
        custom: true,
      },
    ]);
    setPresetName("");
    setShowPresetInput(false);
    setNotice(`${label} preset added.`);
  };

  const replaceCampaign = (campaign: SpecialCampaign) => {
    setCampaigns((current) =>
      [campaign, ...current.filter((item) => item.id !== campaign.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  };

  const saveCampaign = async (published: boolean) => {
    if (validationError) {
      setError(validationError);
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editingId ? `/admin-api/specials/${encodeURIComponent(editingId)}` : "/admin-api/specials", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, published }),
      });
      const result = await readJson<{ campaign: SpecialCampaign }>(response);
      replaceCampaign(result.campaign);
      setEditingId(result.campaign.id);
      setForm(({ ...result.campaign, published: result.campaign.published }));
      setNotice(published ? "Campaign published to the website." : "Campaign saved as a draft.");
      return result.campaign;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The campaign could not be saved.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = (campaignMessage = message) => {
    const url = `https://wa.me/?text=${encodeURIComponent(campaignMessage)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  };

  const publishAndSend = async () => {
    const popup = window.open("about:blank", "_blank");
    const campaign = await saveCampaign(true);
    if (!campaign) {
      popup?.close();
      return;
    }
    const finalMessage = campaign.customMessage ?? buildSpecialsMessage(campaign, products);
    const url = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
    if (popup) popup.location.href = url;
    else window.location.href = url;
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const editCampaign = (campaign: SpecialCampaign) => {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...campaignForm } = campaign;
    setEditingId(id);
    setForm(campaignForm);
    setView("builder");
    setMessageView("preview");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newCampaign = () => {
    setEditingId(null);
    setForm(emptyCampaign());
    setView("builder");
    setMessageView("preview");
    setError("");
  };

  const togglePublished = async (campaign: SpecialCampaign) => {
    setRowBusy(campaign.id);
    setError("");
    try {
      const response = await fetch(`/admin-api/specials/${encodeURIComponent(campaign.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...campaign, published: !campaign.published }),
      });
      const result = await readJson<{ campaign: SpecialCampaign }>(response);
      replaceCampaign(result.campaign);
      if (editingId === campaign.id) setForm((current) => ({ ...current, published: result.campaign.published }));
      setNotice(result.campaign.published ? "Campaign published." : "Campaign removed from the website.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The campaign could not be updated.");
    } finally {
      setRowBusy(null);
    }
  };

  const deleteCampaign = async () => {
    if (!deleteTarget) return;
    setRowBusy(deleteTarget.id);
    setError("");
    try {
      const response = await fetch(`/admin-api/specials/${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      await readJson<{ deleted: true }>(response);
      setCampaigns((current) => current.filter((campaign) => campaign.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) newCampaign();
      setNotice("Campaign permanently deleted.");
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The campaign could not be deleted.");
    } finally {
      setRowBusy(null);
    }
  };

  const inputClass =
    "min-w-0 w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-burgundy-500";
  const labelClass = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400";
  const currentCampaign = toCampaign(form, editingId ?? "preview");
  const today = getJohannesburgDate();
  const activeCount = campaigns.filter((campaign) => getCampaignStatus(campaign, today) === "active").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-stone-950 text-sm text-stone-400">
        <Loader2 size={18} className="animate-spin" /> Loading specials workspace
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-burgundy-700/50 bg-burgundy-900/40 text-burgundy-200">
              <Megaphone size={18} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-xl text-stone-100">Specials Manager</div>
              <div className="truncate text-xs text-stone-500">{email || "Coleridge Meat"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/price-list/" title="Price-list studio" className="flex h-10 items-center gap-2 rounded-md border border-stone-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-300 hover:bg-stone-900">
              <FileDown size={15} /><span className="hidden lg:inline">Price list</span>
            </a>
            <a href="/admin/" title="Catalogue manager" className="flex h-10 items-center gap-2 rounded-md border border-stone-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-300 hover:bg-stone-900">
              <ArrowLeft size={15} /><span className="hidden sm:inline">Catalogue</span>
            </a>
            <button type="button" onClick={() => void load()} title="Refresh" className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:bg-stone-900 hover:text-white">
              <RefreshCw size={15} />
            </button>
            <a href="/cdn-cgi/access/logout" title="Sign out" className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:bg-stone-900 hover:text-white">
              <LogOut size={15} />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-9">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/35 px-4 py-3 text-sm text-red-100">
            <AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {notice && (
          <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-md border border-emerald-800/60 bg-emerald-950 px-4 py-3 text-sm text-emerald-100 shadow-2xl">
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        <div className="flex flex-col gap-5 border-b border-stone-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">Owner tools</div>
            <h1 className="mt-2 font-serif text-3xl text-stone-100 sm:text-4xl">Campaigns that price themselves</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              Build fixed or tiered offers, publish them to the online counter and share the same prices on WhatsApp.
            </p>
          </div>
          <button type="button" onClick={newCampaign} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-burgundy-700 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-burgundy-600">
            <Plus size={16} /> New campaign
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border-b border-stone-800 pb-4"><div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Campaigns</div><div className="mt-2 font-serif text-3xl text-stone-100">{campaigns.length}</div></div>
          <div className="border-b border-stone-800 pb-4"><div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Live now</div><div className="mt-2 font-serif text-3xl text-emerald-300">{activeCount}</div></div>
          <div className="border-b border-stone-800 pb-4"><div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Current offers</div><div className="mt-2 font-serif text-3xl text-stone-300">{form.items.length}</div></div>
        </div>

        <div className="mt-6 inline-flex rounded-md border border-stone-700 bg-stone-950 p-1">
          <button type="button" onClick={() => setView("builder")} className={`inline-flex h-9 items-center gap-2 rounded px-4 text-xs font-semibold ${view === "builder" ? "bg-stone-800 text-white" : "text-stone-500 hover:text-stone-200"}`}><Pencil size={14} /> Builder</button>
          <button type="button" onClick={() => setView("campaigns")} className={`inline-flex h-9 items-center gap-2 rounded px-4 text-xs font-semibold ${view === "campaigns" ? "bg-stone-800 text-white" : "text-stone-500 hover:text-stone-200"}`}><ListChecks size={14} /> Saved campaigns</button>
        </div>

        {view === "campaigns" ? (
          <section className="mt-6 overflow-hidden rounded-md border border-stone-800">
            {campaigns.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-stone-500">No campaigns have been saved yet.</div>
            ) : campaigns.map((campaign) => {
              const status = getCampaignStatus(campaign, today);
              const busy = rowBusy === campaign.id;
              return (
                <div key={campaign.id} className="grid gap-4 border-b border-stone-800 bg-stone-900/25 px-4 py-4 last:border-0 lg:grid-cols-[minmax(240px,1fr)_170px_100px_230px] lg:items-center">
                  <div className="min-w-0"><div className="truncate font-medium text-stone-100">{campaign.title}</div><div className="mt-1 text-xs text-stone-500">{campaign.items.length} offers | {formatCampaignDate(campaign.startDate, false)} to {formatCampaignDate(campaign.endDate, false)}</div></div>
                  <span className={`w-fit rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusStyles[status]}`}>{status}</span>
                  <div className="text-xs text-stone-500">{campaign.published ? "On website" : "Not public"}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => editCampaign(campaign)} title="Edit campaign" className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-white"><Pencil size={14} /></button>
                    <button type="button" disabled={busy} onClick={() => void togglePublished(campaign)} className="h-9 rounded-md border border-stone-700 px-3 text-xs font-semibold text-stone-300 hover:bg-stone-800 disabled:opacity-50">{busy ? "Saving" : campaign.published ? "Unpublish" : "Publish"}</button>
                    <button type="button" onClick={() => openWhatsApp(campaign.customMessage ?? buildSpecialsMessage(campaign, products))} title="Share on WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#25D366]/50 text-[#55df86] hover:bg-[#25D366]/10"><Send size={14} /></button>
                    <button type="button" onClick={() => setDeleteTarget(campaign)} title="Delete campaign" className="flex h-9 w-9 items-center justify-center rounded-md border border-red-900/60 text-red-300 hover:bg-red-950/50"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <div className="mt-8 space-y-10">
            <section aria-labelledby="campaign-details-heading">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">Step 1</div>
              <h2 id="campaign-details-heading" className="mt-1 font-serif text-2xl text-stone-100">Campaign details</h2>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[...BUILT_IN_TEMPLATES, ...customTemplates].map((template) => (
                  <div key={template.id} className="inline-flex overflow-hidden rounded-md border border-stone-700">
                    <button type="button" onClick={() => applyTemplate(template)} className="h-9 px-3 text-xs font-semibold text-stone-300 hover:bg-stone-900 hover:text-white">{template.label}</button>
                    {template.custom && <button type="button" onClick={() => setCustomTemplates((current) => current.filter((item) => item.id !== template.id))} title="Remove preset" className="flex h-9 w-8 items-center justify-center border-l border-stone-700 text-stone-600 hover:text-red-300"><X size={12} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => setShowPresetInput((current) => !current)} className="inline-flex h-9 items-center gap-2 rounded-md border border-dashed border-stone-700 px-3 text-xs text-stone-400 hover:text-white"><Plus size={13} /> Custom preset</button>
              </div>
              {showPresetInput && (
                <div className="mt-3 flex max-w-md gap-2"><input value={presetName} onChange={(event) => setPresetName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addCustomTemplate(); }} className={inputClass} placeholder="Preset name" /><button type="button" onClick={addCustomTemplate} className="rounded-md bg-stone-800 px-4 text-xs font-semibold text-white">Add</button></div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="xl:col-span-2"><span className={labelClass}>Campaign title</span><input value={form.title} onChange={(event) => updateForm("title", event.target.value)} className={inputClass} /></label>
                <label><span className={labelClass}>Starts</span><input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} className={inputClass} /></label>
                <label><span className={labelClass}>Ends after this date</span><input type="date" value={form.endDate} onChange={(event) => updateForm("endDate", event.target.value)} className={inputClass} /></label>
                <label className="xl:col-span-2"><span className={labelClass}>Subtitle</span><input value={form.subtitle} onChange={(event) => updateForm("subtitle", event.target.value)} className={inputClass} /></label>
                <label className="xl:col-span-2"><span className={labelClass}>Custom validity line (optional)</span><input value={form.validityLine} onChange={(event) => updateForm("validityLine", event.target.value)} className={inputClass} placeholder="For example: This weekend only" /></label>
                <label className="md:col-span-2 xl:col-span-4"><span className={labelClass}>Opening line</span><input value={form.openingLine} onChange={(event) => updateForm("openingLine", event.target.value)} className={inputClass} /></label>
                <label className="md:col-span-2"><span className={labelClass}>Campaign note</span><textarea rows={3} value={form.note} onChange={(event) => updateForm("note", event.target.value)} className={`${inputClass} resize-y`} /></label>
                <label className="md:col-span-2"><span className={labelClass}>Ordering instruction</span><textarea rows={3} value={form.orderInstructions} onChange={(event) => updateForm("orderInstructions", event.target.value)} className={`${inputClass} resize-y`} /></label>
              </div>
              <label className="mt-3 inline-flex items-center gap-3 text-xs text-stone-400"><input type="checkbox" checked={form.includeYear} onChange={(event) => updateForm("includeYear", event.target.checked)} className="h-4 w-4 accent-burgundy-600" /> Include the year in the WhatsApp dates</label>
            </section>

            <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
              <section className="min-w-0" aria-labelledby="products-heading">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">Step 2</div><h2 id="products-heading" className="mt-1 font-serif text-2xl text-stone-100">Choose products</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px] xl:grid-cols-1 2xl:grid-cols-[1fr_220px]">
                  <div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-10`} placeholder="Search catalogue" /></div>
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
                </div>
                <label className="mt-3 inline-flex items-center gap-3 text-xs text-stone-400"><input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} className="h-4 w-4 accent-burgundy-600" /> Only show products available now</label>
                <div className="mt-4 max-h-[560px] overflow-y-auto rounded-md border border-stone-800 bg-stone-950">
                  {filteredProducts.map((product) => {
                    const selected = selectedIds.has(product.id);
                    return <button key={product.id} type="button" onClick={() => toggleProduct(product)} className={`flex w-full items-center gap-3 border-b border-stone-800 px-4 py-3 text-left last:border-0 ${selected ? "bg-burgundy-950/45" : "hover:bg-stone-900"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${selected ? "border-burgundy-500 bg-burgundy-700 text-white" : "border-stone-700 text-transparent"}`}><Check size={13} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-stone-100">{product.name}</span><span className="mt-1 block truncate text-[11px] text-stone-500">{product.category}</span></span><span className="shrink-0 text-sm text-stone-300">{product.price > 0 ? formatSpecialMoney(product.price) : product.priceLabel}</span></button>;
                  })}
                </div>
              </section>

              <section className="min-w-0" aria-labelledby="pricing-heading">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">Step 3</div><h2 id="pricing-heading" className="mt-1 font-serif text-2xl text-stone-100">Set offer pricing</h2>
                <p className="mt-2 text-xs leading-5 text-stone-500">Tier minimums are included; upper limits are not. Any intentional gap uses the normal catalogue price.</p>
                <div className="mt-4 space-y-3">
                  {form.items.length === 0 ? <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-stone-800 px-5 text-sm text-stone-500">Select products to begin.</div> : form.items.map((item, index) => {
                    const product = productById.get(item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.id} className="rounded-md border border-stone-800 bg-stone-900/35 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex shrink-0 flex-col gap-1"><button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} className="flex h-7 w-7 items-center justify-center rounded border border-stone-700 text-stone-500 disabled:opacity-25"><ArrowUp size={12} /></button><button type="button" disabled={index === form.items.length - 1} onClick={() => moveItem(index, 1)} className="flex h-7 w-7 items-center justify-center rounded border border-stone-700 text-stone-500 disabled:opacity-25"><ArrowDown size={12} /></button></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3"><div><div className="font-medium text-stone-100">{product.name}</div><div className="mt-1 text-[11px] text-stone-500">Normal: {product.price > 0 ? `${formatSpecialMoney(product.price)}/${product.unit}` : product.priceLabel}</div></div><button type="button" onClick={() => toggleProduct(product)} title="Remove offer" className="flex h-8 w-8 items-center justify-center text-stone-600 hover:text-red-300"><Trash2 size={14} /></button></div>
                            <label className="mt-3 block"><span className={labelClass}>Name shown in the special</span><input value={item.displayName} onChange={(event) => updateItem(item.productId, (current) => ({ ...current, displayName: event.target.value }))} className={inputClass} /></label>
                            <div className="mt-3 inline-flex rounded-md border border-stone-700 bg-stone-950 p-1"><button type="button" onClick={() => setPricingMode(item, "fixed")} className={`h-8 rounded px-3 text-xs font-semibold ${item.pricingMode === "fixed" ? "bg-burgundy-700 text-white" : "text-stone-500"}`}>Fixed price</button><button type="button" onClick={() => setPricingMode(item, "tiered")} className={`h-8 rounded px-3 text-xs font-semibold ${item.pricingMode === "tiered" ? "bg-burgundy-700 text-white" : "text-stone-500"}`}>Tiered price</button></div>
                            {item.pricingMode === "fixed" ? (
                              <label className="relative mt-3 block max-w-xs"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">R</span><input type="number" min="0.01" step="0.01" value={item.fixedPrice ?? ""} onChange={(event) => updateItem(item.productId, (current) => ({ ...current, fixedPrice: numericValue(event.target.value) }))} aria-label={`Special price for ${item.displayName}`} className={`${inputClass} pl-8`} /></label>
                            ) : (
                              <div className="mt-3 space-y-2">
                                <div className="hidden grid-cols-[1fr_1fr_1fr_36px] gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:grid"><span>From (blank = start)</span><span>Up to, not including</span><span>Price per {product.unit}</span><span /></div>
                                {item.tiers.map((tier) => (
                                  <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2">
                                    <input type="number" min="0" step="0.01" value={tier.minQty ?? ""} onChange={(event) => updateTier(item.productId, tier.id, { minQty: numericValue(event.target.value) })} aria-label={`Tier minimum for ${item.displayName}`} className={inputClass} placeholder="From" />
                                    <input type="number" min="0" step="0.01" value={tier.maxQty ?? ""} onChange={(event) => updateTier(item.productId, tier.id, { maxQty: numericValue(event.target.value) })} aria-label={`Tier maximum for ${item.displayName}`} className={inputClass} placeholder="No limit" />
                                    <input type="number" min="0.01" step="0.01" value={tier.price || ""} onChange={(event) => updateTier(item.productId, tier.id, { price: numericValue(event.target.value) ?? 0 })} aria-label={`Tier price for ${item.displayName}`} className={inputClass} placeholder="R" />
                                    <button type="button" onClick={() => removeTier(item.productId, tier.id)} title="Remove tier" className="flex h-[42px] w-9 items-center justify-center rounded-md border border-stone-700 text-stone-500 hover:text-red-300"><X size={13} /></button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => addTier(item)} className="inline-flex h-9 items-center gap-2 text-xs font-semibold text-burgundy-300 hover:text-white"><Plus size={13} /> Add another tier</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className="border-t border-stone-800 pt-8" aria-labelledby="preview-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">Step 4</div><h2 id="preview-heading" className="mt-1 font-serif text-2xl text-stone-100">Publish and share</h2></div><div className="text-xs text-stone-500">{message.length.toLocaleString("en-ZA")} characters | {form.items.length} offers</div></div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3"><div className="inline-flex rounded-md border border-stone-700 bg-stone-950 p-1"><button type="button" onClick={() => setMessageView("preview")} className={`inline-flex h-8 items-center gap-2 rounded px-3 text-xs font-semibold ${messageView === "preview" ? "bg-stone-800 text-white" : "text-stone-500"}`}><Clipboard size={13} /> Preview</button><button type="button" onClick={() => setMessageView("edit")} className={`inline-flex h-8 items-center gap-2 rounded px-3 text-xs font-semibold ${messageView === "edit" ? "bg-stone-800 text-white" : "text-stone-500"}`}><FileText size={13} /> Edit message</button></div>{form.customMessage != null && <button type="button" onClick={() => updateForm("customMessage", null)} className="inline-flex h-8 items-center gap-2 text-xs text-stone-400 hover:text-white"><RotateCcw size={13} /> Use generated message</button>}</div>
              {messageView === "preview" ? <div className="mt-4 rounded-md border border-stone-800 bg-[#0b141a] p-4 sm:p-5"><div className="ml-auto max-w-[94%] break-words rounded-md rounded-tr-none bg-[#005c4b] px-4 py-3 text-[13px] leading-6 text-white shadow-lg [overflow-wrap:anywhere] sm:max-w-[88%]">{message.split("\n").map((line, index) => <p key={`${line}-${index}`} className={line ? "min-h-6" : "h-3"}>{renderWhatsAppLine(line)}</p>)}</div></div> : <textarea value={message} onChange={(event) => updateForm("customMessage", event.target.value)} rows={20} aria-label="Final WhatsApp message" className={`${inputClass} mt-4 min-h-[420px] resize-y font-mono text-[13px] leading-6`} />}
              {validationError && <div className="mt-3 flex items-center gap-2 text-xs text-amber-300"><AlertCircle size={14} /> {validationError}</div>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button type="button" disabled={saving} onClick={() => void saveCampaign(form.published)} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-stone-700 bg-stone-900 px-4 text-xs font-bold uppercase tracking-[0.12em] text-stone-200 hover:border-stone-500 disabled:opacity-40"><Save size={15} /> {editingId ? "Save changes" : "Save draft"}</button>
                <button type="button" disabled={saving} onClick={() => void saveCampaign(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-emerald-800 bg-emerald-950/45 px-4 text-xs font-bold uppercase tracking-[0.12em] text-emerald-200 hover:bg-emerald-950 disabled:opacity-40"><CheckCircle2 size={15} /> Publish to site</button>
                <button type="button" disabled={saving} onClick={() => void publishAndSend()} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-xs font-bold uppercase tracking-[0.12em] text-stone-950 hover:bg-[#3ee477] disabled:opacity-40"><Send size={16} /> Publish & WhatsApp <ExternalLink size={12} /></button>
                <button type="button" onClick={() => void copyMessage()} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-stone-700 px-4 text-xs font-bold uppercase tracking-[0.12em] text-stone-200 hover:border-stone-500">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy message"}</button>
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-stone-500"><CalendarDays size={14} className="mt-0.5 shrink-0" /> Published offers appear on the site only from {formatCampaignDate(currentCampaign.startDate, false)} through {formatCampaignDate(currentCampaign.endDate, false)} and expire automatically after the end date.</div>
            </section>
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-md border border-stone-800 bg-stone-900 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-red-900/60 bg-red-950/40 text-red-300"><Trash2 size={17} /></div>
            <h2 className="mt-4 font-serif text-2xl text-stone-100">Delete {deleteTarget.title}?</h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">This removes the campaign and its website pricing permanently. It cannot be undone.</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setDeleteTarget(null)} className="h-11 rounded-md border border-stone-700 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300">Cancel</button><button type="button" onClick={() => void deleteCampaign()} disabled={rowBusy === deleteTarget.id} className="h-11 rounded-md bg-red-800 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-50">Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialsManager;
