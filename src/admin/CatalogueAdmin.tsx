import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";
import type { Product } from "../shop/products";
import { formatZAR } from "../shop/CartContext";

type CatalogueResponse = { products: Product[] };
type SessionResponse = { authenticated: true; email: string };

const emptyProduct = (category = "Chicken"): Product => ({
  id: "",
  name: "",
  category,
  price: 0,
  unit: "kg",
  note: "",
  stockStatus: "in_stock",
  enabled: true,
  minQty: 0.5,
  qtyStep: 0.1,
});

const readJson = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
};

const CatalogueAdmin: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [draft, setDraft] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setError(loadError instanceof Error ? loadError.message : "The catalogue could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Catalogue Manager | Coleridge Meat";
    void load();
  }, []);

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

  const filteredProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        (categoryFilter === "All" || product.category === categoryFilter) &&
        (!lower ||
          product.name.toLowerCase().includes(lower) ||
          product.category.toLowerCase().includes(lower) ||
          product.note?.toLowerCase().includes(lower)),
    );
  }, [products, query, categoryFilter]);

  const replaceProduct = (product: Product) => {
    setProducts((current) =>
      current
        .map((item) => (item.id === product.id ? product : item))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    );
  };

  const persist = async (product: Product, creating: boolean) => {
    const response = await fetch(
      creating ? "/admin-api/products" : `/admin-api/products/${encodeURIComponent(product.id)}`,
      {
        method: creating ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(product),
      },
    );
    return readJson<{ product: Product }>(response);
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const result = await persist(draft, isNew);
      if (isNew) {
        setProducts((current) => [...current, result.product]);
      } else {
        replaceProduct(result.product);
      }
      setDraft(null);
      setIsNew(false);
      setNotice(isNew ? "Product added to the catalogue." : "Product changes saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (product: Product, changes: Partial<Product>, message: string) => {
    setRowBusy(product.id);
    setError("");
    try {
      const result = await persist({ ...product, ...changes }, false);
      replaceProduct(result.product);
      if (draft?.id === product.id) setDraft(result.product);
      setNotice(message);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The change could not be saved.");
    } finally {
      setRowBusy(null);
    }
  };

  const updateDraft = <K extends keyof Product>(key: K, value: Product[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const inputClass =
    "w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-burgundy-500";
  const labelClass = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400";

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-burgundy-700/50 bg-burgundy-900/40 text-burgundy-200">
              <Package size={19} />
            </div>
            <div>
              <div className="font-serif text-xl text-stone-100">Catalogue Manager</div>
              <div className="text-xs text-stone-500">Coleridge Meat</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              title="Refresh catalogue"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <a
              href="/cdn-cgi/access/logout"
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
            >
              <LogOut size={16} />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 border-b border-stone-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">
              Owner access
            </div>
            <h1 className="mt-2 font-serif text-3xl text-stone-100 sm:text-4xl">Products and availability</h1>
            <p className="mt-2 text-sm text-stone-500">
              {email ? `Signed in as ${email}` : "Checking your secure session"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(emptyProduct(categories[0]));
              setIsNew(true);
              setError("");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-burgundy-700 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-burgundy-600"
          >
            <Plus size={16} /> Add product
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/35 px-4 py-3 text-sm text-red-100">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-md border border-emerald-800/60 bg-emerald-950 px-4 py-3 text-sm text-emerald-100 shadow-2xl">
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border-b border-stone-800 pb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Products</div>
            <div className="mt-2 font-serif text-3xl text-stone-100">{products.length}</div>
          </div>
          <div className="border-b border-stone-800 pb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">In stock</div>
            <div className="mt-2 font-serif text-3xl text-emerald-300">
              {products.filter((product) => product.stockStatus !== "out_of_stock" && product.enabled !== false).length}
            </div>
          </div>
          <div className="border-b border-stone-800 pb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Hidden</div>
            <div className="mt-2 font-serif text-3xl text-stone-400">
              {products.filter((product) => product.enabled === false).length}
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              className={`${inputClass} pl-10`}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={`${inputClass} sm:w-64`}
          >
            <option>All</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-stone-500">
            <Loader2 size={18} className="animate-spin" /> Loading catalogue
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-md border border-stone-800">
            <div className="hidden grid-cols-[minmax(220px,1.3fr)_minmax(170px,0.8fr)_120px_160px_120px] gap-4 border-b border-stone-800 bg-stone-900/70 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 lg:grid">
              <span>Product</span><span>Category</span><span>Price</span><span>Availability</span><span>Actions</span>
            </div>
            {filteredProducts.map((product) => {
              const busy = rowBusy === product.id;
              const inStock = product.stockStatus !== "out_of_stock";
              return (
                <div
                  key={product.id}
                  className={`grid gap-4 border-b border-stone-800 px-4 py-4 last:border-0 lg:grid-cols-[minmax(220px,1.3fr)_minmax(170px,0.8fr)_120px_160px_120px] lg:items-center ${product.enabled === false ? "bg-stone-950 opacity-60" : "bg-stone-900/25"}`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-stone-100">{product.name}</div>
                    <div className="mt-1 truncate text-xs text-stone-500">{product.note || "No product note"}</div>
                  </div>
                  <div className="text-sm text-stone-400">{product.category}</div>
                  <div>
                    <div className="font-serif text-lg text-stone-100">{product.priceLabel || formatZAR(product.price)}</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-stone-600">per {product.unit === "kg" ? "kg" : "item"}</div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void quickUpdate(product, { stockStatus: inStock ? "out_of_stock" : "in_stock" }, inStock ? "Marked out of stock." : "Marked in stock.")}
                    className={`inline-flex h-9 w-fit items-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${inStock ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200" : "border-red-900/60 bg-red-950/35 text-red-200"}`}
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : inStock ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {inStock ? "In stock" : "Out of stock"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setDraft({ ...product }); setIsNew(false); setError(""); }}
                      title="Edit product"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void quickUpdate(product, { enabled: product.enabled === false }, product.enabled === false ? "Product is visible." : "Product hidden from the website.")}
                      title={product.enabled === false ? "Show on website" : "Hide from website"}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-100"
                    >
                      {product.enabled === false ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="px-6 py-16 text-center text-sm text-stone-500">No products match this search.</div>
            )}
          </div>
        )}
      </main>

      {draft && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/70 backdrop-blur-sm" onClick={() => !saving && setDraft(null)}>
          <form
            onSubmit={saveDraft}
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-xl overflow-y-auto border-l border-stone-800 bg-stone-900 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-800 bg-stone-900/95 px-5 py-5 backdrop-blur-md sm:px-7">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-burgundy-400">{isNew ? "New product" : "Edit product"}</div>
                <h2 className="mt-2 font-serif text-2xl text-stone-100">{isNew ? "Add to catalogue" : draft.name}</h2>
              </div>
              <button type="button" onClick={() => setDraft(null)} title="Close editor" className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:text-stone-100">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-6 sm:px-7">
              <div>
                <label className={labelClass}>Product name</label>
                <input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input required list="catalogue-categories" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} className={inputClass} />
                <datalist id="catalogue-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Price (R)</label>
                  <input required type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft("price", Number(event.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Sold per</label>
                  <select value={draft.unit} onChange={(event) => updateDraft("unit", event.target.value as Product["unit"])} className={inputClass}>
                    <option value="kg">Kilogram</option><option value="each">Item</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Price label (optional)</label>
                <input value={draft.priceLabel ?? ""} onChange={(event) => updateDraft("priceLabel", event.target.value || undefined)} placeholder="For example: Ask for price" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Product note</label>
                <textarea rows={4} value={draft.note ?? ""} onChange={(event) => updateDraft("note", event.target.value)} className={`${inputClass} resize-none`} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className={labelClass}>Minimum</label><input type="number" min="0" step="0.1" value={draft.minQty ?? ""} onChange={(event) => updateDraft("minQty", event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass} /></div>
                <div><label className={labelClass}>Quantity step</label><input type="number" min="0.01" step="0.1" value={draft.qtyStep ?? ""} onChange={(event) => updateDraft("qtyStep", event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass} /></div>
                <div><label className={labelClass}>Display order</label><input type="number" min="0" step="1" value={draft.sortOrder ?? ""} onChange={(event) => updateDraft("sortOrder", event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-md border border-stone-700 bg-stone-950 px-4 py-3">
                  <span className="text-sm text-stone-300">In stock</span>
                  <input type="checkbox" checked={draft.stockStatus !== "out_of_stock"} onChange={(event) => updateDraft("stockStatus", event.target.checked ? "in_stock" : "out_of_stock")} className="h-4 w-4 accent-[#3c74b1]" />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-md border border-stone-700 bg-stone-950 px-4 py-3">
                  <span className="text-sm text-stone-300">Show on website</span>
                  <input type="checkbox" checked={draft.enabled !== false} onChange={(event) => updateDraft("enabled", event.target.checked)} className="h-4 w-4 accent-[#3c74b1]" />
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-stone-800 bg-stone-900/95 px-5 py-5 backdrop-blur-md sm:px-7">
              <button type="button" onClick={() => setDraft(null)} className="h-11 flex-1 rounded-md border border-stone-700 text-xs font-semibold uppercase tracking-[0.16em] text-stone-300 hover:bg-stone-800">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-burgundy-700 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-burgundy-600 disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CatalogueAdmin;
