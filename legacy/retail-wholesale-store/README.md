# Preserved retail and wholesale store

This folder contains an exact snapshot of the shop implementation before the August 2026 move to one public catalogue.

It preserves:

- the retail and wholesale counter switch;
- Stefan's wholesale access-code flow;
- the floating wholesale unlock button;
- the separate retail and wholesale product lists;
- the Google Sheet catalogue override;
- the product-card hover photos and photo viewer;
- the checkout and cart wording used by the two-counter store.

## Restore the two-counter store

1. Copy `src/App.tsx` and the complete `src/shop` folder from this archive back into the matching live locations.
2. Copy `src/admin/SpecialsBuilder.tsx` back if that archived specials builder is also required.
3. Copy the two files under `public` back into the live `public` folder to restore the Google Sheet setup.
4. Run `npm install`, `npm run lint`, and `npm run build`.
5. Redeploy through the GitHub-connected Cloudflare Pages project.

The existing images remain under the live `public/images` folder. The current single-catalogue store deliberately does not show product-card photos, but those image assets have not been deleted.
