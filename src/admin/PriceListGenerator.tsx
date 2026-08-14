import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { PUBLIC_SITE_URL } from "../config/site";
import { formatTierRange, getLowestSpecialPrice } from "../shared/specials";
import { formatZAR } from "../shop/CartContext";
import type { Product } from "../shop/products";

type CatalogueResponse = { products: Product[] };
type SessionResponse = { authenticated: true; email: string };

const readJson = async <T,>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
};

const priceText = (product: Product, includeSpecials: boolean) => {
  if (!includeSpecials || !product.specials?.length) {
    return `${product.priceLabel ?? formatZAR(product.price)} / ${product.unit}`;
  }

  const lines: string[] = [];
  product.specials.forEach((special) => {
    if (
      special.pricingMode === "fixed" &&
      special.fixedPrice != null &&
      (product.price === 0 || special.fixedPrice < product.price)
    ) {
      lines.push(`Special: ${formatZAR(special.fixedPrice)} / ${product.unit} (${special.campaignTitle})`);
    } else {
      special.tiers.forEach((tier) => {
        if (product.price === 0 || tier.price < product.price) {
          lines.push(`${formatTierRange(tier, product.unit)}: ${formatZAR(tier.price)} / ${product.unit}`);
        }
      });
    }
  });

  if (!lines.length || getLowestSpecialPrice(product) == null) {
    return `${product.priceLabel ?? formatZAR(product.price)} / ${product.unit}`;
  }
  if (product.price > 0) lines.push(`Regular: ${formatZAR(product.price)} / ${product.unit}`);
  return lines.join("\n");
};

const buildWhatsAppPriceList = (
  title: string,
  products: Product[],
  includeNotes: boolean,
  includeSpecials: boolean,
) => {
  const groups = new Map<string, Product[]>();
  products.forEach((product) => {
    const current = groups.get(product.category) ?? [];
    current.push(product);
    groups.set(product.category, current);
  });

  const lines = [
    `*${title.trim() || "Coleridge Meat Price List"}*`,
    `_Prices updated ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}_`,
  ];

  groups.forEach((items, category) => {
    lines.push("", `*${category.toUpperCase()}*`);
    items.forEach((product) => {
      const priceLines = priceText(product, includeSpecials).split("\n");
      lines.push(`- *${product.name}* - ${priceLines[0]}`);
      priceLines.slice(1).forEach((line) => lines.push(`  ${line}`));
      if (includeNotes && product.note) lines.push(`  _${product.note}_`);
      if (product.stockStatus === "out_of_stock") lines.push("  _Currently out of stock_");
    });
  });

  lines.push(
    "",
    "*Order online*",
    `${PUBLIC_SITE_URL}/#shop-grid`,
    "",
    "Prices and availability can change. Final weights and totals are confirmed by our team.",
    "WhatsApp / Call: *061 127 5756*",
  );
  return lines.join("\n");
};

const imageToDataUrl = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Logo could not be loaded.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

const PriceListGenerator: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Coleridge Meat Price List");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeSpecials, setIncludeSpecials] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [session, catalogue] = await Promise.all([
        fetch("/admin-api/session", { cache: "no-store" }).then((response) => readJson<SessionResponse>(response)),
        fetch("/api/products", { cache: "no-store" }).then((response) => readJson<CatalogueResponse>(response)),
      ]);
      const visible = catalogue.products.filter((product) => product.enabled !== false);
      setEmail(session.email);
      setProducts(visible);
      setSelectedCategories(new Set(visible.map((product) => product.category)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The live price list could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Price List | Coleridge Meat";
    void load();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  );

  const includedProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          selectedCategories.has(product.category) &&
          (!inStockOnly || product.stockStatus !== "out_of_stock"),
      ),
    [products, selectedCategories, inStockOnly],
  );

  const message = useMemo(
    () => buildWhatsAppPriceList(title, includedProducts, includeNotes, includeSpecials),
    [title, includedProducts, includeNotes, includeSpecials],
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const downloadPdf = async () => {
    if (!includedProducts.length) {
      setError("Select at least one category before creating the price list.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const logo = await imageToDataUrl("/logo.jpg").catch(() => null);
      if (logo) doc.addImage(logo, "JPEG", 14, 12, 24, 24);

      doc.setTextColor(26, 22, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text(title.trim() || "Coleridge Meat Price List", logo ? 44 : 14, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(95, 88, 82);
      doc.text("18 Tennant Road, Cloetesville, Stellenbosch | 061 127 5756", logo ? 44 : 14, 27);
      doc.text(`Updated ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`, logo ? 44 : 14, 32);
      doc.setDrawColor(115, 37, 55);
      doc.setLineWidth(0.6);
      doc.line(14, 40, 196, 40);

      let startY = 46;
      categories.filter((category) => selectedCategories.has(category)).forEach((category) => {
        const items = includedProducts.filter((product) => product.category === category);
        if (!items.length) return;
        if (startY > 258) {
          doc.addPage();
          startY = 18;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(115, 37, 55);
        doc.text(category.toUpperCase(), 14, startY);

        autoTable(doc, {
          startY: startY + 3,
          head: [["Product", "Price", "Availability"]],
          body: items.map((product) => [
            includeNotes && product.note ? `${product.name}\n${product.note}` : product.name,
            priceText(product, includeSpecials),
            product.stockStatus === "out_of_stock" ? "Out of stock" : "In stock",
          ]),
          margin: { left: 14, right: 14, bottom: 18 },
          styles: { fontSize: 8.5, cellPadding: 2.6, textColor: [45, 40, 37], lineColor: [225, 221, 218], lineWidth: 0.15 },
          headStyles: { fillColor: [35, 31, 29], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 247, 246] },
          columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 66 }, 2: { cellWidth: 28 } },
          didDrawPage: () => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(120, 115, 110);
            doc.text("Prices and availability can change. Final weights and totals are confirmed by our team.", 14, 289);
            doc.text(`Page ${doc.getNumberOfPages()}`, 196, 289, { align: "right" });
          },
        });
        const tableDoc = doc as typeof doc & { lastAutoTable: { finalY: number } };
        startY = tableDoc.lastAutoTable.finalY + 10;
      });

      doc.save(`coleridge-price-list-${new Date().toISOString().slice(0, 10)}.pdf`);
      setNotice("PDF price list downloaded.");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "The PDF could not be created.");
    } finally {
      setGenerating(false);
    }
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const inputClass = "w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 outline-none focus:border-burgundy-500";

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-burgundy-700/50 bg-burgundy-900/40 text-burgundy-200"><FileDown size={18} /></div><div className="min-w-0"><div className="truncate font-serif text-xl text-stone-100">Price List Studio</div><div className="truncate text-xs text-stone-500">{email || "Coleridge Meat"}</div></div></div>
          <div className="flex items-center gap-2"><a href="/admin/" className="flex h-10 items-center gap-2 rounded-md border border-stone-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-300 hover:bg-stone-900"><ArrowLeft size={15} /><span className="hidden sm:inline">Catalogue</span></a><button type="button" onClick={() => void load()} title="Refresh" className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:bg-stone-900"><RefreshCw size={15} /></button><a href="/cdn-cgi/access/logout" title="Sign out" className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:bg-stone-900"><LogOut size={15} /></a></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 sm:py-9">
        {error && <div className="mb-5 flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/35 px-4 py-3 text-sm text-red-100"><AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}</div>}
        {notice && <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-md border border-emerald-800/60 bg-emerald-950 px-4 py-3 text-sm text-emerald-100 shadow-2xl"><CheckCircle2 size={16} /> {notice}</div>}

        <div className="border-b border-stone-800 pb-6"><div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">Owner tools</div><h1 className="mt-2 font-serif text-3xl text-stone-100 sm:text-4xl">A current price list, ready to send</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">Create a branded PDF for customers or open a clean text version directly in WhatsApp. Both use the live catalogue.</p></div>

        {loading ? <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-stone-500"><Loader2 size={18} className="animate-spin" /> Loading live prices</div> : (
          <div className="mt-8 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
            <section>
              <h2 className="font-serif text-2xl text-stone-100">Price-list settings</h2>
              <label className="mt-5 block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Document title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
              <div className="mt-5 space-y-3 border-y border-stone-800 py-4">
                <label className="flex items-center gap-3 text-sm text-stone-300"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-4 w-4 accent-burgundy-600" /> Only include products currently in stock</label>
                <label className="flex items-center gap-3 text-sm text-stone-300"><input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} className="h-4 w-4 accent-burgundy-600" /> Include product descriptions</label>
                <label className="flex items-center gap-3 text-sm text-stone-300"><input type="checkbox" checked={includeSpecials} onChange={(event) => setIncludeSpecials(event.target.checked)} className="h-4 w-4 accent-burgundy-600" /> Include active website specials</label>
              </div>
              <div className="mt-5"><div className="flex items-center justify-between gap-3"><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Categories</div><button type="button" onClick={() => setSelectedCategories(selectedCategories.size === categories.length ? new Set() : new Set(categories))} className="text-xs text-burgundy-300 hover:text-white">{selectedCategories.size === categories.length ? "Clear all" : "Select all"}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{categories.map((category) => <label key={category} className="flex items-center gap-3 rounded-md border border-stone-800 px-3 py-2.5 text-xs text-stone-300"><input type="checkbox" checked={selectedCategories.has(category)} onChange={() => toggleCategory(category)} className="h-4 w-4 accent-burgundy-600" /><span className="min-w-0 truncate">{category}</span></label>)}</div></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><button type="button" disabled={generating || !includedProducts.length} onClick={() => void downloadPdf()} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-burgundy-700 px-4 text-xs font-bold uppercase tracking-[0.13em] text-white hover:bg-burgundy-600 disabled:opacity-40">{generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF</button><button type="button" disabled={!includedProducts.length} onClick={openWhatsApp} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-xs font-bold uppercase tracking-[0.13em] text-stone-950 hover:bg-[#3ee477] disabled:opacity-40"><MessageCircle size={16} /> Open WhatsApp <ExternalLink size={12} /></button></div>
              <button type="button" disabled={!includedProducts.length} onClick={() => void copyMessage()} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-stone-700 text-xs font-bold uppercase tracking-[0.13em] text-stone-200 hover:border-stone-500 disabled:opacity-40">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy text price list"}</button>
            </section>

            <section className="min-w-0"><div className="flex items-end justify-between gap-4"><div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-burgundy-400">Live preview</div><h2 className="mt-1 font-serif text-2xl text-stone-100">{includedProducts.length} products</h2></div><div className="text-xs text-stone-500">{selectedCategories.size} categories</div></div><div className="mt-4 max-h-[900px] overflow-y-auto rounded-md border border-stone-800">{categories.filter((category) => selectedCategories.has(category)).map((category) => { const items = includedProducts.filter((product) => product.category === category); if (!items.length) return null; return <div key={category}><div className="sticky top-0 z-10 border-y border-stone-800 bg-stone-900 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-burgundy-300 first:border-t-0">{category}</div>{items.map((product) => <div key={product.id} className="grid gap-2 border-b border-stone-800 bg-stone-950 px-4 py-3 last:border-0 sm:grid-cols-[1fr_230px_90px]"><div className="min-w-0"><div className="text-sm font-medium text-stone-100">{product.name}</div>{includeNotes && product.note && <div className="mt-1 text-xs leading-5 text-stone-500">{product.note}</div>}</div><div className="whitespace-pre-line text-sm leading-5 text-stone-300">{priceText(product, includeSpecials)}</div><div className={`text-xs font-semibold ${product.stockStatus === "out_of_stock" ? "text-red-300" : "text-emerald-300"}`}>{product.stockStatus === "out_of_stock" ? "Out of stock" : "In stock"}</div></div>)}</div>; })}</div></section>
          </div>
        )}
      </main>
    </div>
  );
};

export default PriceListGenerator;
