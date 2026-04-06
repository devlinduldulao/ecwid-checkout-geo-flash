# Final Publish Checklist

Use this checklist before submitting Checkout Geo Flash to the Ecwid App Market.

## Ecwid app settings

Set the Ecwid app to use:

- App ID: `custom-app-132959256-1`
- App page URL: `https://YOUR-STATIC-HOST/public/index.html`
- Scopes:
  - `read_store_profile`
  - `update_store_profile`
  - `customize_storefront`

Do not request unused scopes such as catalog or order-write scopes for the current implementation.

## Security

- Rotate any Ecwid secret token that has been exposed.
- Rotate the Ecwid client secret if it has been exposed.
- Do not place the Ecwid client secret in browser code.
- Do not place Ecwid secret tokens in GitHub Actions for this static app.
- Do not place Ecwid credentials in marketplace submission forms unless Ecwid explicitly requests them through a secure review step.

## Build and verification

Run all required checks:

- `npm install`
- `npm run build`
- `npm run lint`
- `npm test`

Confirm that the packaged output contains the publish assets and static app files in `dist/`.

## Hosting

- Deploy `dist/` to your production static host.
- Confirm the deployed dashboard opens at `/public/index.html`.
- Confirm the storefront runtime is reachable at `/src/storefront/custom-storefront.js`.
- Confirm the root-level marketplace assets are present if you want them hosted publicly.

## Marketplace submission assets

Confirm these files are ready in `assets/marketplace/`:

- `icon.png`
- `banner.png`
- `screenshot-dashboard.png`
- `screenshot-preview.png`

## Merchant flow validation

Validate the real merchant flow inside Ecwid:

- Open the app inside the Ecwid admin iframe.
- Confirm the connection state resolves successfully.
- Save merchant settings to Ecwid App Storage.
- Confirm the public config is readable on the storefront.
- Confirm owner preview works in the dashboard.
- Confirm storefront sample or hybrid mode renders correctly.
- Confirm shopper-local order confirmation works through Ecwid storefront events.

## Reviewer preparation

Keep these materials ready:

- Marketplace description
- Support URL
- Support email
- Privacy policy URL
- Terms of service URL
- Technical reviewer answers from `publishing/ecwid-reviewer-answers.md`

## Known limitation to disclose

Disclose this clearly:

This version does not provide cross-visitor live recent-purchase streaming. It supports merchant-managed sample notifications and shopper-local order confirmation behavior only.