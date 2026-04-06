# Publishing Guide

## Goal

This document turns the Ecwid app into a publishable package checklist instead of an internal prototype.

## Required listing materials

Before submission, complete these items:

1. App name and short tagline
2. Full app description and feature list
3. Support email and support URL
4. Privacy policy URL
5. Terms of service URL
6. App icon
7. App banner or hero image
8. Dashboard screenshots
9. Preview or setup screenshots
10. Public installation URL and tested app page URL

## Required technical review items

1. Merchant dashboard page must load inside Ecwid admin without console errors.
2. Owner-only preview must work with fake sample data.
3. Saving to Ecwid App Storage must succeed with `read_store_profile` and `update_store_profile` scopes.
4. Storefront runtime must read the `public` App Storage key safely.
5. Public config must never include buyer IPs, names, emails, order totals, or order IDs.
6. The project must pass `npm run build`, `npm run lint`, and `npm test`.

## Scopes to declare

- `read_store_profile`
- `update_store_profile`
- `customize_storefront`

## Files prepared in this repo

- `publishing/listing-metadata.json`
- `publishing/submission-values.template.json`
- `assets/marketplace/README.md`
- `assets/marketplace/icon.png`
- `assets/marketplace/banner.png`
- `assets/marketplace/screenshot-dashboard.png`
- `assets/marketplace/screenshot-preview.png`
- `assets/marketplace/icon.svg`
- `assets/marketplace/banner.svg`
- `assets/marketplace/screenshot-dashboard.svg`
- `assets/marketplace/screenshot-preview.svg`

The marketplace folder is the single source of truth for submission-ready artwork. The SVG files remain the editable source artwork. The PNG screenshots should be refreshed from the live UI whenever the dashboard or preview design changes.

Use `publishing/submission-values.template.json` as the single place to collect your production host, support, policy, and app ID values before you update the listing metadata.

For Ecwid reviewer communication, use `publishing/ecwid-reviewer-answers.md`.

For final release readiness, use `publishing/final-publish-checklist.md`.

## Release checklist

1. Update the version in `package.json` if needed.
2. Run `npm install`.
3. Run `npm run build && npm run lint && npm test`.
4. Confirm the GitHub Actions workflows are green.
5. Review the generated PNG assets and replace placeholder artwork if needed.
6. Fill out the publishing metadata JSON with production URLs.
7. Deploy the built `dist/` output to your production static host.
8. Verify the Ecwid app page URL points to the production `public/index.html`.

## Current limitation to disclose

This no-backend Ecwid version does not provide cross-visitor live purchase event streaming. It provides merchant-managed sample notifications and shopper-local order confirmation behavior only.