# Ecwid Reviewer Answers

Use these answers during Ecwid App Market technical review.

## What does the app do?

Checkout Geo Flash is a marketing-focused Ecwid app that gives merchants a native Ecwid dashboard for configuring privacy-safe storefront purchase notifications.

The merchant can:

- edit sample notification copy
- choose runtime mode
- choose location label behavior
- control toast timing and visibility
- preview the shopper-facing UI safely inside the Ecwid admin
- save the public storefront config to Ecwid App Storage

The storefront runtime then reads that public config and applies the configured notification behavior.

## How does the app work technically?

The app is a static, backend-free Ecwid app.

- The admin page runs inside the Ecwid admin iframe.
- The dashboard receives the Ecwid payload at runtime.
- Merchant settings are saved to Ecwid App Storage under the `public` key.
- The storefront runtime reads the public config through `Ecwid.getAppPublicConfig(appId)`.
- On Ecwid Instant Site storefronts, the runtime also supports `window.instantsite.getAppPublicConfig(appId)`.
- Real shopper-local order confirmation behavior is handled through `Ecwid.OnOrderPlaced`.

## Does the app require a backend?

No. This version is intentionally static and backend-free.

It can be deployed on static hosting such as GitHub Pages, Netlify, Cloudflare Pages, or Vercel static hosting.

## Does it use real shopper or order data?

Yes, but only in a limited storefront-safe way.

- The merchant preview inside the dashboard uses fake sample data only.
- On the real storefront, the app can respond to shopper-local Ecwid order placement events through `Ecwid.OnOrderPlaced`.
- The app does not stream real order events between different shoppers.

## What customer data is stored publicly?

No sensitive customer data is stored in public config.

The public config only contains merchant-defined display settings such as:

- enabled state
- mode
- location mode
- fallback label
- timing values
- merchant-entered sample lines

It does not store buyer IP addresses, buyer names, buyer emails, order totals, or order IDs in public config.

## What scopes does the app require?

This app should request only the minimum scopes needed by the current implementation:

- `read_store_profile`
- `update_store_profile`
- `customize_storefront`

## Why are broader scopes not requested?

This version does not manage the catalog, create products, or update orders through the REST API. Requesting broader scopes would not match the actual implementation.

## What limitation should be disclosed?

This version does not provide cross-visitor live recent-purchase streaming. Shared live social-proof behavior would require a backend event collector or webhook-driven service.

## How was the app tested?

The project includes automated tests for:

- dashboard load and save flows
- Ecwid App Storage config parsing and serialization
- preview-mode happy and unhappy paths
- storefront runtime public config loading
- Ecwid `OnOrderPlaced` shopper event handling
- malformed config fallback handling
- disabled mode handling

Before release, the project passes:

- `npm run build`
- `npm run lint`
- `npm test`