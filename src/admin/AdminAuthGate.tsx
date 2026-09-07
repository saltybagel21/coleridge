import React, { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, Package } from "lucide-react";
import {
  adminFetch,
  isLocalDevelopment,
  isOwnerRoute,
  signInAdmin,
} from "./auth";

type GateState = "checking" | "signed-out" | "authorised";

const sessionIsAuthorised = async () => {
  const response = await adminFetch("/session", { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Please enter the owner password.");
  }
};

const AdminAuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<GateState>(
    isOwnerRoute() && !isLocalDevelopment() ? "checking" : "authorised",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOwnerRoute() || isLocalDevelopment()) return;

    let active = true;
    void sessionIsAuthorised()
      .then(() => {
        if (active) setState("authorised");
      })
      .catch(() => {
        if (active) setState("signed-out");
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInAdmin(password);
      await sessionIsAuthorised();
      setPassword("");
      setState("authorised");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in could not be completed.");
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
            Enter the owner password. This device can stay signed in for up to 30 days.
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
          <form onSubmit={(event) => void handleSignIn(event)}>
            <label htmlFor="owner-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Password
            </label>
            <div className="relative">
              <input
                id="owner-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                required
                className="h-12 w-full rounded-md border border-stone-700 bg-stone-950 px-4 pr-12 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-burgundy-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={busy || !password}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-burgundy-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600 disabled:opacity-60"
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
              Sign in
            </button>
          </form>
        )}

        <a href="/" className="mt-5 block text-center text-xs text-stone-500 transition-colors hover:text-stone-300">
          Return to the public shop
        </a>
      </main>
    </div>
  );
};

export default AdminAuthGate;
