# Ecwid Email Follow-Up Responses

Use these short responses when Ecwid asks follow-up questions by email.

## What does the app do?

Checkout Geo Flash is a marketing-focused Ecwid app that lets merchants configure privacy-safe purchase notification UI from a native Ecwid dashboard.

## Does the app require a backend?

No. This version is fully static and backend-free.

## How are merchant settings stored?

Merchant settings are stored in Ecwid App Storage under the `public` key and then read by the storefront runtime.

## Does the app use real order data?

Yes, in a limited storefront-safe way. The dashboard preview uses fake sample data only, while the storefront can respond to shopper-local Ecwid `OnOrderPlaced` events.

## Does the app expose sensitive buyer data publicly?

No. Public config does not store buyer IPs, names, emails, order totals, or order IDs.

## Why are the requested scopes limited?

The app requests only the minimum scopes required by the current implementation: `read_store_profile`, `update_store_profile`, and `customize_storefront`.

## Why are catalog and order-write scopes not requested?

The current implementation does not create catalog items, update catalog data, or update orders through the REST API.

## What storefront APIs does the app use?

The storefront runtime uses `Ecwid.getAppPublicConfig(appId)` and `Ecwid.OnOrderPlaced`. It also supports `window.instantsite.getAppPublicConfig(appId)` on Ecwid Instant Site storefronts.

## What limitation should be disclosed?

This version does not provide cross-visitor live recent-purchase streaming. It supports merchant-managed sample notifications and shopper-local order confirmation behavior only.

## Has the app been tested?

Yes. The project has automated tests for dashboard save/load flows, config parsing, storefront public config loading, shopper order event handling, disabled mode, and malformed config fallback behavior.

## What checks pass before release?

The project passes `npm run build`, `npm run lint`, and `npm test` before release.