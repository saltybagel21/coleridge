import React, { useEffect, useState } from "react";
import { ChevronDown, Loader2, RefreshCw, Save } from "lucide-react";
import {
  defaultSpitPackageConfig,
  formatSpitPrice,
  type SpitPackage,
  type SpitPackageConfig,
} from "../shared/spitPackages";
import { adminFetch } from "./auth";

type DraftPackage = Omit<SpitPackage, "price" | "included"> & {
  priceText: string;
  includedText: string;
};

type DraftConfig = { visibleCount: number; packages: DraftPackage[] };

const toDraft = (config: SpitPackageConfig): DraftConfig => ({
  visibleCount: config.visibleCount,
  packages: config.packages.map(({ price, included, ...pkg }) => ({
    ...pkg,
    priceText: String(price),
    includedText: included.join("\n"),
  })),
});

const inputClass = "w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-burgundy-500";
const labelClass = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400";

const SpitPackagesEditor: React.FC<{ onNotice: (message: string) => void }> = ({ onNotice }) => {
  const [draft, setDraft] = useState<DraftConfig>(() => toDraft(defaultSpitPackageConfig()));
  const [saved, setSaved] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch("/spit-packages", { cache: "no-store" });
      const body = (await response.json()) as { config?: SpitPackageConfig; error?: string };
      if (!response.ok || !body.config) throw new Error(body.error || "Spit packages could not be loaded.");
      const next = toDraft(body.config);
      setDraft(next);
      setSaved(JSON.stringify(next));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Spit packages could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updatePackage = (index: number, change: Partial<DraftPackage>) => {
    setDraft((current) => ({
      ...current,
      packages: current.packages.map((pkg, position) => position === index ? { ...pkg, ...change } : pkg),
    }));
    setError("");
  };

  const save = async () => {
    const config: SpitPackageConfig = {
      visibleCount: draft.visibleCount,
      packages: draft.packages.map(({ priceText, includedText, ...pkg }) => ({
        ...pkg,
        price: Number(priceText),
        included: includedText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      })),
    };
    const invalidIndex = config.packages.findIndex((pkg, index) =>
      index < config.visibleCount && (!pkg.name.trim() || !draft.packages[index].priceText.trim() || !Number.isFinite(pkg.price) || pkg.price <= 0),
    );
    if (invalidIndex >= 0) {
      setExpanded(invalidIndex);
      setError(`Give package ${invalidIndex + 1} a name and a price above R0 before publishing.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await adminFetch("/spit-packages", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config),
      });
      const body = (await response.json()) as { config?: SpitPackageConfig; error?: string };
      if (!response.ok || !body.config) throw new Error(body.error || "The packages could not be saved.");
      const next = toDraft(body.config);
      setDraft(next);
      setSaved(JSON.stringify(next));
      onNotice("Spit packages updated on the website.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The packages could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const changed = saved !== JSON.stringify(draft);

  return (
    <section className="mt-7 border-b border-stone-800 pb-7" aria-labelledby="spit-package-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="spit-package-heading" className="font-serif text-xl text-stone-100">Spit packages</h2>
          <p className="mt-1 text-xs text-stone-500">Set the packages visitors can compare and open for details.</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="spit-package-count" className={labelClass}>Packages shown</label>
            <select
              id="spit-package-count"
              value={draft.visibleCount}
              onChange={(event) => { setDraft((current) => ({ ...current, visibleCount: Number(event.target.value) })); setError(""); }}
              disabled={loading || saving || !saved}
              className={`${inputClass} min-w-20`}
            >
              {[2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || saving} title="Reload spit packages" aria-label="Reload spit packages" className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-700 text-stone-400 hover:text-stone-100 disabled:opacity-40">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-stone-500"><Loader2 size={16} className="animate-spin" /> Loading packages</div>
      ) : (
        <div className="mt-4 grid gap-2">
          {draft.packages.slice(0, draft.visibleCount).map((pkg, index) => (
            <div key={pkg.id} className="rounded-md border border-stone-800 bg-stone-900/50">
              <button
                type="button"
                aria-expanded={expanded === index}
                aria-controls={`spit-package-fields-${index}`}
                onClick={() => setExpanded((current) => current === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-stone-900 sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-stone-100">{pkg.name || `Package ${index + 1}`}</span>
                  <span className="mt-1 block text-xs text-stone-500">{pkg.includedText.trim() ? `${pkg.includedText.split(/\r?\n/).filter(Boolean).length} included items` : "Add what is included"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-sm text-stone-200">
                  {pkg.priceText.trim() && Number.isFinite(Number(pkg.priceText)) ? formatSpitPrice(Number(pkg.priceText)) : "Set price"}
                  <ChevronDown size={16} className={`text-stone-500 transition-transform ${expanded === index ? "rotate-180" : ""}`} />
                </span>
              </button>
              {expanded === index && (
                <div id={`spit-package-fields-${index}`} className="grid gap-4 border-t border-stone-800 px-4 py-5 sm:grid-cols-2 sm:px-5">
                  <div>
                    <label htmlFor={`spit-name-${index}`} className={labelClass}>Package name</label>
                    <input id={`spit-name-${index}`} maxLength={60} value={pkg.name} onChange={(event) => updatePackage(index, { name: event.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor={`spit-price-${index}`} className={labelClass}>Price (R)</label>
                    <input id={`spit-price-${index}`} type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" value={pkg.priceText} onChange={(event) => updatePackage(index, { priceText: event.target.value })} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`spit-short-${index}`} className={labelClass}>Short line under price</label>
                    <input id={`spit-short-${index}`} maxLength={90} value={pkg.shortDescription} onChange={(event) => updatePackage(index, { shortDescription: event.target.value })} placeholder="For example: per person" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`spit-included-${index}`} className={labelClass}>What is included</label>
                    <textarea id={`spit-included-${index}`} rows={5} maxLength={2100} value={pkg.includedText} onChange={(event) => updatePackage(index, { includedText: event.target.value })} placeholder={"One item per line\nLamb on the spit\nSalads"} className={`${inputClass} resize-y`} />
                    <p className="mt-1 text-xs text-stone-500">One item per line. These appear as a clean list in the package details.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`spit-note-${index}`} className={labelClass}>Additional note (optional)</label>
                    <textarea id={`spit-note-${index}`} rows={3} maxLength={500} value={pkg.note} onChange={(event) => updatePackage(index, { note: event.target.value })} placeholder="For example: serving or booking details" className={`${inputClass} resize-y`} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-stone-500">{changed && saved ? "Changes have not been published yet." : ""}</span>
        <button type="button" onClick={() => void save()} disabled={loading || saving || !saved || !changed} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-burgundy-700 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save packages
        </button>
      </div>
    </section>
  );
};

export default SpitPackagesEditor;
