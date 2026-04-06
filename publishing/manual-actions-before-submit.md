# Manual Actions Before Submit

These steps cannot be completed safely from the local repo and must be done by the publisher in the Ecwid portal and with the real production domain.

## 1. Fill the publisher-owned production values

Update these values in `publishing/submission-values.template.json` and then copy them into `publishing/listing-metadata.json`:

- production app page host
- support URL
- support email
- privacy policy URL
- terms of service URL

Expected app page pattern:

- `https://YOUR-STATIC-HOST/public/`

## 2. Rotate exposed Ecwid secrets

The following values were exposed during preparation and should be rotated before public launch:

- Ecwid secret token
- Ecwid client secret

Do not commit rotated secrets into this repository.

## 3. Keep the minimum scope set

Use only these scopes for the current app implementation:

- `read_store_profile`
- `update_store_profile`
- `customize_storefront`

Do not request unused catalog or order-write scopes for this release.

## 4. Verify the real production app page URL in Ecwid

In the Ecwid app configuration, set:

- App ID: `custom-app-132959256-1`
- App page URL: your real deployed `/public/`

## 5. Final marketplace submission pass

Before submitting:

- run `npm run lint`
- run `npm run build`
- run `npm test`
- confirm `dist/` is the deployed artifact
- confirm `assets/marketplace/` contains the final banner, icon, and screenshots
- use `publishing/ecwid-email-followup-responses.md` for short reviewer replies
- use `publishing/ecwid-reviewer-answers.md` for technical review replies
- use `publishing/final-publish-checklist.md` as the final gate