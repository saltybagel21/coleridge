# Coleridge Meat website

Vite/React website with a single public product catalogue and a Cloudflare-protected owner dashboard.

Live website: [https://coleridge.pages.dev](https://coleridge.pages.dev)

## Local development

```powershell
npm install
npm run dev:cloudflare
```

Open:

- Website: `http://127.0.0.1:8788/`
- Local owner dashboard: `http://127.0.0.1:8788/admin/`

The Cloudflare development command uses a local D1 database and seeds the 83 products from `src/shop/products.ts` automatically.

## Checks

```powershell
npm run lint
npm run build
```

## Deployment

Follow `CLOUDFLARE_SETUP.md` when recreating or transferring the project. The live deployment uses a D1 catalogue database and Cloudflare Access email authentication for the owner dashboard.

The previous retail/wholesale store and its restoration instructions are under `legacy/retail-wholesale-store`.
