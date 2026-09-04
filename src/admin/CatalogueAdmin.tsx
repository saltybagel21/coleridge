import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileDown,
  GripVertical,
  Loader2,
  LogOut,
  Megaphone,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Tags,
  X,
  XCircle,
} from "lucide-react";
import type { Product } from "../shop/products";
import { formatZAR } from "../shop/CartContext";
import { adminFetch, adminHref, signOutAdmin } from "./auth";

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

const parseQuantityOptions = (value: string) => {
  const entries = value
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length > 20) return { error: "Add no more than 20 specific order quantities." };

  const quantities = entries.map(Number);
  if (quantities.some((quantity) => !Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000)) {
    return { error: "Enter positive quantities separated by commas." };
  }

  return {
    quantities: Array.from(new Set(quantities.map((quantity) => Number(quantity.toFixed(3))))).sort(
      (a, b) => a - b,
    ),
  };
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
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [quantityOptionsText, setQuantityOptionsText] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [session, catalogue] = await Promise.all([
        adminFetch("/session", { cache: "no-store" }).then((response) =>
          readJson<SessionResponse>(response),
        ),
        adminFetch("/products", { cache: "no-store" }).then((response) =>
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

  const parsedQuantityOptions = useMemo(
    () => parseQuantityOptions(quantityOptionsText),
    [quantityOptionsText],
  );

  const orderedProducts = useMemo(
    () =>
      [...products].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
      ),
    [products],
  );

  const categories = useMemo(
    () => Array.from(new Set<string>(orderedProducts.map((product) => product.category))),
    [orderedProducts],
  );

  const filteredProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return orderedProducts.filter(
      (product) =>
        (categoryFilter === "All" || product.category === categoryFilter) &&
        (!lower ||
          product.name.toLowerCase().includes(lower) ||
          product.category.toLowerCase().includes(lower) ||
          product.note?.toLowerCase().includes(lower)),
    );
  }, [orderedProducts, query, categoryFilter]);

  const replaceProduct = (product: Product) => {
    setProducts((current) =>
      current
        .map((item) => (item.id === product.id ? product : item))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    );
  };

  const persist = async (product: Product, creating: boolean) => {
    const response = await adminFetch(
      creating ? "/products" : `/products/${encodeURIComponent(product.id)}`,
      {
        method: creating ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(product),
      },
    );
    return readJson<{ product: Product }>(response);
  };

  const openProductEditor = (product: Product, creating: boolean) => {
    setDraft({ ...product });
    setQuantityOptionsText(product.quantityOptions?.join(", ") ?? "");
    setIsNew(creating);
    setError("");
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (parsedQuantityOptions.error) {
      setError(parsedQuantityOptions.error);
      return;
    }
    const productToSave: Product = {
      ...draft,
      quantityOptions: parsedQuantityOptions.quantities?.length ? parsedQuantityOptions.quantities : undefined,
    };
    setSaving(true);
    setError("");
    try {
      const result = await persist(productToSave, isNew);
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

  const startPriceEdit = (product: Product) => {
    setEditingPriceId(product.id);
    setPriceValue(product.price > 0 ? product.price.toFixed(2) : "");
    setError("");
  };

  const cancelPriceEdit = () => {
    setEditingPriceId(null);
    setPriceValue("");
  };

  const saveInlinePrice = async (product: Product) => {
    const parsedPrice = Number(priceValue);
    if (priceValue.trim() === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 1_000_000) {
      setError("Enter a valid price between R0 and R1,000,000.");
      return;
    }

    const price = Math.round((parsedPrice + Number.EPSILON) * 100) / 100;
    const updatedProduct = {
      ...product,
      price,
      ...(price > 0 && product.priceLabel ? { priceLabel: undefined } : {}),
    };

    setRowBusy(product.id);
    setError("");
    try {
      const result = await persist(updatedProduct, false);
      replaceProduct(result.product);
      if (draft?.id === product.id) setDraft(result.product);
      cancelPriceEdit();
      setNotice(`${product.name} price updated to ${formatZAR(result.product.price)}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The price could not be saved.");
    } finally {
      setRowBusy(null);
    }
  };

  const updateDraft = <K extends keyof Product>(key: K, value: Product[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveReorder = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId || reordering) return;
    const sourceIndex = filteredProducts.findIndex((product) => product.id === sourceId);
    const targetIndex = filteredProducts.findIndex((product) => product.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reorderedVisible = [...filteredProducts];
    const [moved] = reorderedVisible.splice(sourceIndex, 1);
    reorderedVisible.splice(targetIndex, 0, moved);
    const visibleIds = new Set(reorderedVisible.map((product) => product.id));
    let visibleIndex = 0;
    const reorderedAll = orderedProducts.map((product) =>
      visibleIds.has(product.id) ? reorderedVisible[visibleIndex++] : product,
    );
    const optimistic = reorderedAll.map((product, index) => ({ ...product, sortOrder: index + 1 }));
    const previous = products;

    setProducts(optimistic);
    setReordering(true);
    setError("");
    try {
      const response = await adminFetch("/products/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productIds: reorderedAll.map((product) => product.id) }),
      });
      const result = await readJson<CatalogueResponse>(response);
      setProducts(result.products);
      setNotice(`${moved.name} moved to its new position.`);
    } catch (reorderError) {
      setProducts(previous);
      setError(reorderError instanceof Error ? reorderError.message : "The product order could not be saved.");
    } finally {
      setDraggedId(null);
      setDragOverId(null);
      setReordering(false);
    }
  };

  const openCategoryEditor = () => {
    const initial = categoryFilter !== "All" && categories.includes(categoryFilter)
      ? categoryFilter
      : categories[0] ?? "";
    setCategoryToRename(initial);
    setCategoryName(initial);
    setCategoryEditorOpen(true);
    setError("");
  };

  const saveCategoryName = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextName = categoryName.trim().replace(/\s+/g, " ");
    if (!categoryToRename || !nextName) {
      setError("Enter a category name.");
      return;
    }

    setRenamingCategory(true);
    setError("");
    try {
      const response = await adminFetch("/categories/rename", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentName: categoryToRename, nextName }),
      });
      const result = await readJson<CatalogueResponse & { renamed: number }>(response);
      setProducts(result.products);
      if (categoryFilter === categoryToRename) setCategoryFilter(nextName);
      if (draft?.category === categoryToRename) setDraft({ ...draft, category: nextName });
      setCategoryEditorOpen(false);
      setNotice(
        result.renamed > 0
          ? `${categoryToRename} renamed to ${nextName} on ${result.renamed} products.`
          : "Category name is unchanged.",
      );
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "The category could not be renamed.");
    } finally {
      setRenamingCategory(false);
    }
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
            <a
              href={adminHref("price-list")}
              title="Create a customer price list"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-300 transition-colors hover:bg-stone-900 hover:text-stone-100"
            >
              <FileDown size={16} /> <span className="hidden lg:inline">Price list</span>
            </a>
            <a
              href={adminHref("specials")}
              title="WhatsApp specials builder"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-300 transition-colors hover:bg-stone-900 hover:text-stone-100"
            >
              <Megaphone size={16} /> <span className="hidden sm:inline">Specials</span>
            </a>
            <button
              type="button"
              onClick={() => void load()}
              title="Refresh catalogue"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => void signOutAdmin()}
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
            >
              <LogOut size={16} />
            </button>
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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCategoryEditor}
              disabled={!categories.length}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-stone-700 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300 transition-colors hover:bg-stone-900 hover:text-stone-100 disabled:opacity-40"
            >
              <Tags size={16} /> Categories
            </button>
            <button
              type="button"
              onClick={() => openProductEditor(emptyProduct(categories[0]), true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-burgundy-700 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-burgundy-600"
            >
              <Plus size={16} /> Add product
            </button>
          </div>
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
            <div className="hidden grid-cols-[40px_minmax(220px,1.3fr)_minmax(170px,0.8fr)_190px_160px_120px] gap-4 border-b border-stone-800 bg-stone-900/70 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 lg:grid">
              <span aria-hidden="true" /><span>Product</span><span>Category</span><span>Price</span><span>Availability</span><span>Actions</span>
            </div>
            {filteredProducts.map((product) => {
              const busy = rowBusy === product.id;
              const inStock = product.stockStatus !== "out_of_stock";
              return (
                <div
                  key={product.id}
                  onDragOver={(event) => {
                    if (!draggedId || draggedId === product.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverId(product.id);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDragOverId((current) => (current === product.id ? null : current));
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedId) void saveReorder(draggedId, product.id);
                  }}
                  className={`grid gap-4 border-b px-4 py-4 transition-colors last:border-0 lg:grid-cols-[40px_minmax(220px,1.3fr)_minmax(170px,0.8fr)_190px_160px_120px] lg:items-center ${
                    dragOverId === product.id
                      ? "border-burgundy-500 bg-burgundy-950/30"
                      : "border-stone-800"
                  } ${draggedId === product.id ? "opacity-45" : product.enabled === false ? "bg-stone-950 opacity-60" : "bg-stone-900/25"}`}
                >
                  <button
                    type="button"
                    draggable={!reordering}
                    disabled={reordering}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", product.id);
                      setDraggedId(product.id);
                      setDragOverId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    title={`Drag ${product.name} to reorder`}
                    aria-label={`Drag ${product.name} to reorder`}
                    className="flex h-10 w-10 cursor-grab items-center justify-center rounded-md border border-stone-700 text-stone-500 transition-colors hover:border-stone-500 hover:bg-stone-800 hover:text-stone-200 active:cursor-grabbing disabled:cursor-wait disabled:opacity-40"
                  >
                    {reordering && draggedId === product.id ? <Loader2 size={17} className="animate-spin" /> : <GripVertical size={18} />}
                  </button>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-stone-100">{product.name}</div>
                    <div className="mt-1 truncate text-xs text-stone-500">{product.note || "No product note"}</div>
                  </div>
                  <div className="text-sm text-stone-400">{product.category}</div>
                  <div>
                    {editingPriceId === product.id ? (
                      <form
                        className="flex h-9 items-center gap-1.5"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void saveInlinePrice(product);
                        }}
                      >
                        <label className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-burgundy-600 bg-stone-950 px-2 focus-within:ring-1 focus-within:ring-burgundy-500">
                          <span className="mr-1 text-sm text-stone-500">R</span>
                          <input
                            autoFocus
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="1000000"
                            step="0.01"
                            value={priceValue}
                            onChange={(event) => setPriceValue(event.target.value)}
                            onFocus={(event) => event.currentTarget.select()}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") cancelPriceEdit();
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void saveInlinePrice(product);
                              }
                            }}
                            aria-label={`Price for ${product.name}`}
                            className="min-w-0 flex-1 bg-transparent text-sm text-stone-100 outline-none"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={busy}
                          title="Save price"
                          aria-label={`Save price for ${product.name}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-800/70 text-emerald-300 transition-colors hover:bg-emerald-950/50 disabled:cursor-wait disabled:opacity-60"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={cancelPriceEdit}
                          title="Cancel price edit"
                          aria-label={`Cancel price edit for ${product.name}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-700 text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-100 disabled:opacity-60"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startPriceEdit(product)}
                        title={`Edit ${product.name} price`}
                        className="group inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border border-transparent px-1 text-left transition-colors hover:border-stone-700 hover:bg-stone-900 focus-visible:border-burgundy-600 focus-visible:outline-none"
                      >
                        <span className="truncate font-serif text-lg text-stone-100">{product.priceLabel || formatZAR(product.price)}</span>
                        <Pencil size={13} className="shrink-0 text-stone-600 transition-colors group-hover:text-stone-300" />
                      </button>
                    )}
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
                      onClick={() => openProductEditor(product, false)}
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

      {categoryEditorOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={() => !renamingCategory && setCategoryEditorOpen(false)}
        >
          <form
            onSubmit={saveCategoryName}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-md border border-stone-700 bg-stone-900 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-stone-800 px-5 py-5 sm:px-6">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-burgundy-400">Catalogue sections</div>
                <h2 className="mt-2 font-serif text-2xl text-stone-100">Rename a category</h2>
              </div>
              <button
                type="button"
                onClick={() => setCategoryEditorOpen(false)}
                disabled={renamingCategory}
                title="Close category editor"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:text-stone-100 disabled:opacity-40"
              >
                <X size={17} />
              </button>
            </div>
            <div className="space-y-5 px-5 py-6 sm:px-6">
              <div>
                <label className={labelClass}>Current category</label>
                <select
                  value={categoryToRename}
                  onChange={(event) => {
                    setCategoryToRename(event.target.value);
                    setCategoryName(event.target.value);
                  }}
                  className={inputClass}
                >
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>New category name</label>
                <input
                  required
                  maxLength={80}
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-between border-y border-stone-800 py-3 text-sm">
                <span className="text-stone-500">Products in category</span>
                <span className="font-semibold text-stone-200">
                  {products.filter((product) => product.category === categoryToRename).length}
                </span>
              </div>
              {categoryName.trim() !== categoryToRename && categories.includes(categoryName.trim()) && (
                <div className="rounded-md border border-amber-800/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
                  These products will join the existing {categoryName.trim()} category.
                </div>
              )}
            </div>
            <div className="flex gap-3 border-t border-stone-800 px-5 py-5 sm:px-6">
              <button
                type="button"
                onClick={() => setCategoryEditorOpen(false)}
                disabled={renamingCategory}
                className="h-11 flex-1 rounded-md border border-stone-700 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300 hover:bg-stone-800 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renamingCategory || !categoryName.trim()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-burgundy-700 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-burgundy-600 disabled:opacity-40"
              >
                {renamingCategory ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

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
                <div><label className={labelClass}>Minimum</label><input type="number" min="0" step="0.01" value={draft.minQty ?? ""} onChange={(event) => updateDraft("minQty", event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass} /></div>
                <div><label className={labelClass}>Quantity step</label><input type="number" min="0.01" step="0.01" value={draft.qtyStep ?? ""} onChange={(event) => updateDraft("qtyStep", event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass} /></div>
                <div><label className={labelClass}>Display order</label><input type="number" min="0" step="1" value={draft.sortOrder ?? ""} onChange={(event) => updateDraft("sortOrder", event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass} /></div>
              </div>
              <div>
                <label htmlFor="specific-order-quantities" className={labelClass}>Pack sizes customers can combine (optional)</label>
                <input
                  id="specific-order-quantities"
                  value={quantityOptionsText}
                  onChange={(event) => setQuantityOptionsText(event.target.value)}
                  placeholder="10, 20, 50"
                  inputMode="decimal"
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-stone-500">Enter sizes such as 0.5, 1, 2, 5. A customer can combine packs, for example 5 kg + 2 kg.</p>
                {parsedQuantityOptions.quantities?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {parsedQuantityOptions.quantities.map((quantity) => (
                      <span key={quantity} className="rounded-full border border-stone-700 bg-stone-950 px-2.5 py-1 text-[10px] font-semibold text-stone-300">
                        {quantity} {draft.unit === "kg" ? "kg" : quantity === 1 ? "item" : "items"}
                      </span>
                    ))}
                  </div>
                ) : null}
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
