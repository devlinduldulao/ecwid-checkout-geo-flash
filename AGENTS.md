# Demo Ecwid Plugin — AI Agent Instructions

> Conventions and patterns for AI coding agents working on this project.
> This file is read automatically by GitHub Copilot, Cursor, Cline, and similar AI assistants.

---

## Project Overview

| Key | Value                                                        |
|-----|--------------------------------------------------------------|
| Plugin Name | demo-ecwid-plugin                                            |
| Platform | Ecwid by Lightspeed (SaaS e-commerce widget)                 |
| Architecture | External app (Express.js) + Storefront JS/CSS + Admin iframe |
| Store API | Ecwid REST API v3                                            |
| Storefront API | Ecwid JavaScript API                                         |
| Auth | OAuth 2.0 (app installs) + API tokens (REST calls)           |
| Runtime | Node.js 24+                                                  |

---

## Documentation

Refer to the complete documentation in the `docs/` folder:

- [API.md](docs/API.md) — Internal API endpoints, authentication, and webhook events
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Platform model, three development surfaces, and security architecture
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — Environment setup, development workflows, and REST API reference
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment options and production checklist

---

## Critical Rules

### 1. Ecwid is a SaaS Widget — NOT a Self-Hosted Platform

- **No server-side rendering** — Ecwid renders its own storefront via a JS widget
- **No database access** — All data via REST API only
- **No PHP/Python templates** — Storefront customisation is CSS + JavaScript
- **No WordPress/Shopify/Magento patterns** — This is NOT WooCommerce, NOT Shopify, NOT Magento

### 2. Three Development Surfaces Only

| Surface | How to Customize |
|---------|-----------------|
| Storefront | CSS + JavaScript API (`Ecwid.OnPageLoaded`, `Ecwid.Cart`, etc.) |
| Server-Side | Express.js + REST API v3 + webhooks |
| Admin Dashboard | HTML/JS iframe with EcwidApp SDK |

### 3. Security Rules

- API tokens in `.env`, never hardcoded
- `client_secret` only used server-side, never in browser code
- Webhook handler validates `storeId` on every request
- CSS scoped to `.ecwid-productBrowser` to prevent style leakage

### 4. Design System & UI/UX (Lightspeed Brand)

Building an Ecwid-native look and feel is the number one priority for this plugin app module. All UI elements must strictly align with the [Lightspeed Brand System](https://brand.lightspeedhq.com/document/170).

- **Logo & Branding:** 
  - Use the monochrome Lightspeed logo (Charcoal gray on light backgrounds, pure white on dark backgrounds).
  - Do not place the logo on Fire Red backgrounds.
  - Maintain standard clearspace (a full flame width for the full logo, half flame width for the standalone Flame).
  - Minimum width constraints: 80px for the logo, 15px for the Flame.
  - Never alter, distort, outline, or add drop shadows to the brandmarks.
- **Accessibility & Contrast:** Always ensure sufficient contrast for legibility, aiming for a WCAG AA pass or better for all UI and text elements.
- **Native Look and Feel:** Ensure your Admin iframe and UI widgets perfectly mirror the styling, padding, and clean minimalism of the Ecwid dashboard.

---

## File Map

| File | Purpose |
|------|---------|
| `src/server/index.js` | Express server entry point |
| `src/server/routes/auth.js` | OAuth 2.0 flow |
| `src/server/routes/products.js` | Product API proxy |
| `src/server/routes/settings.js` | App settings CRUD |
| `src/server/routes/webhooks.js` | Webhook event handler |
| `src/server/services/ecwid-api.js` | Ecwid REST API client (pagination + retry) |
| `src/server/middleware/auth.js` | Auth middleware |
| `src/storefront/custom-storefront.js` | Storefront JS customisations |
| `src/storefront/custom-storefront.css` | Storefront CSS |
| `src/admin/app.js` | Admin dashboard JS |
| `public/index.html` | Admin dashboard HTML (iframe page) |
| `public/storefront-test.html` | Local storefront test page |

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `ecwid-api.js` |
| Variables | camelCase | `storeId` |
| Env vars | SCREAMING_SNAKE_CASE | `ECWID_STORE_ID` |
| Routes | lowercase + hyphens | `/api/products` |
| CSS classes (custom) | BEM-style, prefixed | `.demo-plugin-badge` |
| Webhook events | dot-separated | `order.created` |
| JS API events | PascalCase | `Ecwid.OnPageLoaded` |

---

## Common Mistakes to Avoid

```javascript
// ❌ No database queries — Ecwid has no database access
Product.find({ status: 'active' });          // WRONG
db.query('SELECT * FROM products');          // WRONG

// ❌ No server-side templates
res.render('products/index', { products }); // WRONG

// ❌ No WordPress/WooCommerce/Shopify/Magento patterns
add_action('woocommerce_checkout', fn);      // WRONG
{{ product.title }}                           // WRONG (Liquid)

// ✅ Correct: REST API for data
const products = await ecwid.getProducts();

// ✅ Correct: JS API for storefront
Ecwid.OnPageLoaded.add(function (page) { });

// ✅ Correct: CSS for styling
// .ecwid-productBrowser .grid-product__title { }
```

---

## Testing Requirements

**Every feature or bug fix MUST include unit tests.** No pull request will be accepted without accompanying tests that cover the new or changed behavior.

- Write unit tests for all new features before marking them complete
- Write unit tests for every bug fix that reproduce the bug and verify the fix
- Aim for meaningful coverage — test business logic, edge cases, and error paths
- Use the project's established testing framework and conventions
- Tests must pass in CI before a PR can be merged

---

## PR/Review Checklist

- [ ] API tokens in environment variables (never hardcoded)
- [ ] OAuth flow uses server-side token exchange
- [ ] REST API calls handle pagination correctly
- [ ] Rate limiting / retry logic for 429 responses
- [ ] Webhook endpoint validates request origin (storeId)
- [ ] Storefront JS uses `Ecwid.OnAPILoaded` before accessing API
- [ ] No direct database queries — all data via REST API
- [ ] CSS scoped to `.ecwid-productBrowser`
- [ ] Admin dashboard tested inside Ecwid admin iframe
- [ ] Unit tests included for all new features and bug fixes

## Quality Gates

- After any new feature, bug fix, or refactor, always lint, run build, and run test
- Do not consider the task complete until these checks pass, unless the user explicitly asks not to run them or the environment prevents it
- Every new feature must include automated tests that cover the new behavior, including both happy paths and unhappy paths where practical
- Bug fixes should include a regression test when practical
- Refactors must keep existing tests passing and should add tests if behavior changes or previously untested behavior becomes important