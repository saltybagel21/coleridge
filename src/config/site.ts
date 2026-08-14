// Change this one fallback when the permanent domain is connected, or set
// VITE_PUBLIC_SITE_URL in Cloudflare Pages for builds on another domain.
export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://coleridge.pages.dev"
).replace(/\/$/, "");

export const SPECIALS_SHOP_URL = `${PUBLIC_SITE_URL}/?view=specials#shop-grid`;

