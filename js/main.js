import { products } from "./products.js";

const year = document.querySelector("#current-year");
const menuToggle = document.querySelector("#menu-toggle");
const siteNav = document.querySelector("#site-nav");
const openStatus = document.querySelector("#open-status");
const openStatusText = document.querySelector("#open-status-text");
const copyAddressButton = document.querySelector("#copy-address");
const storeAddress = document.querySelector("#store-address");
const copyToast = document.querySelector("#copy-toast");
const productGrid = document.querySelector("#product-grid");
const productSearch = document.querySelector("#product-search");
const filterButtons = document.querySelectorAll("[data-category-filter]");
const quoteBasket = document.querySelector("#quote-basket");
const basketCount = document.querySelector("#basket-count");
const quoteDrawer = document.querySelector("#quote-drawer");
const quoteBackdrop = document.querySelector("#quote-backdrop");
const quoteDrawerClose = document.querySelector("#quote-drawer-close");
const quoteListItems = document.querySelector("#quote-list-items");
const quoteStorageNotice = document.querySelector("#quote-storage-notice");
const orderTypeInputs = document.querySelectorAll('input[name="quote-order-type"]');
const quoteSpecsInput = document.querySelector("#quote-specs");
const sendQuoteWhatsApp = document.querySelector("#send-quote-whatsapp");
const sendQuoteEmail = document.querySelector("#send-quote-email");
const QUOTE_STORAGE_KEY = "asian-bolt-company-quote-v1";
const WHATSAPP_PHONE = "919845219458";
const productById = new Map(products.map((product) => [product.id, product]));

let quoteItems = new Map();
let quoteOrderType = "retail";
let quoteSpecs = "";
let activeCategory = "all";
let drawerReturnFocus = null;
let copyToastTimer;

/* ── Safe Local Storage Abstraction (handles blocked/private cookies) ── */
const safeStorage = {
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
  getItem(key) {
    if (!this.isAvailable) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access restricted:", e);
      return null;
    }
  },
  setItem(key, value) {
    if (!this.isAvailable) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn("Storage write failed:", e);
      return false;
    }
  },
};

/* ── Custom inline SVG icon markup (uniform 1.7px stroke, 48×48 viewBox) ── */
const productIconMarkup = {
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

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const setMobileNavOpen = (isOpen) => {
  if (!menuToggle || !siteNav) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  siteNav.classList.toggle("is-open", isOpen);
};

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    setMobileNavOpen(!isExpanded);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMobileNavOpen(false);
    }
  });
}

if (openStatus && openStatusText) {
  const updateStoreStatus = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const currentMinutes = Number(values.hour) * 60 + Number(values.minute);
    const isOpen =
      values.weekday !== "Sun" &&
      currentMinutes >= 10 * 60 + 30 &&
      currentMinutes < 18 * 60 + 30;

    openStatusText.textContent = isOpen
      ? "Open Now • Closes at 6:30 PM"
      : "Closed • Opens Mon–Sat 10:30 AM";
    openStatus.classList.toggle("is-open", isOpen);
    openStatus.classList.toggle("is-closed", !isOpen);
  };

  updateStoreStatus();
  window.setInterval(updateStoreStatus, 60_000);
}

const showCopyToast = (message, isError = false) => {
  if (!copyToast) {
    return;
  }

  window.clearTimeout(copyToastTimer);
  copyToast.textContent = message;
  copyToast.classList.toggle("is-error", isError);
  copyToast.classList.add("is-visible");
  copyToast.setAttribute("aria-hidden", "false");
  copyToastTimer = window.setTimeout(() => {
    copyToast.classList.remove("is-visible");
    copyToast.setAttribute("aria-hidden", "true");
  }, 2200);
};

if (copyAddressButton && storeAddress) {
  copyAddressButton.addEventListener("click", async () => {
    const address = storeAddress.innerText.replace(/\s+/g, " ").trim();

    try {
      await navigator.clipboard.writeText(address);
      showCopyToast("Copied to clipboard!");
    } catch (error) {
      showCopyToast("Could not copy address. Please select and copy manually.", true);
      console.error("Unable to copy the store address.", error);
    }
  });
}

const showQuoteStorageNotice = (message) => {
  if (quoteStorageNotice) {
    quoteStorageNotice.textContent = message;
  }
};

const loadQuoteState = () => {
  if (!safeStorage.isAvailable) {
    showQuoteStorageNotice("Note: Browser storage is disabled. Quote items will be kept for this session only.");
    return;
  }

  try {
    const savedState = safeStorage.getItem(QUOTE_STORAGE_KEY);
    if (!savedState) {
      return;
    }

    const parsedState = JSON.parse(savedState);
    if (!parsedState || !Array.isArray(parsedState.items)) {
      throw new TypeError("Saved quote data is not in the expected format.");
    }

    quoteItems = new Map(
      parsedState.items
        .filter((item) => item && productById.has(item.productId))
        .map((item) => [
          item.productId,
          { quantityNote: typeof item.quantityNote === "string" ? item.quantityNote : "" },
        ]),
    );
    if (parsedState.orderType === "wholesale" || parsedState.orderType === "retail") {
      quoteOrderType = parsedState.orderType;
    }
    if (typeof parsedState.specs === "string") {
      quoteSpecs = parsedState.specs;
    }
  } catch (error) {
    showQuoteStorageNotice("Your previous quote list could not be restored.");
    console.error("Unable to parse quote list from storage.", error);
  }
};

const saveQuoteState = (nextItems, nextOrderType, nextSpecs) => {
  const success = safeStorage.setItem(
    QUOTE_STORAGE_KEY,
    JSON.stringify({
      items: [...nextItems].map(([productId, item]) => ({
        productId,
        quantityNote: item.quantityNote,
      })),
      orderType: nextOrderType,
      specs: nextSpecs,
    }),
  );

  if (!success && !safeStorage.isAvailable) {
    showQuoteStorageNotice("Quote changes are kept for this session only (storage restricted).");
  } else if (quoteStorageNotice && success) {
    quoteStorageNotice.textContent = "";
  }

  quoteItems = nextItems;
  quoteOrderType = nextOrderType;
  quoteSpecs = nextSpecs;
};

/* ── Edge-case safe URL encoding for WhatsApp messages ── */
const safeEncodeForUrl = (str) => {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
};

const buildQuoteMessage = () => {
  const itemLines = [];
  quoteItems.forEach((item, productId) => {
    const product = productById.get(productId);
    if (!product) return;
    const note = (item.quantityNote || "").trim();
    itemLines.push(`• ${product.name}\n  Quantity / notes: ${note || "Not specified"}`);
  });

  const lines = [
    "Hello Asian Bolt Company,",
    "Please share a quote for:",
    "",
    `Order type: ${quoteOrderType === "retail" ? "Retail (Small Qty)" : "Wholesale / Bulk B2B"}`,
    "",
    ...(itemLines.length > 0 ? itemLines : ["(No products selected)"]),
    "",
    `Custom specifications: ${quoteSpecs.trim() || "None provided"}`,
  ];

  return lines.join("\n");
};

const updateQuoteSendLinks = () => {
  const hasItems = quoteItems.size > 0;
  const message = buildQuoteMessage();
  const encodedMessage = safeEncodeForUrl(message);

  if (sendQuoteWhatsApp) {
    sendQuoteWhatsApp.hidden = !hasItems;
    sendQuoteWhatsApp.href = hasItems
      ? `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`
      : `https://wa.me/${WHATSAPP_PHONE}`;
  }
  if (sendQuoteEmail) {
    sendQuoteEmail.hidden = !hasItems;
    sendQuoteEmail.href = hasItems
      ? `mailto:asianboltcompany@yahoo.co.in?subject=${safeEncodeForUrl("Quote Request - Asian Bolt Company")}&body=${encodedMessage}`
      : "mailto:asianboltcompany@yahoo.co.in";
  }
};

loadQuoteState();

if (productGrid && productSearch) {
  const createProductCard = (product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const top = document.createElement("div");
    top.className = "product-card__top";

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("product-card__icon");
    icon.setAttribute("viewBox", "0 0 48 48");
    icon.setAttribute("fill", "none");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = productIconMarkup[product.icon] || productIconMarkup.bolt;

    const category = document.createElement("span");
    category.className = "product-card__category";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.className = "product-card__title";
    title.textContent = product.name;

    const description = document.createElement("p");
    description.className = "product-card__description";
    description.textContent = product.description;
    description.title = product.description;

    const addButton = document.createElement("button");
    addButton.className = "product-card__quote";
    addButton.type = "button";
    addButton.dataset.quoteToggle = product.id;
    const isAdded = quoteItems.has(product.id);
    addButton.setAttribute("aria-pressed", String(isAdded));
    addButton.setAttribute("aria-label", isAdded ? `Remove ${product.name} from quote` : `Add ${product.name} to quote`);
    addButton.textContent = isAdded ? "Added to Quote" : "+ Add to Quote";
    addButton.classList.toggle("is-added", isAdded);

    top.append(icon, category);
    card.append(top, title, description, addButton);
    return card;
  };

  const renderProducts = () => {
    const query = productSearch.value.trim().toLocaleLowerCase();
    const visibleProducts = products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const searchableText = `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase();
      return matchesCategory && searchableText.includes(query);
    });

    productGrid.replaceChildren();

    if (visibleProducts.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "product-grid__empty";
      emptyState.append("Looking for a specialized fastener? ");

      const whatsappLink = document.createElement("a");
      whatsappLink.href = `https://wa.me/${WHATSAPP_PHONE}?text=${safeEncodeForUrl(`Hello Asian Bolt Company, I am looking for: ${productSearch.value.trim()}`)}`;
      whatsappLink.target = "_blank";
      whatsappLink.rel = "noopener noreferrer";
      whatsappLink.textContent = "Ask us directly on WhatsApp";
      emptyState.append(whatsappLink, ".");
      productGrid.append(emptyState);
      return;
    }

    productGrid.append(...visibleProducts.map(createProductCard));
  };

  const updateQuoteBasket = () => {
    if (!quoteBasket || !basketCount) {
      return;
    }

    const count = quoteItems.size;
    basketCount.textContent = String(count);
    quoteBasket.hidden = count === 0;
    quoteBasket.setAttribute(
      "aria-label",
      `Quote basket, ${count} ${count === 1 ? "item" : "items"}`,
    );
    updateQuoteSendLinks();
  };

  const renderQuoteDrawer = () => {
    if (!quoteListItems) {
      return;
    }

    quoteListItems.replaceChildren();
    if (quoteItems.size === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "quote-drawer__empty";
      emptyState.textContent = "Your quote list is empty. Add products to start a request.";
      quoteListItems.append(emptyState);
    } else {
      quoteItems.forEach((item, productId) => {
        const product = productById.get(productId);
        if (!product) {
          return;
        }

        const row = document.createElement("article");
        row.className = "quote-line-item";

        const header = document.createElement("div");
        header.className = "quote-line-item__header";

        const titleGroup = document.createElement("div");
        const title = document.createElement("h3");
        title.className = "quote-line-item__title";
        title.textContent = product.name;
        const category = document.createElement("span");
        category.className = "quote-line-item__category";
        category.textContent = product.category;
        titleGroup.append(title, category);

        const removeButton = document.createElement("button");
        removeButton.className = "quote-line-item__remove";
        removeButton.type = "button";
        removeButton.dataset.removeQuote = productId;
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${product.name} from quote`);

        const noteLabel = document.createElement("label");
        noteLabel.className = "quote-line-item__label";
        noteLabel.htmlFor = `quote-note-${productId}`;
        noteLabel.append("Quantity or notes");

        const noteInput = document.createElement("textarea");
        noteInput.className = "quote-line-item__note";
        noteInput.id = `quote-note-${productId}`;
        noteInput.dataset.quoteNote = productId;
        noteInput.rows = 2;
        noteInput.value = item.quantityNote;
        noteInput.placeholder = "e.g. quantity, size, or delivery note";
        noteLabel.append(noteInput);
        header.append(titleGroup, removeButton);
        row.append(header, noteLabel);
        quoteListItems.append(row);
      });
    }

    orderTypeInputs.forEach((input) => {
      input.checked = input.value === quoteOrderType;
    });
    if (quoteSpecsInput) {
      quoteSpecsInput.value = quoteSpecs;
    }
    updateQuoteSendLinks();
  };

  /* ── Open / Close with bulletproof scroll lock & focus trap ── */
  const openQuoteDrawer = () => {
    if (!quoteDrawer || !quoteBackdrop) {
      return;
    }

    drawerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    renderQuoteDrawer();
    quoteDrawer.classList.add("is-open");
    quoteDrawer.setAttribute("aria-hidden", "false");
    quoteBackdrop.classList.add("is-open");
    quoteBackdrop.setAttribute("aria-hidden", "false");

    // Lock body and html scroll
    document.documentElement.classList.add("quote-drawer-open");
    document.body.classList.add("quote-drawer-open");

    window.setTimeout(() => quoteDrawerClose?.focus(), 50);
  };

  const closeQuoteDrawer = () => {
    if (!quoteDrawer || !quoteBackdrop || !quoteDrawer.classList.contains("is-open")) {
      return;
    }

    quoteDrawer.classList.remove("is-open");
    quoteDrawer.setAttribute("aria-hidden", "true");
    quoteBackdrop.classList.remove("is-open");
    quoteBackdrop.setAttribute("aria-hidden", "true");

    // Unlock body and html scroll
    document.documentElement.classList.remove("quote-drawer-open");
    document.body.classList.remove("quote-drawer-open");

    // Restore focus safely
    if (
      drawerReturnFocus instanceof HTMLElement &&
      document.contains(drawerReturnFocus) &&
      !drawerReturnFocus.hidden &&
      drawerReturnFocus.offsetParent !== null
    ) {
      drawerReturnFocus.focus();
    } else if (quoteBasket && !quoteBasket.hidden) {
      quoteBasket.focus();
    } else if (productSearch instanceof HTMLElement) {
      productSearch.focus();
    }
    drawerReturnFocus = null;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.categoryFilter ?? "all";
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });
      renderProducts();
    });
  });

  productSearch.addEventListener("input", renderProducts);

  productGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest("[data-quote-toggle]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const productId = button.dataset.quoteToggle;
    if (!productId) {
      return;
    }

    const nextItems = new Map(quoteItems);
    if (nextItems.has(productId)) {
      nextItems.delete(productId);
    } else {
      nextItems.set(productId, { quantityNote: "" });
    }
    saveQuoteState(nextItems, quoteOrderType, quoteSpecs);

    const isAdded = quoteItems.has(productId);
    const product = productById.get(productId);
    const prodName = product ? product.name : "Product";
    button.classList.toggle("is-added", isAdded);
    button.setAttribute("aria-pressed", String(isAdded));
    button.setAttribute("aria-label", isAdded ? `Remove ${prodName} from quote` : `Add ${prodName} to quote`);
    button.textContent = isAdded ? "Added to Quote" : "+ Add to Quote";
    updateQuoteBasket();
    renderQuoteDrawer();
  });

  quoteBasket?.addEventListener("click", openQuoteDrawer);
  quoteDrawerClose?.addEventListener("click", closeQuoteDrawer);
  quoteBackdrop?.addEventListener("click", closeQuoteDrawer);

  // Prevent background touch scrolling on the backdrop
  quoteBackdrop?.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  quoteListItems?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const removeButton = event.target.closest("[data-remove-quote]");
    if (!(removeButton instanceof HTMLButtonElement)) {
      return;
    }

    const productId = removeButton.dataset.removeQuote;
    if (!productId || !quoteItems.has(productId)) {
      return;
    }

    const removedIndex = [...quoteItems.keys()].indexOf(productId);
    const nextItems = new Map(quoteItems);
    nextItems.delete(productId);
    saveQuoteState(nextItems, quoteOrderType, quoteSpecs);
    updateQuoteBasket();
    renderQuoteDrawer();

    const remainingButtons = quoteListItems.querySelectorAll("[data-remove-quote]");
    const nextTarget = remainingButtons[Math.min(removedIndex, remainingButtons.length - 1)];
    (nextTarget ?? quoteDrawerClose)?.focus();

    productGrid
      .querySelectorAll(`[data-quote-toggle="${productId}"]`)
      .forEach((productButton) => {
        productButton.classList.remove("is-added");
        productButton.setAttribute("aria-pressed", "false");
        const product = productById.get(productId);
        productButton.setAttribute("aria-label", `Add ${product ? product.name : "Product"} to quote`);
        productButton.textContent = "+ Add to Quote";
      });
  });

  quoteListItems?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLTextAreaElement) || !event.target.dataset.quoteNote) {
      return;
    }

    const productId = event.target.dataset.quoteNote;
    const nextItems = new Map(quoteItems);
    nextItems.set(productId, { quantityNote: event.target.value });
    saveQuoteState(nextItems, quoteOrderType, quoteSpecs);
    updateQuoteSendLinks();
  });

  orderTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        saveQuoteState(quoteItems, input.value, quoteSpecs);
        updateQuoteSendLinks();
      }
    });
  });

  quoteSpecsInput?.addEventListener("change", () => {
    saveQuoteState(quoteItems, quoteOrderType, quoteSpecsInput.value);
    updateQuoteSendLinks();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (quoteDrawer?.classList.contains("is-open")) {
        closeQuoteDrawer();
      } else if (menuToggle?.getAttribute("aria-expanded") === "true") {
        setMobileNavOpen(false);
      }
      return;
    }

    if (event.key !== "Tab" || !quoteDrawer?.classList.contains("is-open")) {
      return;
    }

    // Accessible focus trapping inside the open quote drawer
    const focusableElements = Array.from(
      quoteDrawer.querySelectorAll(
        'a[href]:not([hidden]), button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden])',
      ),
    ).filter((el) => el instanceof HTMLElement && el.offsetParent !== null);

    if (focusableElements.length === 0) {
      event.preventDefault();
      quoteDrawer.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  renderProducts();
  updateQuoteBasket();
  renderQuoteDrawer();
}

/* ── Scroll-reveal with IntersectionObserver ────────────────────── */
(() => {
  /* Respect prefers-reduced-motion: skip all reveal animations */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();
