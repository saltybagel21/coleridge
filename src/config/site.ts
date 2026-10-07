// VITE_PUBLIC_SITE_URL can override the public domain for another deployment.
export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://coleridgemeatstellenbosch.co.za"
).replace(/\/$/, "");

export const SPECIALS_SHOP_URL = `${PUBLIC_SITE_URL}/?view=specials#shop-grid`;
