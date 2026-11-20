/**
 * Centralized site configuration, constants, and shared utilities
 * Asian Bolt Company • Dealers in A-Z Fasteners!
 */

export const SITE_CONFIG = {
  name: "Asian Bolt Company",
  phoneLandline: "+918041249376",
  phoneMobile: "+919845219458",
  whatsappNumber: "919845219458",
  email: "asianboltcompany@yahoo.co.in",
  address:
    "No. 11, Jewellers Street, 4th Cross, Off Commercial Street, Shivaji Nagar, Bengaluru, Karnataka 560001",
  storeHours: {
    openDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 = Sun, 1 = Mon, ..., 6 = Sat)
    openMinutes: 630, // 10:30 AM (10 * 60 + 30)
    closeMinutes: 1110, // 6:30 PM (18 * 60 + 30)
    timezone: "Asia/Kolkata",
  },
  quoteStorageKey: "asian-bolt-company-quote-v1",
};

/**
 * Robust LocalStorage wrapper with graceful fallback when cookies/storage are restricted.
 */
export const safeStorage = {
  isAvailable: (() => {
    try {
      if (typeof window === "undefined" || !("localStorage" in window)) {
        return false;
      }
      const testKey = "__abc_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  })(),
  get(key) {
    if (!this.isAvailable) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access restricted:", e);
      return null;
    }
  },
  set(key, value) {
    if (!this.isAvailable) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn("Storage write failed:", e);
      return false;
    }
  },
  // Backward compatibility aliases
  getItem(key) {
    return this.get(key);
  },
  setItem(key, value) {
    return this.set(key, value);
  },
};

/**
 * URL encoding safe for WhatsApp and mailto links.
 */
export const safeEncode = (str) => {
  if (typeof str !== "string") return "";
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
};

/**
 * Builds a direct WhatsApp chat URL with optional pre-filled message.
 */
export const buildWhatsAppUrl = (message = "") => {
  const base = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${safeEncode(message)}`;
};

/**
 * Builds a pre-filled mailto URL with subject and body.
 */
export const buildMailtoUrl = (subject = "", body = "") => {
  const params = [];
  if (subject) params.push(`subject=${safeEncode(subject)}`);
  if (body) params.push(`body=${safeEncode(body)}`);
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${SITE_CONFIG.email}${query}`;
};

/**
 * Escapes unsafe characters for safe DOM insertion.
 */
export const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Debounce function to throttle rapid event firing.
 */
export const debounce = (fn, delay = 150) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Uniform 1.7px stroke custom inline SVGs (48×48 viewBox).
 */
export const ICONS = {
  bolt:
    '<path d="M20 6h8v4h-8z"/>' +
    '<path d="M21 10h6v32h-6z"/>' +
    '<path d="M18 15h12M18 21h12M18 27h12M18 33h12"/>' +
    '<path d="M21 42h6"/>',
  nut:
    '<path d="M24 4 40 13.25v18.5L24 41 8 31.75V13.25Z"/>' +
    '<circle cx="24" cy="22.5" r="7.5"/>',
  washer:
    '<ellipse cx="24" cy="24" rx="17" ry="17"/>' +
    '<ellipse cx="24" cy="24" rx="8" ry="8"/>' +
    '<path d="M14.5 10.5 33.5 37.5" opacity=".18"/>',
  rod:
    '<rect x="18" y="5" width="12" height="38" rx="1"/>' +
    '<path d="M18 13l12-5M18 20l12-5M18 27l12-5M18 34l12-5M18 41l12-5"/>',
  screw:
    '<path d="M20 7h8l-4 6-4-6Z"/>' +
    '<line x1="24" y1="13" x2="24" y2="42"/>' +
    '<path d="M20 19h8M20 25h8M20 31h8M20 37h8"/>' +
    '<circle cx="24" cy="7" r="1.5" fill="currentColor" stroke="none"/>',
  anchor:
    '<path d="M24 10v28"/>' +
    '<path d="M18 10h12"/>' +
    '<path d="M14 38l10-8 10 8"/>' +
    '<circle cx="24" cy="7" r="3"/>',
  "drill-bit":
    '<path d="M24 5v10l-5 5 5 5-5 5 5 5v8"/>' +
    '<path d="M24 5l6 10M24 5l-6 10"/>' +
    '<path d="M19 38h10"/>',
  "allen-key":
    '<path d="M14 8v20h20"/>' +
    '<path d="M14 8h5M34 28v5"/>' +
    '<path d="M14 14l6-6"/>',
  wrench:
    '<path d="M8 36l18-18"/>' +
    '<path d="M30 14a8 8 0 1 1 4 4"/>' +
    '<path d="M26 18l-4-4"/>' +
    '<path d="M6 38l4-4 4 4-4 4z"/>',
};
