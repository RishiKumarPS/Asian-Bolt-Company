# Asian Bolt Company — Website

The official responsive, lightweight static website for **Asian Bolt Company** (Bengaluru, Est. 1988) — dealers in retail and wholesale A–Z fasteners, screws, bolts, nuts, anchors, stainless steel hardware, and tools.

---

## Features

- **Zero Build Step**: Pure HTML5, modern CSS, and vanilla ES modules. No Node.js build process, bundlers, or heavy frameworks required.
- **Subpath & Custom Domain Ready**: All assets use strict relative paths (`./css/styles.css`, `./js/main.js`, `./products.js`), ensuring flawless rendering on both root domains (`asianboltcompany.com`) and subpath URLs (`username.github.io/repo-name/`).
- **Local SEO & Schema.org**: Includes Open Graph, Twitter Cards, canonical metadata, and a verified `HardwareStore` JSON-LD entity.
- **WhatsApp Integration**: Instant quote builder with URL-encoded multiline order formatting and one-tap WhatsApp messaging.
- **High Performance & Accessible**: WCAG AA contrast compliance, keyboard focus rings, `prefers-reduced-motion` support, and lightweight SVG icons.

---

## Local Development

Because the site uses ES modules (`<script type="module">`), modern browsers require pages to be served over HTTP/HTTPS rather than opened directly as `file://`.

Run any of the following from the project root:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit [http://localhost:8000](http://localhost:8000) in your browser. If you use VS Code, you can also use the **Live Server** extension.

---

## Free Deployment Options

### Option A: Cloudflare Pages (Recommended)

Cloudflare Pages provides global CDN edge caching, automatic free SSL, and instant continuous deployment with zero bandwidth limits.

#### Method 1: Git Integration (Auto-deploy on push)
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Select your `Asian Bolt Company` repository.
5. In the **Set up builds and deployments** page:
   - **Framework preset**: `None`
   - **Build command**: *(Leave blank)*
   - **Build output directory**: `.` *(or leave blank)*
6. Click **Save and Deploy**. Your site will be live at `https://<project-name>.pages.dev`.

#### Method 2: Direct Upload (No Git required)
1. Go to **Workers & Pages** > **Create application** > **Pages** > **Upload assets**.
2. Give your project a name (e.g. `asian-bolt-company`).
3. Drag and drop the project folder directly into Cloudflare.
4. Click **Deploy site**.

#### Custom Domain on Cloudflare Pages:
1. In your Cloudflare Pages project, go to **Custom domains** > **Set up a custom domain**.
2. Enter your domain (e.g., `asianboltcompany.com` or `www.asianboltcompany.com`) and follow the automated DNS prompts.

---

### Option B: GitHub Pages

GitHub Pages hosts the static site directly from your GitHub repository for free.

1. Create a repository on GitHub (e.g. `asian-bolt-company`) and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Asian Bolt Company website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/asian-bolt-company.git
   git push -u origin main
   ```
2. In your repository on GitHub, go to **Settings** > **Pages** (under "Code and automation" in the left sidebar).
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Click **Save**.
5. Wait ~60 seconds. Your site will be published at:
   ```
   https://<your-username>.github.io/asian-bolt-company/
   ```

*(Note: Thanks to relative `./` asset paths, the site loads correctly even under the repository subpath!)*

#### Custom Domain on GitHub Pages:
1. In GitHub repo **Settings** > **Pages** > **Custom domain**, enter your domain name.
2. In your domain registrar (GoDaddy, Namecheap, Cloudflare DNS, etc.), add an `ALIAS` or `A` record pointing to GitHub Pages IPs:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Check **Enforce HTTPS**.

---

## File Structure

```text
├── index.html          # Main HTML document with SEO & Local Business JSON-LD
├── css/
│   └── styles.css      # Core styles, responsive layouts, scroll animations, focus states
├── js/
│   ├── main.js         # Interactive search, filters, quote drawer, status badge, safe storage
│   └── products.js     # Fastener catalogue data module
├── assets/             # Images and media placeholders
├── .gitignore          # Git exclusion rules
└── README.md           # Deployment documentation
```

---

## License & Attribution

© 2026 Asian Bolt Company. All rights reserved.
