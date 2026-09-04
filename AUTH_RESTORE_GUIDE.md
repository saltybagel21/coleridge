# Owner authentication

## Current login

The live owner tools use Firebase Google authentication on the no-cost Spark plan.

- Owner dashboard: `/owner/`
- Specials manager: `/owner/specials/`
- Price-list studio: `/owner/price-list/`
- Protected API: `/owner-api/*`

Firebase project: `coleridge-admin`

Cloudflare Pages needs these Production variables:

```text
FIREBASE_PROJECT_ID=coleridge-admin
ADMIN_EMAILS=admin@coleridgemeat.co.za,rautenbachmax@gmail.com
```

The Firebase web configuration is intentionally public and lives in
`src/admin/auth.ts`. The API does not trust that configuration or the browser. It
verifies the Firebase JWT signature, issuer, audience, expiry, verified email,
30-day authentication age, and exact email allowlist before any catalogue write.

## Preserved Cloudflare Access login

The previous implementation remains under `/admin/` and `/admin-api/*`:

- `functions/_shared/access.ts`
- `functions/admin-api/_middleware.ts`
- the existing Access environment variables

It is currently not the primary login because the Cloudflare Zero Trust account
requires a billing instrument before it will send one-time PINs again. To restore
it later, activate Zero Trust, confirm the Access application protects `admin*`,
and use the setup in `CLOUDFLARE_SETUP.md`.
