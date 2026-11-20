import { products } from "./products.js";
import {
  SITE_CONFIG,
  safeStorage,
  buildWhatsAppUrl,
  buildMailtoUrl,
  debounce,
  ICONS,
} from "./config.js";

// DOM References
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

// Lookup map for fast product resolution
const productById = new Map(products.map((product) => [product.id, product]));

// State
let quoteItems = new Map();
let quoteOrderType = "retail";
let quoteSpecs = "";
let activeCategory = "all";
let drawerReturnFocus = null;
let copyToastTimer = null;

// Dynamic copyright year
if (year) {
  year.textContent = String(new Date().getFullYear());
}

/* ── Mobile Navigation Toggle ── */
const setMobileNavOpen = (isOpen) => {
  if (!menuToggle || !siteNav) return;
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

/* ── Live Store Status (Bengaluru IST) ── */
if (openStatus && openStatusText) {
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  const updateStoreStatus = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: SITE_CONFIG.storeHours.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const currentMinutes = Number(values.hour) * 60 + Number(values.minute);
    const currentDay = dayMap[values.weekday];

    const isOpen =
      SITE_CONFIG.storeHours.openDays.includes(currentDay) &&
      currentMinutes >= SITE_CONFIG.storeHours.openMinutes &&
      currentMinutes < SITE_CONFIG.storeHours.closeMinutes;

    openStatusText.textContent = isOpen
      ? "Open Now • Closes at 6:30 PM"
      : "Closed • Opens Mon–Sat 10:30 AM";
    openStatus.classList.toggle("is-open", isOpen);
    openStatus.classList.toggle("is-closed", !isOpen);
  };

  updateStoreStatus();
  window.setInterval(updateStoreStatus, 60_000);
}

/* ── Toast Helper ── */
const showCopyToast = (message, isError = false) => {
  if (!copyToast) return;
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

/* ── Copy Store Address ── */
if (copyAddressButton && storeAddress) {
  copyAddressButton.addEventListener("click", async () => {
    const address = storeAddress.innerText.replace(/\s+/g, " ").trim();
    try {
      await navigator.clipboard.writeText(address);
      showCopyToast("Copied to clipboard!");
    } catch (error) {
      showCopyToast("Could not copy address. Please select and copy manually.", true);
      console.error("Unable to copy store address:", error);
    }
  });
}

/* ── Quote Persistence & State ── */
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
    const savedState = safeStorage.get(SITE_CONFIG.quoteStorageKey);
    if (!savedState) return;

    const parsedState = JSON.parse(savedState);
    if (!parsedState || !Array.isArray(parsedState.items)) {
      throw new TypeError("Saved quote data is not in expected format.");
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
    console.error("Unable to parse quote list from storage:", error);
  }
};

const saveQuoteState = (nextItems, nextOrderType, nextSpecs) => {
  const success = safeStorage.set(
    SITE_CONFIG.quoteStorageKey,
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

/* ── Build Formatted Quote Message ── */
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

  if (sendQuoteWhatsApp) {
    sendQuoteWhatsApp.hidden = !hasItems;
    sendQuoteWhatsApp.href = hasItems
      ? buildWhatsAppUrl(message)
      : buildWhatsAppUrl();
  }
  if (sendQuoteEmail) {
    sendQuoteEmail.hidden = !hasItems;
    sendQuoteEmail.href = hasItems
      ? buildMailtoUrl("Quote Request - Asian Bolt Company", message)
      : `mailto:${SITE_CONFIG.email}`;
  }
};

loadQuoteState();

/* ── Product Catalogue & Drawer Interaction ── */
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
    icon.innerHTML = ICONS[product.icon] || ICONS.bolt;

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
      whatsappLink.href = buildWhatsAppUrl(`Hello Asian Bolt Company, I am looking for: ${productSearch.value.trim()}`);
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
    if (!quoteBasket || !basketCount) return;
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
    if (!quoteListItems) return;
    quoteListItems.replaceChildren();

    if (quoteItems.size === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "quote-drawer__empty";
      emptyState.textContent = "Your quote list is empty. Add products to start a request.";
      quoteListItems.append(emptyState);
    } else {
      quoteItems.forEach((item, productId) => {
        const product = productById.get(productId);
        if (!product) return;

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

  /* ── Open / Close with Scroll Lock & Focus Trap ── */
  const openQuoteDrawer = () => {
    if (!quoteDrawer || !quoteBackdrop) return;
    drawerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    renderQuoteDrawer();
    quoteDrawer.classList.add("is-open");
    quoteDrawer.setAttribute("aria-hidden", "false");
    quoteBackdrop.classList.add("is-open");
    quoteBackdrop.setAttribute("aria-hidden", "false");

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

    document.documentElement.classList.remove("quote-drawer-open");
    document.body.classList.remove("quote-drawer-open");

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

  /* ── Filter Pills ── */
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

  /* ── Debounced Search ── */
  productSearch.addEventListener("input", debounce(renderProducts, 150));

  /* ── Delegated Click Handler on Product Grid ── */
  productGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-quote-toggle]");
    if (!(button instanceof HTMLButtonElement)) return;

    const productId = button.dataset.quoteToggle;
    if (!productId) return;

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

  quoteBackdrop?.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  /* ── Delegated Click Handler on Quote Drawer (Remove buttons) ── */
  quoteListItems?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const removeButton = event.target.closest("[data-remove-quote]");
    if (!(removeButton instanceof HTMLButtonElement)) return;

    const productId = removeButton.dataset.removeQuote;
    if (!productId || !quoteItems.has(productId)) return;

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

  /* ── Delegated Change Handler on Quote Drawer (Notes) ── */
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

  /* ── Order Type & Custom Specs ── */
  orderTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        saveQuoteState(quoteItems, input.value, quoteSpecs);
        updateQuoteSendLinks();
      }
    });
  });

  quoteSpecsInput?.addEventListener("input", () => {
    saveQuoteState(quoteItems, quoteOrderType, quoteSpecsInput.value);
    updateQuoteSendLinks();
  });

  /* ── Escape Key & Focus Trap ── */
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

/* ── Scroll-reveal with IntersectionObserver (Immediate Unobserve) ── */
(() => {
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
