# Marketplace Assets

This directory contains the marketplace-ready brand assets for Checkout Geo Flash.

## Files

- `icon.png`
- `banner.png`
- `screenshot-dashboard.png`
- `screenshot-preview.png`
- `icon.svg`
- `banner.svg`
- `screenshot-dashboard.svg`
- `screenshot-preview.svg`

## Source of truth

Keep all marketplace-facing artwork in this folder. Do not split generated and source files across separate publishing directories.

## Screenshot workflow

Run the local app and then execute:

```bash
node scripts/capture-marketplace-screenshots.js --base-url http://127.0.0.1:5010
```

This refreshes `screenshot-dashboard.png` and `screenshot-preview.png` from the live dashboard UI.

## Recommended export sizes

- app icon PNG: `256x256`
- banner PNG: `1544x500`
- dashboard screenshot PNG: `1440x1400`
- preview screenshot PNG: `1440x1400`