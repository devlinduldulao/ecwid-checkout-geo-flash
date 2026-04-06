# Checkout Geo Flash for Ecwid

Merchant dashboard app for Ecwid store owners. This version avoids your own Node.js server, database, and Redis by using:

- Ecwid App Storage for merchant settings
- Ecwid public app config for storefront reads
- Ecwid storefront JavaScript events for the final runtime only

The app itself is for the business owner inside the Ecwid dashboard, not for online visitors. The owner uses it to configure the feature, preview notification behavior safely, and publish privacy-safe settings. Without a backend writer, Ecwid still cannot broadcast real shared live purchase events across different shoppers.

## What is included

- `public/index.html`: native Ecwid admin page for merchant controls, preview, and setup
- `src/admin/app.js`: dashboard logic for loading, saving, and previewing merchant settings
- `src/storefront/custom-storefront.js`: storefront runtime applied after the owner installs or injects it
- `src/shared/checkout-geo-flash-shared.js`: config parsing and normalization helpers
- `public/storefront-test.html`: developer-only storefront test page

## Publishing assets status

Marketplace artwork now lives in `assets/marketplace/` at the repo root.

This folder contains:

- app icon assets
- banner assets
- dashboard screenshots
- preview screenshots

Use the screenshots in that folder as the current UI reference for marketplace submission. Refresh them after dashboard design changes so they stay aligned with the live app.

## Commands

```bash
npm install
npm run build
npm run dev
npm run lint
npm test
```

`npm run dev` serves the repo as static files on port `5000`.

`npm run build` creates a deployable static output in `dist/`.

`npm run preview` serves the built `dist/` output on port `5001`.

## GitHub Actions

This repo now includes three GitHub Actions workflows:

- `.github/workflows/ci.yml`: installs dependencies, builds `dist/`, runs lint, runs tests, and uploads the build artifact
- `.github/workflows/deploy-pages.yml`: builds the app and deploys `dist/` to GitHub Pages on pushes to `main` or `master`
- `.github/workflows/release.yml`: builds the app, creates `checkout-geo-flash-ecwid-dist.zip`, uploads it as an Actions artifact, and attaches it to GitHub Releases for tags matching `v*`

To use GitHub Pages deployment, enable Pages in the repository settings and select GitHub Actions as the source. For this repository, the live URL will be `https://devlinduldulao.github.io/ecwid-checkout-geo-flash/` after the workflow completes.

## Ecwid requirements

Your Ecwid app should have these scopes:

- `read_store_profile`
- `update_store_profile`
- `customize_storefront`

The admin page uses the native Ecwid iframe payload and writes to:

```text
PUT https://app.ecwid.com/api/v3/{storeId}/storage/public
Authorization: Bearer {access_token}
```

The storefront reads public config with:

```javascript
Ecwid.getAppPublicConfig('your-app-id');
```

## Merchant workflow

1. Open the app inside the Ecwid admin dashboard.
2. Review the store status and connection state.
3. Configure sample copy, mode, and location behavior.
4. Run the owner-only preview inside the dashboard.
5. Save settings to Ecwid App Storage.
6. Install the generated storefront snippet or rely on app injection.

## Local preview

1. Run `npm run dev`.
2. Open `http://localhost:5000/public/index.html?appId=your-ecwid-app-id` to preview the dashboard UI.
3. Optionally open `http://localhost:5000/public/storefront-test.html` for developer-only storefront verification.
4. Replace `STORE_ID` and `your-ecwid-app-id` in the test page only when you need storefront validation.

Outside Ecwid admin, the settings page runs in preview mode only. Saving requires the Ecwid iframe payload.

## Deployment

Deploy the repo to any static host such as GitHub Pages, Netlify, Cloudflare Pages, or Vercel static output.

For GitHub Pages specifically:

1. Open GitHub repository settings for `devlinduldulao/ecwid-checkout-geo-flash`.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Push to `main` or run `.github/workflows/deploy-pages.yml` manually from the Actions tab.
5. Use `https://devlinduldulao.github.io/ecwid-checkout-geo-flash/public/index.html` as the Ecwid app page URL.

For GitHub release artifacts:

1. Create and push a tag such as `v0.1.0`.
2. Let `.github/workflows/release.yml` build the package.
3. Download `checkout-geo-flash-ecwid-dist.zip` from the workflow artifact or the GitHub Release asset.

If you want a clean deploy artifact, upload the contents of `dist/` after running `npm run build`.

Then either:

1. Register `public/index.html` as your Ecwid native app page and let the app inject the storefront script.
2. Or manually paste the generated snippet from the merchant dashboard into Ecwid Design → Custom JavaScript.

## Feature boundary

This repo intentionally does not include:

- Express or another custom app server
- external database storage
- webhook processing
- shared event polling across customers

If you later want true live cross-visitor purchase notifications, that is the one feature that still needs a backend event collector.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a deep dive into the architecture.

## Publishing

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the submission checklist, [publishing/listing-metadata.json](publishing/listing-metadata.json) for the draft listing metadata scaffold, [publishing/ecwid-reviewer-answers.md](publishing/ecwid-reviewer-answers.md) for reviewer-facing technical answers, [publishing/final-publish-checklist.md](publishing/final-publish-checklist.md) for launch prep, and `assets/marketplace/` for the current marketplace artwork.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full development guide.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

---

## Ecwid Resources

### Getting Started

| Resource | Link |
|----------|------|
| Ecwid Developer Portal (register apps) | https://developers.ecwid.com/ |
| App Development Guide | https://api-docs.ecwid.com/docs/get-started |
| Ecwid App Market (see published apps) | https://www.ecwid.com/apps |
| Sign Up for Free Ecwid Account | https://www.ecwid.com/ |
| Ecwid Control Panel (store admin) | https://my.ecwid.com/ |

### REST API v3

| Resource | Link |
|----------|------|
| API Overview & Reference | https://api-docs.ecwid.com/reference/overview |
| Products API | https://api-docs.ecwid.com/reference/products |
| Orders API | https://api-docs.ecwid.com/reference/orders |
| Customers API | https://api-docs.ecwid.com/reference/customers |
| Categories API | https://api-docs.ecwid.com/reference/categories |
| Discount Coupons API | https://api-docs.ecwid.com/reference/discount-coupons |
| Store Profile API | https://api-docs.ecwid.com/reference/store-profile |
| Product Variations API | https://api-docs.ecwid.com/reference/product-variations |
| Abandoned Carts API | https://api-docs.ecwid.com/reference/abandoned-carts |
| Shipping Options API | https://api-docs.ecwid.com/reference/shipping-options |
| Tax Settings API | https://api-docs.ecwid.com/reference/taxes |
| Application Storage API | https://api-docs.ecwid.com/reference/storage |
| Starter Site API | https://api-docs.ecwid.com/reference/starter-site |

### Authentication & Security

| Resource | Link |
|----------|------|
| OAuth 2.0 Authentication | https://api-docs.ecwid.com/docs/authentication |
| Access Scopes Reference | https://api-docs.ecwid.com/docs/access-scopes |
| API Tokens & Keys | https://api-docs.ecwid.com/docs/api-tokens |

### Storefront Customisation

| Resource | Link |
|----------|------|
| JavaScript Storefront API | https://api-docs.ecwid.com/docs/customize-storefront |
| Storefront JS API Reference | https://api-docs.ecwid.com/docs/storefront-js-api-reference |
| Custom CSS for Storefront | https://api-docs.ecwid.com/docs/customize-appearance |
| Page Events (OnPageLoaded, etc.) | https://api-docs.ecwid.com/docs/page-events |
| Cart Methods (add, remove, get) | https://api-docs.ecwid.com/docs/cart-methods |
| Public App Config (storefront injection) | https://api-docs.ecwid.com/docs/public-app-config |
| SEO for Ecwid Stores | https://api-docs.ecwid.com/docs/seo |

### App Development

| Resource | Link |
|----------|------|
| Native Apps (admin iframe) | https://api-docs.ecwid.com/docs/native-apps |
| Ecwid App UI CSS Framework | https://api-docs.ecwid.com/docs/ecwid-css-framework |
| EcwidApp JS SDK Reference | https://api-docs.ecwid.com/docs/ecwidapp-js-sdk |
| App Storage (key-value per store) | https://api-docs.ecwid.com/docs/app-storage |
| Webhooks | https://api-docs.ecwid.com/docs/webhooks |
| Webhook Events Reference | https://api-docs.ecwid.com/docs/webhook-events |
| Custom Shipping Methods | https://api-docs.ecwid.com/docs/add-shipping-method |
| Custom Payment Methods | https://api-docs.ecwid.com/docs/add-payment-method |
| Custom Discount Logic | https://api-docs.ecwid.com/docs/add-custom-discount |
| App Listing Requirements | https://api-docs.ecwid.com/docs/app-listing-requirements |

### Embedding & Widgets

| Resource | Link |
|----------|------|
| Add Ecwid to Any Website | https://api-docs.ecwid.com/docs/add-ecwid-to-a-site |
| Product Browser Widget Config | https://api-docs.ecwid.com/docs/product-browser |
| Buy Now Buttons | https://api-docs.ecwid.com/docs/buy-now-buttons |
| Single Sign-On (SSO) | https://api-docs.ecwid.com/docs/single-sign-on |

### Guides & Tutorials

| Resource | Link |
|----------|------|
| API Rate Limits | https://api-docs.ecwid.com/docs/rate-limits |
| Error Codes Reference | https://api-docs.ecwid.com/docs/errors |
| Testing Your App | https://api-docs.ecwid.com/docs/testing |
| Publishing to App Market | https://api-docs.ecwid.com/docs/publishing |
| Ecwid Community Forum | https://community.ecwid.com/ |
| Ecwid Help Center | https://support.ecwid.com/ |
| Ecwid Status Page | https://status.ecwid.com/ |
| Ecwid Blog | https://www.ecwid.com/blog |

---

## License

MIT
