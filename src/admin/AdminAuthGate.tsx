import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2, LogIn, Package } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  adminAuth,
  adminFetch,
  configureAdminPersistence,
  isLocalDevelopment,
  isOwnerRoute,
  signInAdmin,
} from "./auth";

type GateState = "checking" | "signed-out" | "authorised";

const sessionIsAuthorised = async () => {
  const response = await adminFetch("/session", { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "This Google account is not authorised.");
  }
};

const getSignInError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Sign-in could not be completed.";
  if (message.includes("popup-closed-by-user") || message.includes("user-cancelled")) {
    return "Sign-in was cancelled.";
  }
  if (message.includes("popup-blocked")) {
    return "The Google sign-in window was blocked. Allow pop-ups for this site and try again.";
  }
  if (message.includes("network-request-failed")) {
    return "Google sign-in could not connect. Check the internet connection and try again.";
  }
  return message;
};

const AdminAuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<GateState>(
    isOwnerRoute() && !isLocalDevelopment() ? "checking" : "authorised",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOwnerRoute() || isLocalDevelopment()) return;

    let active = true;
    void configureAdminPersistence();
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (!active) return;
      if (!user) {
        setState("signed-out");
        return;
      }

      setState("checking");
      try {
        await sessionIsAuthorised();
        if (active) {
          setError("");
          setState("authorised");
        }
      } catch (sessionError) {
        await signOut(adminAuth);
        if (active) {
          setError(sessionError instanceof Error ? sessionError.message : "This account is not authorised.");
          setState("signed-out");
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setBusy(true);
    setError("");
    try {
      await signInAdmin();
      await sessionIsAuthorised();
      setState("authorised");
    } catch (signInError) {
      await signOut(adminAuth).catch(() => undefined);
      setError(getSignInError(signInError));
      setState("signed-out");
    } finally {
      setBusy(false);
    }
  };

  if (state === "authorised") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4 py-10 text-stone-200">
      <main className="w-full max-w-md border border-stone-800 bg-stone-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-burgundy-700/50 bg-burgundy-900/40 text-burgundy-200">
            <Package size={20} />
          </div>
          <div>
            <div className="font-serif text-xl text-stone-100">Catalogue Manager</div>
            <div className="text-xs text-stone-500">Coleridge Meat</div>
          </div>
        </div>

        <div className="py-7">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">Owner access</div>
          <h1 className="mt-3 font-serif text-3xl text-stone-100">
            {state === "checking" ? "Checking your session" : "Sign in securely"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Use the approved Google account for Stefan or Max. This device will stay signed in for up to 30 days.
          </p>

          {error ? (
            <div className="mt-5 flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/35 px-4 py-3 text-sm text-red-100">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {state === "checking" ? (
          <div className="flex h-12 items-center justify-center gap-2 rounded-md border border-stone-700 text-sm text-stone-400">
            <Loader2 size={17} className="animate-spin" /> Checking session
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={busy}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-burgundy-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600 disabled:opacity-60"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
            Continue with Google
          </button>
        )}

        <a href="/" className="mt-5 block text-center text-xs text-stone-500 transition-colors hover:text-stone-300">
          Return to the public shop
        </a>
      </main>
    </div>
  );
};

export default AdminAuthGate;
