# Development Guide

## Setup

```bash
npm install
npm run build
npm run dev
```

This serves the repository as static files on port `5000`.

`npm run build` creates a static `dist/` folder for deployment.

## Preview URLs

- Merchant dashboard preview: `http://localhost:5000/public/index.html`
- Developer storefront preview: `http://localhost:5000/public/storefront-test.html`

The dashboard page can render outside Ecwid, but saving only works inside the Ecwid native app iframe because it depends on `EcwidApp.getPayload()`.

## Edit points

### Storefront runtime

- `src/storefront/custom-storefront.js`
- `src/storefront/custom-storefront.css`

Use this for:

- toast rendering
- runtime modes
- order confirmation behavior
- public config consumption

### Merchant dashboard

- `public/index.html`
- `src/admin/app.js`
- `src/shared/checkout-geo-flash-shared.js`

Use this for:

- config schema changes
- App Storage reads and writes
- owner-only preview behavior
- deployment snippet generation
- normalization and validation rules

## Saving config in Ecwid

Inside the admin iframe, the app receives `store_id` and `access_token` from `EcwidApp.getPayload()`.

The app then calls:

```text
GET https://app.ecwid.com/api/v3/{storeId}/storage/public
PUT https://app.ecwid.com/api/v3/{storeId}/storage/public
Authorization: Bearer {access_token}
Content-Type: application/json
```

Write body:

```json
{
  "value": "{\"enabled\":true,\"mode\":\"hybrid\",...}"
}
```

## Storefront config lookup

The storefront runtime loads config in this order:

1. `window.CheckoutGeoFlashEcwid.publicConfig`
2. `Ecwid.getAppPublicConfig(appId)`
3. built-in defaults

That makes the merchant dashboard usable in local preview mode and keeps `public/storefront-test.html` available only for developer verification.

## Testing

Run:

```bash
npm run build
npm run lint
npm test
```

`npm test` uses Node's built-in test runner and verifies:

- config normalization
- sample line parsing
- App Storage payload parsing
- storage URL generation

## Common changes

### Add a new public config field

1. Update `DEFAULT_PUBLIC_CONFIG` in `src/shared/checkout-geo-flash-shared.js`.
2. Normalize it in `normalizePublicConfig`.
3. Render it in `public/index.html` and `src/admin/app.js`.
4. Consume it in `src/storefront/custom-storefront.js`.
5. Add a test in `tests/config.test.js`.

### Change storefront behavior

Edit `src/storefront/custom-storefront.js` only. Keep the runtime browser-safe and avoid introducing a backend assumption.

## Constraints

- Do not add server routes, webhook listeners, or database persistence unless the project direction changes explicitly.
- Keep all public config data privacy-safe because it is readable on the storefront.
- Do not store buyer IPs, names, emails, order totals, or order IDs in the public config.

| Element | Convention | Example |
|---------|-----------|---------|
| File names | kebab-case | `ecwid-api.js` |
| Variables | camelCase | `storeId`, `apiToken` |
| Constants | SCREAMING_SNAKE_CASE | `ECWID_STORE_ID` |
| Routes | lowercase with hyphens | `/api/products`, `/webhooks/ecwid` |
| CSS classes | BEM-style, prefixed | `.demo-plugin-badge` |
| Commits | Conventional style | `feat: add order webhook handler` |
