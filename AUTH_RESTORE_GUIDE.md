# Owner authentication

## Current login

The live owner tools use a server-verified password and a signed 30-day session cookie.

- Owner dashboard: `/owner/`
- Specials manager: `/owner/specials/`
- Price-list studio: `/owner/price-list/`
- Protected API: `/owner-api/*`

Cloudflare Pages needs these encrypted Production secrets:

```text
OWNER_PASSWORD_HASH=<one-way password hash>
OWNER_SESSION_SECRET=<random secret of at least 32 bytes>
```

The plain password is never stored in the repository or sent back to the browser.
The API verifies its one-way hash, throttles repeated failed attempts in D1, and
issues an `HttpOnly`, `Secure`, `SameSite=Strict` cookie signed with the session
secret. Any change to the password hash or session secret signs out existing devices.

## Preserved Cloudflare Access login

The previous implementation remains under `/admin/` and `/admin-api/*`:

- `functions/_shared/access.ts`
- `functions/admin-api/_middleware.ts`
- the existing Access environment variables

It is currently not the primary login because the Cloudflare Zero Trust account
requires a billing instrument before it will send one-time PINs again. To restore
it later, activate Zero Trust, confirm the Access application protects `admin*`,
and use the setup in `CLOUDFLARE_SETUP.md`.
