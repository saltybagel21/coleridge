// ============================================================================
// COLERIDGE MEAT — SPECIALS BUILDER
// Internal staff tool for Stefan. Not linked from public nav.
// Access: /#cm-specials-portal
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { RETAIL_PRODUCTS, WHOLESALE_PRODUCTS } from '../shop/products';
import type { Product } from '../shop/products';
import {
  Search,
  X,
  Check,
  Copy,
  MessageCircle,
  RefreshCw,
  Tag,
  Calendar,
  FileText,
  ShoppingCart,
  Package,
  LogOut,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────

// Change this passcode to whatever Stefan prefers.
const PASSCODE = 'coleridge2024';
const SESSION_KEY = 'cm_admin_auth_v1';
const WHATSAPP_NUMBER = '27611275756'; // Stefan's WhatsApp (E.164 without +)
const DRAFT_KEY = 'cm_specials_builder_draft_v1';
const ALL_PRODUCTS = [...RETAIL_PRODUCTS, ...WHOLESALE_PRODUCTS];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedProduct {
  product: Product;
  specialPrice: string;
}

interface SpecialDetails {
  name: string;
  startDate: string;
  endDate: string;
  note: string;
}

interface DraftPayload {
  orderType: 'retail' | 'wholesale';
  searchQuery: string;
  details: SpecialDetails;
  selectedProducts: Array<{
    productId: string;
    specialPrice: string;
  }>;
}

function loadDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.orderType !== 'retail' && parsed.orderType !== 'wholesale') return null;
    if (!Array.isArray(parsed.selectedProducts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(payload: DraftPayload) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

// ─── WhatsApp formatter ───────────────────────────────────────────────────────

function formatDate(d: string): string {
  if (!d) return '';
  // Parse as local date to avoid UTC offset issues
  const [year, month, day] = d.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoney(value: number) {
  return `R${value.toFixed(2)}`;
}

function formatMessagePrice(product: Product, specialPrice: string) {
  const numericPrice = parseFloat(specialPrice);
  const hasNumericPrice = !isNaN(numericPrice) && numericPrice > 0;

  if (hasNumericPrice) {
    return `${formatMoney(numericPrice)}/${product.unit}`;
  }

  return product.priceLabel || 'POA';
}

// Legacy formatter kept temporarily while the new previewed version settles.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildWhatsAppMessage(
  details: SpecialDetails,
  orderType: 'retail' | 'wholesale',
  items: SelectedProduct[]
): string {
  const typeLabel = orderType === 'retail' ? 'Retail Special' : 'Wholesale Special';
  const lines: string[] = [];

  lines.push(`🥩 *${details.name || 'Weekly Specials'}*`);
  lines.push(`_${typeLabel} — Coleridge Meat_`);
  lines.push('');

  if (details.startDate && details.endDate) {
    lines.push(`📅 ${formatDate(details.startDate)} – ${formatDate(details.endDate)}`);
    lines.push('');
  } else if (details.startDate) {
    lines.push(`📅 From ${formatDate(details.startDate)}`);
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━');

  items.forEach(({ product, specialPrice }) => {
    const price = parseFloat(specialPrice);
    const validPrice = !isNaN(price) && price > 0;
    const priceStr = validPrice
      ? `R${price.toFixed(2)}/${product.unit}`
      : product.priceLabel || 'POA';

    const wasStr =
      product.price > 0 && validPrice && price < product.price
        ? ` _(was R${product.price.toFixed(2)})_`
        : '';

    lines.push(`• *${product.name}* — ${priceStr}${wasStr}`);
  });

  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  if (details.note.trim()) {
    lines.push(`ℹ️ ${details.note.trim()}`);
    lines.push('');
  }

  lines.push('To order, reply to this message or give us a call. 📞');
  lines.push('');
  lines.push('_Coleridge Meat · Stellenbosch_');
  lines.push('_061 127 5756_');

  return lines.join('\n');
}

// ─── Passcode Gate ────────────────────────────────────────────────────────────

function renderWhatsAppInline(text: string) {
  const segments = text.split(/(\*[^*]+\*|_[^_]+_)/g);

  return segments.map((segment, index) => {
    if (!segment) return null;

    if (segment.startsWith('*') && segment.endsWith('*')) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold">
          {segment.slice(1, -1)}
        </strong>
      );
    }

    if (segment.startsWith('_') && segment.endsWith('_')) {
      return (
        <em key={`${segment}-${index}`} className="italic">
          {segment.slice(1, -1)}
        </em>
      );
    }

    return <React.Fragment key={`${segment}-${index}`}>{segment}</React.Fragment>;
  });
}

function buildPolishedWhatsAppMessage(
  details: SpecialDetails,
  orderType: 'retail' | 'wholesale',
  items: SelectedProduct[]
): string {
  const typeLabel = orderType === 'retail' ? 'Retail Specials' : 'Wholesale Specials';
  const title = details.name.trim() || 'Weekly Specials';
  const groupedItems = new Map<string, SelectedProduct[]>();
  const lines: string[] = [];

  items.forEach(item => {
    const currentItems = groupedItems.get(item.product.category) ?? [];
    currentItems.push(item);
    groupedItems.set(item.product.category, currentItems);
  });

  lines.push(`*${title}*`);
  lines.push(`_${typeLabel} | Coleridge Meat_`);

  if (details.startDate && details.endDate) {
    lines.push(`Valid: ${formatDate(details.startDate)} - ${formatDate(details.endDate)}`);
  } else if (details.startDate) {
    lines.push(`Valid from: ${formatDate(details.startDate)}`);
  }

  if (items.length) {
    lines.push('');
    lines.push('*Fresh from the counter:*');
    lines.push('');
  }

  Array.from(groupedItems.entries()).forEach(([category, categoryItems], categoryIndex) => {
    lines.push(`*${category.toUpperCase()}*`);

    categoryItems.forEach(({ product, specialPrice }) => {
      const numericPrice = parseFloat(specialPrice);
      const hasNumericPrice = !isNaN(numericPrice) && numericPrice > 0;

      lines.push(`- *${product.name}* - ${formatMessagePrice(product, specialPrice)}`);

      if (product.price > 0 && hasNumericPrice && numericPrice < product.price) {
        const previousPrice = `${formatMoney(product.price)}/${product.unit}`;
        const saving = `${formatMoney(product.price - numericPrice)}/${product.unit}`;
        lines.push(`  Was ${previousPrice} | Save ${saving}`);
      }
    });

    if (categoryIndex < groupedItems.size - 1) {
      lines.push('');
    }
  });

  if (details.note.trim()) {
    lines.push('');
    lines.push(`*Order note:* ${details.note.trim()}`);
  }

  lines.push('');
  lines.push('*How ordering works*');
  lines.push('Reply to this message to confirm your order.');
  lines.push('Payment is arranged when we confirm the order with you.');
  lines.push('');
  lines.push('*Coleridge Meat*');
  lines.push('Stellenbosch');
  lines.push('WhatsApp / Call: *061 127 5756*');

  return lines.join('\n');
}

function PasscodeGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div
        className={`bg-stone-900 border border-stone-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl transition-transform ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        <div className="text-center mb-8">
          <img
            src="/logo.jpg"
            alt="Coleridge Meat"
            className="w-16 h-16 rounded-full mx-auto mb-4 object-cover ring-2 ring-stone-700"
          />
          <h1 className="text-2xl font-serif text-stone-100 mb-1">Staff Portal</h1>
          <p className="text-stone-500 text-sm">Coleridge Meat · Internal Access</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="password"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                setError(false);
              }}
              placeholder="Enter passcode"
              autoFocus
              autoComplete="current-password"
              className={`w-full bg-stone-800 border rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 transition-colors text-sm ${
                error
                  ? 'border-blue-500/60 focus:ring-blue-500/20'
                  : 'border-stone-700 focus:ring-burgundy-600/30'
              }`}
            />
            {error && (
              <p className="text-blue-400 text-xs mt-2 text-center">
                Incorrect passcode. Please try again.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-burgundy-700 hover:bg-burgundy-600 active:bg-burgundy-800 text-stone-100 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Enter
          </button>
        </form>
      </div>

      {/* Shake keyframes injected inline for portability */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Tool ────────────────────────────────────────────────────────────────

export default function SpecialsBuilder() {
  const draft = useMemo(() => loadDraft(), []);

  // Auth
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );

  // Noindex: inject meta tag when this component mounts
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // Tool state
  const [orderType, setOrderType] = useState<'retail' | 'wholesale'>(draft?.orderType ?? 'retail');
  const [searchQuery, setSearchQuery] = useState(draft?.searchQuery ?? '');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(() => {
    if (!draft) return [];

    return draft.selectedProducts
      .map(({ productId, specialPrice }) => {
        const product = ALL_PRODUCTS.find(item => item.id === productId);
        return product ? { product, specialPrice } : null;
      })
      .filter((item): item is SelectedProduct => item !== null);
  });
  const [details, setDetails] = useState<SpecialDetails>(
    draft?.details ?? {
      name: '',
      startDate: '',
      endDate: '',
      note: '',
    }
  );
  const [copied, setCopied] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState('');

  // Derived
  const allProducts = orderType === 'retail' ? RETAIL_PRODUCTS : WHOLESALE_PRODUCTS;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allProducts, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(p => {
      (groups[p.category] ??= []).push(p);
    });
    return groups;
  }, [filteredProducts]);

  const hasSelectedProducts = selectedProducts.length > 0;
  const hasDateRangeError =
    Boolean(details.startDate) &&
    Boolean(details.endDate) &&
    details.endDate < details.startDate;
  const actionDisabled = !hasSelectedProducts || hasDateRangeError;

  useEffect(() => {
    saveDraft({
      orderType,
      searchQuery,
      details,
      selectedProducts: selectedProducts.map(item => ({
        productId: item.product.id,
        specialPrice: item.specialPrice,
      })),
    });
  }, [orderType, searchQuery, details, selectedProducts]);

  const isSelected = (id: string) =>
    selectedProducts.some(s => s.product.id === id);

  const toggleProduct = (product: Product) => {
    if (isSelected(product.id)) {
      setSelectedProducts(prev => prev.filter(s => s.product.id !== product.id));
    } else {
      setSelectedProducts(prev => [
        ...prev,
        {
          product,
          specialPrice: product.price > 0 ? product.price.toFixed(2) : '',
        },
      ]);
    }
  };

  const updatePrice = (id: string, val: string) =>
    setSelectedProducts(prev =>
      prev.map(s => (s.product.id === id ? { ...s, specialPrice: val } : s))
    );

  const removeProduct = (id: string) =>
    setSelectedProducts(prev => prev.filter(s => s.product.id !== id));

  const handleTypeSwitch = (type: 'retail' | 'wholesale') => {
    setOrderType(type);
    setSelectedProducts([]);
    setSearchQuery('');
  };

  const resetAll = () => {
    setSelectedProducts([]);
    setDetails({ name: '', startDate: '', endDate: '', note: '' });
    setSearchQuery('');
    setBulkDiscount('');
    clearDraft();
  };

  const applyBulkDiscount = (percentage: number) => {
    if (!selectedProducts.length) return;

    setSelectedProducts(prev =>
      prev.map(item => {
        if (item.product.price <= 0) return item;
        const nextPrice = item.product.price * (1 - percentage / 100);
        return { ...item, specialPrice: nextPrice.toFixed(2) };
      })
    );
  };

  const applyCustomDiscount = () => {
    const value = parseFloat(bulkDiscount);
    if (!Number.isFinite(value) || value <= 0) return;
    applyBulkDiscount(value);
  };

  const restoreStandardPrices = () => {
    setSelectedProducts(prev =>
      prev.map(item => ({
        ...item,
        specialPrice: item.product.price > 0 ? item.product.price.toFixed(2) : '',
      }))
    );
  };

  const whatsappMessage = useMemo(
    () => buildPolishedWhatsAppMessage(details, orderType, selectedProducts),
    [details, orderType, selectedProducts]
  );

  const openWhatsApp = () => {
    if (actionDisabled) return;
    const encoded = encodeURIComponent(whatsappMessage);
    // Opens WhatsApp without a preset number so Stefan can choose the broadcast list
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = async () => {
    if (actionDisabled) return;
    try {
      await navigator.clipboard.writeText(whatsappMessage);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = whatsappMessage;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  };

  // ── Render: gate ────────────────────────────────────────────────────────────
  if (!authenticated) {
    return <PasscodeGate onAuth={() => setAuthenticated(true)} />;
  }

  // ── Render: tool ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans antialiased">

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Coleridge Meat"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-700 flex-shrink-0"
            />
            <div className="leading-tight">
              <p className="text-stone-100 text-sm font-semibold">Specials Builder</p>
              <p className="text-stone-500 text-xs">Staff tool · not public</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-burgundy-400 bg-burgundy-900/40 border border-burgundy-800/60 px-2.5 py-1 rounded-full">
                <Check size={11} />
                {selectedProducts.length} selected
              </span>
            )}
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition-colors"
              title="Reset all"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={() => {
                clearDraft();
                setSelectedProducts([]);
                setDetails({ name: '', startDate: '', endDate: '', note: '' });
                setSearchQuery('');
                setBulkDiscount('');
              }}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 px-2 py-1.5 rounded-lg transition-colors"
              title="Clear saved draft"
            >
              <X size={12} />
              <span className="hidden sm:inline">Clear Draft</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 px-2 py-1.5 rounded-lg transition-colors"
              title="Lock portal"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Left: browser + details ──────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Type selector */}
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Specials Type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['retail', 'wholesale'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeSwitch(type)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      orderType === type
                        ? 'bg-burgundy-700 text-stone-100 shadow-lg shadow-burgundy-900/40'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-750 hover:text-stone-200'
                    }`}
                  >
                    {type === 'retail' ? (
                      <><ShoppingCart size={15} /> Retail Specials</>
                    ) : (
                      <><Package size={15} /> Wholesale Specials</>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Product browser */}
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Select Products
                </p>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>{filteredProducts.length} shown</span>
                  {selectedProducts.length > 0 && (
                    <>
                      <span>·</span>
                      <button
                        onClick={() => setSelectedProducts([])}
                        className="text-stone-500 hover:text-blue-400 transition-colors underline underline-offset-2"
                      >
                        clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search bar */}
              <div className="relative mb-4">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or category…"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-9 pr-9 py-2.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-burgundy-600/30 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category groups */}
              <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
                {Object.entries(groupedProducts).length === 0 ? (
                  <p className="text-stone-500 text-sm text-center py-8">No products found.</p>
                ) : (
                  (Object.entries(groupedProducts) as [string, Product[]][]).map(([category, prods]) => (
                    <div key={category}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-px flex-1 bg-stone-800" />
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                          {category}
                        </span>
                        <span className="h-px flex-1 bg-stone-800" />
                      </div>

                      {/* Product rows */}
                      <div className="space-y-1">
                        {prods.map(product => {
                          const sel = isSelected(product.id);
                          const normalPrice =
                            product.priceLabel ||
                            (product.price > 0
                              ? `R${product.price.toFixed(2)}/${product.unit}`
                              : 'POA');
                          return (
                            <button
                              key={product.id}
                              onClick={() => toggleProduct(product)}
                              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                                sel
                                  ? 'bg-burgundy-900/50 border border-burgundy-700/60 text-stone-100'
                                  : 'bg-stone-800/40 border border-transparent hover:bg-stone-800 text-stone-300 hover:text-stone-200'
                              }`}
                            >
                              {/* Checkbox */}
                              <span
                                className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors ${
                                  sel
                                    ? 'bg-burgundy-600 border-burgundy-500'
                                    : 'border-stone-600 bg-stone-800'
                                }`}
                              >
                                {sel && <Check size={11} className="text-white" />}
                              </span>
                              <span className="flex-1 font-medium leading-snug">
                                {product.name}
                              </span>
                              <span className="text-stone-400 text-xs flex-shrink-0 tabular-nums">
                                {normalPrice}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Special details */}
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={13} />
                Special Details
              </p>
              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-xs text-stone-500 mb-1.5 block">
                    <Tag size={11} className="inline mr-1 -mt-0.5" />
                    Special Name / Title *
                  </label>
                  <input
                    type="text"
                    value={details.name}
                    onChange={e => setDetails(d => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Month-End Specials · May 2025"
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-burgundy-600/30 text-sm"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-500 mb-1.5 block">
                      <Calendar size={11} className="inline mr-1 -mt-0.5" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={details.startDate}
                      onChange={e => setDetails(d => ({ ...d, startDate: e.target.value }))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-600/30 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 mb-1.5 block">
                      <Calendar size={11} className="inline mr-1 -mt-0.5" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={details.endDate}
                      onChange={e => setDetails(d => ({ ...d, endDate: e.target.value }))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-600/30 text-sm"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs text-stone-500 mb-1.5 block">
                    Short Note (optional)
                  </label>
                  <input
                    type="text"
                    value={details.note}
                    onChange={e => setDetails(d => ({ ...d, note: e.target.value }))}
                    placeholder="e.g. While stocks last · Order before Friday"
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-burgundy-600/30 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── Right: pricing + preview + actions ───────────────────────────── */}
          <div className="space-y-5">

            {/* Selected items & special prices */}
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Special Prices
                </p>
                <span className="text-xs bg-stone-800 text-stone-500 px-2.5 py-0.5 rounded-full">
                  {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Check size={20} className="mx-auto text-stone-700 mb-2" />
                  <p className="text-stone-500 text-sm">
                    Select products from the list to set special prices.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-xl border border-stone-700/40 bg-stone-800/40 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-3">
                      Quick bulk actions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15].map(value => (
                        <button
                          key={value}
                          onClick={() => applyBulkDiscount(value)}
                          className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-700 hover:text-stone-100"
                        >
                          Apply {value}% off
                        </button>
                      ))}
                      <button
                        onClick={restoreStandardPrices}
                        className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-700 hover:text-stone-100"
                      >
                        Restore normal prices
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="number"
                        value={bulkDiscount}
                        onChange={e => setBulkDiscount(e.target.value)}
                        placeholder="Custom %"
                        min="0"
                        step="0.01"
                        className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-600/30"
                      />
                      <button
                        onClick={applyCustomDiscount}
                        className="rounded-lg bg-burgundy-700 px-3 py-2 text-xs font-semibold text-stone-100 transition-colors hover:bg-burgundy-600"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
                    {selectedProducts.map(({ product, specialPrice }) => {
                      const normalPrice =
                        product.price > 0 ? `R${product.price.toFixed(2)}` : null;
                      return (
                        <div
                          key={product.id}
                          className="bg-stone-800/60 border border-stone-700/40 rounded-xl p-3"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-stone-100 text-sm font-medium leading-snug">
                                {product.name}
                              </p>
                              {normalPrice && (
                                <p className="text-stone-500 text-xs mt-0.5">
                                  Normal: {normalPrice}/{product.unit}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="text-stone-600 hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold pointer-events-none">
                              R
                            </span>
                            <input
                              type="number"
                              value={specialPrice}
                              onChange={e => updatePrice(product.id, e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="w-full bg-stone-700 border border-stone-600 rounded-lg pl-7 pr-10 py-2 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-600/30 tabular-nums"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs pointer-events-none">
                              /{product.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* Live preview */}
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Message Preview
              </p>
              <div className="overflow-hidden rounded-[28px] border border-stone-700/40 bg-[#0b141a] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-[#202c33] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111b21] text-sm font-semibold text-emerald-200">
                      CM
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Coleridge Meat Broadcast</p>
                      <p className="text-[11px] text-stone-400">WhatsApp-ready preview</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    Live
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_34%),linear-gradient(180deg,_#efeae2_0%,_#e7dfd5_100%)] p-4 scrollbar-thin">
                  <div className="ml-auto max-w-[92%] rounded-[22px] rounded-tr-md border border-emerald-200/50 bg-[#d9fdd3] px-4 py-3 text-[13px] leading-6 text-[#111b21] shadow-[0_16px_30px_rgba(17,27,33,0.12)]">
                    <div className="space-y-1.5">
                      {whatsappMessage.split('\n').map((line, index) =>
                        line.trim() ? (
                          <p key={`${line}-${index}`}>{renderWhatsAppInline(line)}</p>
                        ) : (
                          <div key={`gap-${index}`} className="h-2.5" />
                        )
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-medium text-[#667781]">
                      <span>Preview</span>
                      <span>12:45</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-500">
                <p>Bold and italic styling now mirrors the actual WhatsApp message structure.</p>
                <p>{whatsappMessage.length} characters</p>
              </div>
            </section>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {hasDateRangeError && (
                <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 px-4 py-3 text-xs leading-6 text-blue-200">
                  The end date is earlier than the start date. Fix the dates before sending or
                  copying the specials message.
                </div>
              )}
              <button
                onClick={openWhatsApp}
                disabled={actionDisabled}
                className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1db954] active:bg-[#199a46] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle size={17} />
                Open in WhatsApp
              </button>

              <button
                onClick={copyToClipboard}
                disabled={actionDisabled}
                className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 active:bg-stone-750 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                {copied ? (
                  <><Check size={15} className="text-green-400" /> Copied!</>
                ) : (
                  <><Copy size={15} /> Copy to Clipboard</>
                )}
              </button>
            </div>

            {/* Hint */}
            <p className="text-stone-600 text-xs text-center leading-relaxed px-2">
              "Open in WhatsApp" will prefill the message.
              Choose your broadcast list or individual contact from there.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
