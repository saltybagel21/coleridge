# Cloudflare Pages deployment and owner access

The public site remains a Cloudflare Pages project connected to GitHub. Product data is stored in Cloudflare D1, and Stefan's dashboard is protected by Cloudflare Access.

## 1. Put the project on GitHub

Push the complete project source to a GitHub repository. Do not add `node_modules` or `dist`; both are already excluded by `.gitignore`.

Cloudflare needs these parts of the repository:

- `src`
- `functions`
- `migrations`
- `public`
- `index.html`
- `package.json` and `package-lock.json`
- `tsconfig.json` and `vite.config.ts`

## 2. Create the Pages project

1. Open Cloudflare Dashboard > **Workers & Pages**.
2. Select **Create application** > **Pages** > **Connect to Git**.
3. Choose the GitHub repository and production branch.
4. Use these build settings:

   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave blank when `package.json` is at the repository root

5. Add build variable `NODE_VERSION` with value `22`.
6. Deploy once. The public site can render from its built-in catalogue before D1 is connected, but the dashboard will remain unavailable.

## 3. Create and connect D1

1. Open Cloudflare Dashboard > **Storage & Databases** > **D1 SQL Database**.
2. Create a database named `coleridge-catalogue`.
3. Return to **Workers & Pages** and open the Coleridge Pages project.
4. Open **Settings** > **Bindings** > **Add binding** > **D1 database**.
5. Set the variable name to exactly `DB` and select `coleridge-catalogue`.
6. Add the binding to Production. Add it to Preview too if preview deployments should use the dashboard.
7. Redeploy the Pages project.

The first request to `/api/products` creates the table and seeds all 83 products automatically. The SQL schema is also preserved in `migrations/0001_catalogue.sql`.

## 4. Protect Stefan's dashboard with Cloudflare Access

Use the email address Stefan actually controls. The current price list gives `admin@coleridgemeat.co.za`; replace it below if Stefan uses a different address.

1. Open Cloudflare **Zero Trust**.
2. Under **Settings** > **Authentication** > **Login methods**, enable **One-time PIN** if it is not already enabled.
3. Choose the setup matching the site's production address:

   - **Custom domain:** Open **Access controls** > **Applications** > **Add an application** > **Self-hosted**. Name it `Coleridge Catalogue Manager`, choose the production hostname, and enter `admin*` in the Path field.
   - **Only a pages.dev address:** In the Pages project open **Settings** > **General** > **Enable access policy**. Select **Manage** on the created Access application, edit its Public hostname, remove the preview wildcard from the Subdomain, and enter `admin*` in the Path field. The public root remains open while the dashboard and API are protected.

4. Add an **Allow** policy with an Include rule:

   - Selector: `Emails`
   - Value: `admin@coleridgemeat.co.za`

5. Do not add a Bypass or Everyone rule.
6. Save the application and copy its **Application Audience (AUD) Tag**.
7. Note the Zero Trust team name from the team domain, for example the `my-team` part of `my-team.cloudflareaccess.com`.

If both the custom domain and `pages.dev` dashboard paths are protected by separate Access applications, copy both AUD tags and join them with a comma in `ACCESS_AUD`.

## 5. Add the server-side security variables

In the Pages project open **Settings** > **Variables and Secrets** and add these Production variables:

```text
ADMIN_EMAILS=admin@coleridgemeat.co.za,rautenbachmax@gmail.com
ACCESS_TEAM_NAME=your-zero-trust-team-name
ACCESS_AUD=the-application-audience-tag
```

List every authorized address in `ADMIN_EMAILS`, separated by commas, and use the exact same addresses in the Access Allow policy. The older single-value `ADMIN_EMAIL` variable remains supported for restored deployments. Add the variables to Preview only if preview access has also been protected. Redeploy after saving them.

The API does not trust the browser or the email header alone. It verifies the Cloudflare Access JWT signature, issuer, audience, expiry and exact email before any product can be changed. If any security variable is missing, production owner requests are denied.

## 6. Use the dashboard

Open `https://www.coleridgemeat.co.za/admin/`. Cloudflare sends a one-time login code to Stefan's approved email address.

Stefan can:

- add products;
- edit names, categories, notes, prices and units;
- mark products in or out of stock;
- hide or restore products;
- adjust quantity rules and display order.

Public pages request current D1 data immediately when opened, when the tab regains focus, and every 60 seconds while open. No site rebuild or Cloudflare redeployment is needed for catalogue changes.

## Security check after deployment

1. In a private browser window, open `/admin/` and confirm Cloudflare asks for authentication.
2. Try an unapproved email and confirm access is denied.
3. Sign in with Stefan's approved email and change one test product to out of stock.
4. Open the public shop and confirm the red Out of stock state appears within 60 seconds.
5. Change it back to in stock.

Cloudflare references: [Pages Functions](https://developers.cloudflare.com/pages/functions/), [D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/), [Access application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/), and [JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
