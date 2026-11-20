# Asian Bolt Company — Official Website

> **Live Production URL:** [https://asianbolt-company.web.app/](https://asianbolt-company.web.app/)

A high-performance, zero-framework static website (HTML5, modern CSS3, vanilla ES6 JavaScript) for **Asian Bolt Company** (Est. 1988, Shivaji Nagar, Bengaluru). Designed with a Modern Industrial Pragmatism aesthetic, the site caters equally to walk-in retail DIY customers, trade contractors, and bulk B2B industrial procurement teams with zero backend maintenance or hosting costs.

---

## Key Features

- **Filterable & Searchable A–Z Fastener Catalog**: Instant client-side search and category filtering across screws, bolts, nuts, washers, stainless steel (SS 304/316), high-tensile, and anchor fasteners.
- **Zero-Backend Quote Basket Drawer**: Persistent client-side selection (`localStorage`) allowing buyers to build custom item lists and generate pre-formatted quote inquiries in one tap via WhatsApp or Email.
- **"Not Sure of the Size? Send a Photo" Callout**: High-contrast helper banner guiding customers to snap a photo of their fastener next to a coin or ruler for instant WhatsApp thread and gauge identification.
- **Sticky Mobile Bottom Action Bar**: Quick-access touch bar on mobile viewports for one-tap calling (`tel:`), Google Maps directions, and direct WhatsApp messaging.
- **Live Bengaluru (IST) Store Status**: Real-time business hours badge checking Asia/Kolkata timezone to display current Open/Closed status (Monday–Saturday, 10:30 AM – 6:30 PM IST).
- **Verified Google Reviews Trust Strip**: Compact 4.2 ★ social proof badge linking directly to verified Google reviews.
- **Lazy-Loaded Google Maps**: Interactive store locator iframe embedded with `loading="lazy"` and `referrerpolicy="no-referrer-when-downgrade"`.
- **SEO & Performance Built-in**: Full Schema.org `HardwareStore` JSON-LD structured data, canonical URLs, `robots.txt`, `sitemap.xml`, branded SVG favicon, Open Graph preview banner (`1200x630`), CSS `content-visibility: auto`, and edge caching headers.

---

## Tech Stack & Design Tokens

- **Core Technologies**: Pure HTML5, Modern CSS3 (custom properties, CSS grid/flexbox), Vanilla ES6 Modules (no npm build steps, zero client-side dependencies).
- **Color Palette**:
  - `Dark Espresso`: `#2B1E16` (Primary dark surface, text, hero background)
  - `Safety Yellow`: `#F5D033` / `#F5D042` (Primary CTAs, accents, focus rings)
  - `Concrete Gray / Off-White`: `#F4F4F4` / `#FFFFFF` (Page background, cards)
  - `Umber & Steel`: `#5C4E3C` / `#6B6B6B` (Secondary text, borders, iconography)
- **Typography**:
  - Headings: `Barlow Condensed` (weights: 700, 800)
  - Body: `Inter` (weights: 300, 400, 500, 600)

---

## Project Structure

```
Asian Bolt Company/
├── .firebaserc                          # Firebase project configuration (asianbolt-company)
├── .gitignore                           # Git ignore rules
├── .github/
│   ├── copilot-instructions.md          # Workspace rules & coding conventions
│   └── workflows/
│       ├── firebase-hosting-merge.yml   # Auto-deployment on push to main branch
│       └── firebase-hosting-pull-request.yml # Preview channel deploy for PRs
├── 404.html                             # Custom branded 404 error page
├── assets/
│   ├── .gitkeep                         # Preserves assets directory
│   ├── favicon.svg                      # Branded hex bolt SVG favicon
│   ├── og-preview.png                   # WhatsApp / Open Graph social preview (1200x630 PNG)
│   └── og-preview.svg                   # Source vector graphic for social banner
├── css/
│   └── styles.css                       # Consolidated stylesheet (tokens, responsive layout, animations)
├── firebase.json                        # Firebase Hosting routing, ignore lists & cache headers
├── google4b4248c2bab43b7f.html          # Google Search Console HTML verification file
├── index.html                           # Single-page semantic website & JSON-LD metadata
├── js/
│   ├── config.js                        # Centralized business constants & helper utilities
│   ├── main.js                          # Core application logic (drawer, search, status, animations)
│   └── products.js                      # Fastener product catalogue data
├── README.md                            # Project documentation & maintenance guide
├── robots.txt                           # Search engine crawling directives
└── sitemap.xml                          # Canonical XML sitemap for Google Search Console
```

---

## Local Development

Because JavaScript is organized into native ES6 modules (`import` / `export`), opening `index.html` directly via the `file://` protocol will trigger browser CORS restrictions. Always run a lightweight local HTTP server:

### Option 1: VS Code Live Server

Right-click `index.html` in VS Code and select **"Open with Live Server"**.

### Option 2: Node.js `npx serve`

Run from the project root:

```bash
npx serve .
```

Then visit `http://localhost:3000` (or the URL displayed in the terminal).

### Option 3: Python 3

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Common Updates (Quick Maintenance Guide)

### 1. Business Phone, Hours, Address, or WhatsApp

- Update constants in `js/config.js` (`SITE_CONFIG`).
- Update matching entries in `index.html`:
  - Contact links in the `<header>`, `#visit`, and `.mobile-action-bar` sections.
  - Schema.org JSON-LD `<script type="application/ld+json">` block in `<head>`.

### 2. Adding or Editing Catalog Products

- Open `js/products.js` and add/edit objects in the `products` array:
  ```javascript
  {
    id: "your-product-id",
    name: "Product Name",
    category: "Screws", // Screws | Fasteners | Stainless Steel | Anchors & Fixings | Tools
    description: "Brief spec description...",
    icon: "bolt" // bolt | screw | nut | washer | drill | wrench
  }
  ```

### 3. Cache Invalidation

- When making substantial updates to `css/styles.css` or `js/main.js`, bump the query string version in `index.html` (e.g., `?v=3` → `?v=4`):
  ```html
  <link rel="stylesheet" href="./css/styles.css?v=4" />
  <script type="module" src="./js/main.js?v=4"></script>
  ```

---

## Deployment (Firebase Hosting & GitHub Actions)

### Automatic Deployment

Pushing commits to the `main` branch automatically deploys to live Firebase Hosting via `.github/workflows/firebase-hosting-merge.yml`:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

### Manual Deployment

If Firebase CLI is installed locally:

```bash
firebase deploy --only hosting
```

### Hosting & Caching Configuration (`firebase.json`)

- **HTML / CSS / JS**: Served with `Cache-Control: public, max-age=0, must-revalidate` so code updates propagate to users immediately without stale-cache issues.
- **Assets (`assets/**`)**: Served with `Cache-Control: public, max-age=2592000` (30 days) for optimized static caching.
- **Security Headers**: All routes send `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Ignored Files**: `README.md`, `firebase.json`, hidden files, and development files are excluded from hosting uploads.

---
