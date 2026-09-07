export const isLocalDevelopment = () =>
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

export const isOwnerRoute = () =>
  window.location.pathname === "/owner" || window.location.pathname.startsWith("/owner/");

export const adminHref = (section: "catalogue" | "specials" | "price-list" = "catalogue") => {
  const base = isOwnerRoute() ? "/owner" : "/admin";
  return section === "catalogue" ? `${base}/` : `${base}/${section}/`;
};

export const signInAdmin = async (password: string) => {
  const response = await fetch("/owner-api/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Sign-in could not be completed.");
  }
};

export const signOutAdmin = async () => {
  if (!isOwnerRoute()) {
    window.location.assign("/cdn-cgi/access/logout");
    return;
  }

  await fetch("/owner-api/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: "{}",
  }).catch(() => undefined);
  window.location.replace("/owner/");
};

export const adminFetch = async (path: string, init: RequestInit = {}) => {
  if (!isOwnerRoute()) return fetch(`/admin-api${path}`, init);

  return fetch(`/owner-api${path}`, { ...init, credentials: "same-origin" });
};
