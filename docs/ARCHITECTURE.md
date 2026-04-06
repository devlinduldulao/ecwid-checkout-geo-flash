# Architecture

## Goal

This Ecwid repo is intentionally static-first. The design target is the lowest-cost deploy that still feels like a real app:

- no custom Node.js server
- no separate database
- no Redis or background worker
- no webhook listener

## Platform fit

Ecwid storefronts are browser widgets. For this project, that means:

- the admin page can save configuration through Ecwid App Storage
- the storefront can read only the public portion of that config
- the storefront cannot safely write shared cross-customer order events without a backend

## Runtime surfaces

### Admin iframe

Files:

- `public/index.html`
- `src/admin/app.js`
- `src/shared/checkout-geo-flash-shared.js`

Flow:

1. Ecwid loads the page inside the admin iframe.
2. `EcwidApp.getPayload()` provides `store_id` and `access_token`.
3. The admin script loads `storage/public` directly from the Ecwid REST API.
4. Saving writes a normalized JSON string back to the same `public` key.

### Storefront runtime

Files:

- `src/storefront/custom-storefront.js`
- `src/storefront/custom-storefront.css`

Flow:

1. The storefront script waits for `Ecwid.OnAPILoaded`.
2. It reads public config from `window.CheckoutGeoFlashEcwid.publicConfig` or `Ecwid.getAppPublicConfig(appId)`.
3. It normalizes that config and starts either sample-loop mode, order-confirmation mode, or hybrid mode.
4. Toast UI is injected directly into the page.

## Data model

Stored in Ecwid App Storage under the `public` key:

```json
{
    "enabled": true,
    "mode": "hybrid",
    "locationMode": "city",
    "fallbackLocationLabel": "Nearby",
    "rotateIntervalMs": 3200,
    "visibleDurationMs": 5000,
    "samples": [
        {
            "productName": "Weekend Tote",
            "location": "Austin",
            "event": "paid"
        }
    ]
}
```

## Current limitation

WooCommerce can store privacy-safe recent events because the plugin runs on the merchant server during checkout. Ecwid does not give this static storefront build an equivalent shared write path.

Because of that, the Ecwid version currently supports:

- merchant-defined rotating sample notifications
- shopper-local order confirmation notifications

It does not currently support:

- shared live cross-visitor recent purchase feeds
- webhook-driven event collection
- historical order import

## Security model

- Access tokens are only used inside the Ecwid admin iframe when saving App Storage.
- Storefront code reads only the public config exposed by Ecwid.
- No raw IPs, buyer names, emails, or order totals are stored by this implementation.
- The storefront runtime renders only merchant-curated sample data or the current shopper's own confirmation state.
