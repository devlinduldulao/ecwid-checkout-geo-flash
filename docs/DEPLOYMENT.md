# Deployment Guide

## Goal

Deploy Checkout Geo Flash for Ecwid without paying for your own app server or database.

## Hosting model

This repo only needs static hosting. Good options:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel static deployment

No Docker, PM2, Redis, or backend process is required.

Before deploying, run `npm run build` and publish the generated `dist/` folder.

## GitHub Pages via GitHub Actions

This repository already includes `.github/workflows/deploy-pages.yml` for free GitHub Pages hosting.

1. Open the repository on GitHub.
2. Go to Settings → Pages.
3. Set the source to GitHub Actions.
4. Push to `main`, or manually run the Deploy GitHub Pages workflow from the Actions tab.

For this repository, GitHub Pages publishes under the project URL:

- `https://devlinduldulao.github.io/ecwid-checkout-geo-flash/`

The Ecwid admin iframe page should therefore be configured as:

- `https://devlinduldulao.github.io/ecwid-checkout-geo-flash/public/index.html`

## GitHub release archive via GitHub Actions

This repository also includes `.github/workflows/release.yml` for downloadable build archives.

1. Create a git tag such as `v0.1.0`.
2. Push the tag to GitHub.
3. Let the Release Artifact workflow run.
4. Download `checkout-geo-flash-ecwid-dist.zip` from the workflow artifact or the GitHub Release page.

This workflow does not publish a website. It packages the built `dist/` output for distribution.

## What must be public

Expose these static files over HTTPS:

- `public/index.html`
- `src/admin/app.js`
- `src/shared/checkout-geo-flash-shared.js`
- `src/storefront/custom-storefront.js`

## Ecwid app setup

Configure your Ecwid app with:

- App page URL: `https://your-static-host.example/public/index.html`
- Scopes: `read_store_profile`, `update_store_profile`, `customize_storefront`

If you open the dashboard from a local file instead of a deployed host, the generated storefront snippet uses `__CGF_STATIC_HOST__` as a reminder token. Replace that token with your deployed static host before pasting the snippet into Ecwid.

The app page runs inside Ecwid admin and receives the install payload there. No separate OAuth callback endpoint is used by this repo.

## Storefront deployment options

### Option 1: App-managed storefront injection

Use this when your Ecwid app injects storefront assets automatically. The storefront script reads the `public` App Storage key through `Ecwid.getAppPublicConfig(appId)`.

### Option 2: Manual JavaScript snippet

Open the admin page, save your config, and copy the generated snippet into:

- Ecwid Control Panel → Design → Custom JavaScript

## Release checklist

1. Run `npm run lint`.
2. Run `npm test`.
3. Deploy the repository to static hosting.
4. Update the Ecwid app page URL to the hosted `public/index.html`.
5. Open the admin page inside Ecwid and save the public config once.
6. Confirm the storefront script can read the public config.

## Limitation to remember

This deployment model is intentionally backend-free. If you later need shared live recent-purchase events for all visitors, you will need to add a lightweight event collector service.
