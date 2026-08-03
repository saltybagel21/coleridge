# Temporarily hidden store features

The August 2026 site uses one public catalogue. Two older features are intentionally hidden, not discarded.

## Retail and wholesale counters

The exact former implementation is in `legacy/retail-wholesale-store`. It includes the two product lists, counter switch, wholesale code, request modal, floating unlock control, Google Sheet loader, cart and checkout wording.

Follow the archived `README.md` to restore the whole former store. Do not reconstruct the switch from memory; restore the archived files so its behaviour and layout return together.

## Product-card photos

The current product-card photo overlay, hover image and viewer code remain in `src/shop/Shop.tsx`, guarded by `PRODUCT_PHOTOS_ENABLED = false`. The exact previous product/photo mappings are also in the archived `src/shop/products.ts`.

To restore photos while keeping the single public catalogue, the D1 schema and dashboard first need an `image` field, each chosen product needs its local `/images/products/...` path, and `PRODUCT_PHOTOS_ENABLED` can then be changed to `true`. The image assets themselves remain under `public/images/products`.
