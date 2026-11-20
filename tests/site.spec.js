import { test, expect } from '@playwright/test';

// Helper to attach error listeners ignoring external 3rd-party frames (e.g. Google Maps)
function setupErrorListeners(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedLocalRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known third-party sandbox/maps issues if external
      if (text.includes('google.com') || text.includes('gstatic.com')) return;
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('response', (response) => {
    const url = response.url();
    // Only monitor local origin requests
    if (url.startsWith('http://localhost:4173') && response.status() >= 400) {
      // 404 test will legitimately request /404.html or not found paths
      failedLocalRequests.push({ url, status: response.status() });
    }
  });

  return { consoleErrors, pageErrors, failedLocalRequests };
}

test.describe('1. Zero Errors & Asset Integrity', () => {
  test('Homepage loads with zero console/page errors and clean local asset responses', async ({ page }) => {
    const { consoleErrors, pageErrors, failedLocalRequests } = setupErrorListeners(page);

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Wait for JS hydration and network idle
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
  });

  test('Critical static assets exist and return HTTP 200', async ({ request }) => {
    const assets = [
      '/assets/favicon.svg',
      '/assets/og-preview.png',
      '/assets/og-preview.svg',
      '/robots.txt',
      '/sitemap.xml',
      '/css/styles.css',
      '/js/config.js',
      '/js/main.js',
      '/js/products.js',
    ];

    for (const asset of assets) {
      const res = await request.get(asset);
      expect(res.status(), `Asset ${asset} should return 200`).toBe(200);
    }
  });

  test('404 page loads cleanly with zero console/page errors', async ({ page }) => {
    const { consoleErrors, pageErrors } = setupErrorListeners(page);

    const response = await page.goto('/404.html');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

test.describe('2. Layout, Visibility & Responsive Integrity', () => {
  test('No horizontal scrollbar/overflow on homepage and 404 page', async ({ page }) => {
    for (const path of ['/', '/404.html']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(isOverflowing, `Page ${path} should not have horizontal overflow`).toBe(false);
    }
  });

  test('All main sections are visible and reveal smoothly on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sections = [
      '#home',
      '#about',
      '#brands',
      '#products',
      '#services',
      '#reviews',
      '#visit',
      '.site-footer',
    ];

    for (const selector of sections) {
      const el = page.locator(selector);
      await expect(el).toBeAttached();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300); // Allow intersection observer to trigger

      // Section should either have class 'is-visible' or be fully opaque
      const opacity = await el.evaluate((node) => {
        return window.getComputedStyle(node).opacity;
      });
      expect(parseFloat(opacity)).toBeGreaterThan(0);
    }
  });

  test('Sticky mobile bottom action bar responds to viewport width', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bar = page.locator('.mobile-action-bar');
    if (isMobile) {
      await expect(bar).toBeVisible();
      await expect(bar.locator('a[href^="tel:"]')).toBeVisible();
      await expect(bar.locator('a[href*="maps"]')).toBeVisible();
      await expect(bar.locator('a[href*="wa.me"]')).toBeVisible();
    } else {
      await expect(bar).toBeHidden();
    }
  });
});

test.describe('3. Catalog, Search & Quote Basket End-to-End', () => {
  test('Product catalog renders, filters, searches, and persists quote in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Products render
    const cards = page.locator('.product-card');
    await expect(cards.first()).toBeVisible();
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(5);

    // 2. Category filtering
    const screwsPill = page.locator('.filter-pill[data-category-filter="Screws"]');
    await screwsPill.click();
    await page.waitForTimeout(100);

    const filteredCards = page.locator('.product-card');
    const screwsCount = await filteredCards.count();
    expect(screwsCount).toBeGreaterThan(0);
    expect(screwsCount).toBeLessThan(initialCount);

    // Click "All" to reset
    await page.locator('.filter-pill[data-category-filter="all"]').click();
    await page.waitForTimeout(100);
    expect(await cards.count()).toBe(initialCount);

    // 3. Search input
    const searchInput = page.locator('#product-search');
    await searchInput.fill('xyznonsensequery123');
    await page.waitForTimeout(250); // debounce
    await expect(page.locator('.product-grid__empty')).toBeVisible();

    await searchInput.fill('');
    await page.waitForTimeout(250);
    await expect(cards.first()).toBeVisible();

    // 4. Add 2 products to quote basket
    const quoteButtons = page.locator('.product-card__quote');
    await quoteButtons.nth(0).click();
    await quoteButtons.nth(1).click();

    // Verify counter badge updates to 2
    const basketBtn = page.locator('#quote-basket');
    await expect(basketBtn).toBeVisible();
    await expect(page.locator('#basket-count')).toHaveText('2');

    // Open drawer
    await basketBtn.click();
    const drawer = page.locator('#quote-drawer');
    await expect(drawer).toHaveClass(/is-open/);

    const lineItems = page.locator('.quote-line-item');
    await expect(lineItems).toHaveCount(2);

    // 5. Reload and test localStorage persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#quote-basket')).toBeVisible();
    await expect(page.locator('#basket-count')).toHaveText('2');

    await page.locator('#quote-basket').click();
    await expect(page.locator('.quote-line-item')).toHaveCount(2);

    // 6. Order type and custom specs
    const wholesaleRadio = page.locator('input[name="quote-order-type"][value="wholesale"]');
    await wholesaleRadio.check();

    const specsTextarea = page.locator('#quote-specs');
    await specsTextarea.fill('Grade SS 316, 500 pcs');

    // 7. WhatsApp and Email link generation
    const waLink = page.locator('#send-quote-whatsapp');
    const waHref = await waLink.getAttribute('href');
    expect(waHref).toContain('https://wa.me/919845219458');
    expect(waHref?.toLowerCase()).toContain('wholesale');
    expect(waHref).toContain('SS%20316');

    const emailLink = page.locator('#send-quote-email');
    const emailHref = await emailLink.getAttribute('href');
    expect(emailHref).toContain('mailto:asianboltcompany@yahoo.co.in');
    expect(emailHref?.toLowerCase()).toContain('wholesale');
    expect(emailHref).toContain('SS%20316');

    // 8. Remove one item
    await page.locator('.quote-line-item__remove').first().click();
    await expect(page.locator('.quote-line-item')).toHaveCount(1);
    await expect(page.locator('#basket-count')).toHaveText('1');

    // 9. Close drawer with Escape
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/is-open/);
  });
});

test.describe('4. Store Utilities, SEO & Lazy-Loading', () => {
  test('Live Bengaluru store status and copy address utility work cleanly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Live status badge has non-empty text
    const statusText = page.locator('#open-status-text');
    await expect(statusText).not.toBeEmpty();

    // Click "Copy Address" button
    const copyBtn = page.locator('#copy-address');
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      // Ensure copy-toast displays
      const toast = page.locator('#copy-toast');
      await expect(toast).toBeVisible();
    }
  });

  test('Google Maps iframe is configured for lazy-loading and accessibility', async ({ page }) => {
    await page.goto('/');
    const iframe = page.locator('.visit__map iframe');
    await expect(iframe).toBeAttached();
    expect(await iframe.getAttribute('loading')).toBe('lazy');
    expect(await iframe.getAttribute('referrerpolicy')).toBe('no-referrer-when-downgrade');
    const title = await iframe.getAttribute('title');
    expect(title && title.length > 5).toBe(true);
  });

  test('Homepage SEO: single h1, valid JSON-LD, canonical, and OG tags', async ({ page }) => {
    await page.goto('/');

    // Exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Canonical link
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://asianbolt-company.web.app/');

    // OG Image
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBe('https://asianbolt-company.web.app/assets/og-preview.png');

    // Valid JSON-LD
    const jsonLdContent = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdContent).toBeTruthy();
    const data = JSON.parse(jsonLdContent || '{}');
    expect(data['@type']).toBe('HardwareStore');
    expect(data.url).toBe('https://asianbolt-company.web.app/');
    expect(data.name).toBe('Asian Bolt Company');
  });

  test('404 Page SEO & Navigation: robots noindex, root-relative assets, and back links', async ({ page }) => {
    await page.goto('/404.html');

    // Robots meta
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('noindex, nofollow');

    // Title
    await expect(page).toHaveTitle('404 — Page Not Found | Asian Bolt Company');

    // Root-relative asset paths check (no ./ in href or src)
    const hasDotSlash = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('link[href], script[src], a[href], img[src]'));
      return elements.some((el) => {
        const val = el.getAttribute('href') || el.getAttribute('src');
        return val && val.startsWith('./');
      });
    });
    expect(hasDotSlash, '404 page should not contain ./ relative paths').toBe(false);

    // Working link back to homepage
    const homeBtn = page.locator('.error-page__actions a[href="/"]');
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();
    await expect(page).toHaveURL('http://localhost:4173/');
  });
});
