import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallHistory = {
  lastShown?: number;
  dismissedUntil?: number;
  installed?: boolean;
};

const STORAGE_KEY = "coleridge-install-suggestion-v1";
const DAY = 24 * 60 * 60 * 1000;

const readHistory = (): InstallHistory => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value as InstallHistory : {};
  }
  catch { return {}; }
};

const updateHistory = (change: Partial<InstallHistory>) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readHistory(), ...change })); }
  catch { /* The prompt can still work when storage is disabled. */ }
};

const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isSafari = () => !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

const InstallSuggestion = () => {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const [ios] = useState(isIos);

  useEffect(() => {
    if (isInstalled() || readHistory().installed) return;
    const delay = window.setTimeout(() => setReady(true), 45_000);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      updateHistory({ installed: true });
      setVisible(false);
      setInstallEvent(null);
    };
    const onVisibilityChange = () => setPageVisible(document.visibilityState !== "hidden");
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(delay);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!ready || (!installEvent && !ios) || !pageVisible || isInstalled()) return;
    const history = readHistory();
    const now = Date.now();
    if (history.installed || (history.dismissedUntil ?? 0) > now || now - (history.lastShown ?? 0) < 30 * DAY) return;
    updateHistory({ lastShown: now });
    setVisible(true);
  }, [ready, installEvent, ios, pageVisible]);

  useEffect(() => {
    if (!visible || instructions) return;
    const timeout = window.setTimeout(() => setVisible(false), 15_000);
    return () => window.clearTimeout(timeout);
  }, [visible, instructions]);

  const dismiss = () => {
    updateHistory({ dismissedUntil: Date.now() + 90 * DAY });
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "dismissed") updateHistory({ dismissedUntil: Date.now() + 90 * DAY });
      if (choice.outcome === "accepted") updateHistory({ installed: true });
    } catch {
      // The browser may withdraw the install offer before it is used.
    } finally {
      setInstallEvent(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <aside aria-label="Add Coleridge Meat to your device" className="fixed bottom-20 left-4 right-4 z-[65] max-w-sm rounded-md border border-stone-700 bg-stone-900 p-4 text-stone-100 shadow-2xl sm:bottom-6 sm:right-auto">
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg leading-6">Keep Coleridge close</div>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            {instructions
              ? isSafari() ? "In Safari, tap Share, then Add to Home Screen." : "Open this site in Safari, then tap Share and Add to Home Screen."
              : "Add the shop to your home screen for quick access."}
          </p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss install suggestion" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-stone-800 hover:text-stone-100"><X size={16} /></button>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <button type="button" onClick={dismiss} className="text-xs text-stone-400 hover:text-stone-100">Not now</button>
        {ios ? (
          <button type="button" onClick={() => instructions ? dismiss() : setInstructions(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-burgundy-700 px-3 text-xs font-semibold text-white hover:bg-burgundy-600">
            {instructions ? "Got it" : "How to add"}
          </button>
        ) : (
          <button type="button" onClick={() => void install()} className="inline-flex h-9 items-center gap-2 rounded-md bg-burgundy-700 px-3 text-xs font-semibold text-white hover:bg-burgundy-600"><Download size={14} /> Install</button>
        )}
      </div>
    </aside>
  );
};

export default InstallSuggestion;
