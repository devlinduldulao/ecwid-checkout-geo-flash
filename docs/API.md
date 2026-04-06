# API Reference

This repo does not expose its own backend API. It uses Ecwid APIs directly from the native admin iframe and Ecwid storefront JavaScript APIs in the browser.

## Ecwid App Storage used by the admin page

### Read public config

```text
GET https://app.ecwid.com/api/v3/{storeId}/storage/public
Authorization: Bearer {access_token}
```

Returned payload shape:

```json
{
  "key": "public",
  "value": "{\"enabled\":true,\"mode\":\"hybrid\"}"
}
```

### Write public config

```text
PUT https://app.ecwid.com/api/v3/{storeId}/storage/public
Authorization: Bearer {access_token}
Content-Type: application/json
```

Request body:

```json
{
  "value": "{\"enabled\":true,\"mode\":\"hybrid\",\"samples\":[...] }"
}
```

## Ecwid storefront API used by the storefront script

### `Ecwid.OnAPILoaded.add(handler)`

Bootstraps the toast runtime only after the Ecwid widget API is ready.

### `Ecwid.getAppPublicConfig(appId)`

Returns the public App Storage value for the given app. The storefront runtime uses this as its shared source of truth when `window.CheckoutGeoFlashEcwid.publicConfig` is not preloaded.

### `Ecwid.OnOrderPlaced.add(handler)`

Used only for the shopper-local confirmation toast. This project does not persist the order payload or broadcast it to other visitors.

## Public config schema

```json
{
  "enabled": true,
  "mode": "sample-loop",
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

## Privacy rules

Only public, privacy-safe data belongs in this config. Do not store:

- buyer IP addresses
- names or emails
- order totals
- order IDs
- payment details
