const money = new Intl.NumberFormat("vi-VN");
const storageKeys = window.AMUNRA_STORAGE || {
  products: "amunraProducts",
  slides: "amunraHeroSlides",
  site: "amunraSiteContent",
};
const defaultData = window.AMUNRA_DEFAULTS || { products: [], heroSlides: [], site: {} };
const fallbackImage =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStoredValue(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return cloneValue(fallback);
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : cloneValue(fallback);
    if (fallback && typeof fallback === "object") {
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : cloneValue(fallback);
    }
    return parsed ?? cloneValue(fallback);
  } catch (error) {
    return cloneValue(fallback);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHref(value, fallback = "#") {
  const href = String(value || fallback).trim();
  if (href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return href;
  if (href.startsWith("https://") || href.startsWith("http://")) return href;
  return fallback;
}

function listFrom(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

const products = readStoredValue(storageKeys.products, defaultData.products || []);
const heroSlides = readStoredValue(storageKeys.slides, defaultData.heroSlides || []);
const siteContent = {
  ...(defaultData.site || {}),
  ...readStoredValue(storageKeys.site, defaultData.site || {}),
};

const flashGrid = document.querySelector("#flashGrid");
const productGrid = document.querySelector("#productGrid");
const computerGrid = document.querySelector("#computerGrid");
const accessoryGrid = document.querySelector("#accessoryGrid");
const searchInput = document.querySelector("#siteSearch");
const cartCount = document.querySelector("#cartCount");
const tabs = document.querySelectorAll("[data-filter]");
let activeFilter = "all";
let cartItems = 0;

function formatPrice(value) {
  return `${money.format(Number(value) || 0)} đ`;
}

function discountOf(product) {
  const price = Number(product.price) || 0;
  const oldPrice = Number(product.oldPrice) || price;
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function badgeClass(index) {
  if (index === 1) return "badge badge--green";
  if (index === 2) return "badge badge--amber";
  return "badge";
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = text;
  });
}

function applySiteContent() {
  setText("[data-content='brandName']", siteContent.brandName || "Amunra");
  setText("[data-content='brandSubtitle']", siteContent.brandSubtitle || "Mobile Store");
  setText("[data-content='topMessage']", siteContent.topMessage || "");
  setText("[data-content='hotline']", siteContent.hotline || "");
  setText("[data-content='email']", siteContent.email || "");
  setText("[data-content='address']", siteContent.address || "");
  setText("[data-content='footerIntro']", siteContent.footerIntro || "");
  setText("[data-content='promoOneLabel']", siteContent.promoOneLabel || "");
  setText("[data-content='promoOneTitle']", siteContent.promoOneTitle || "");
  setText("[data-content='promoTwoLabel']", siteContent.promoTwoLabel || "");
  setText("[data-content='promoTwoTitle']", siteContent.promoTwoTitle || "");
  setText("[data-content='tradeEyebrow']", siteContent.tradeEyebrow || "");
  setText("[data-content='tradeTitle']", siteContent.tradeTitle || "");
  setText("[data-content='tradeDescription']", siteContent.tradeDescription || "");

  document.querySelectorAll("[data-hotline-link]").forEach((link) => {
    link.setAttribute("href", `tel:${siteContent.hotlineTel || siteContent.hotline || ""}`);
  });
  document.querySelectorAll("[data-email-link]").forEach((link) => {
    link.setAttribute("href", `mailto:${siteContent.email || ""}`);
  });
}

function renderHeroSlides() {
  const slider = document.querySelector("#heroSlider");
  if (!slider) return;

  const slides = heroSlides.length ? heroSlides : defaultData.heroSlides || [];
  slider.innerHTML = `
    ${slides
      .map((slide, index) => {
        const headingTag = index === 0 ? "h1" : "h2";
        return `
          <div class="hero-slide ${index === 0 ? "is-active" : ""}" data-slide>
            <img src="${escapeHtml(slide.image || fallbackImage)}" alt="${escapeHtml(slide.alt || slide.title)}" />
            <div class="hero-copy">
              <span>${escapeHtml(slide.eyebrow || "Amunra")}</span>
              <${headingTag}>${escapeHtml(slide.title || "Ưu đãi Amunra")}</${headingTag}>
              <p>${escapeHtml(slide.description || "")}</p>
              <a href="${safeHref(slide.buttonHref)}" class="primary-link">${escapeHtml(
          slide.buttonText || "Xem thêm"
        )}</a>
            </div>
          </div>
        `;
      })
      .join("")}
    <div class="slider-dots" aria-label="Chuyển banner">
      ${slides
        .map(
          (_, index) =>
            `<button class="${index === 0 ? "is-active" : ""}" type="button" data-dot="${index}" aria-label="Banner ${
              index + 1
            }"></button>`
        )
        .join("")}
    </div>
  `;
}

function productCard(product, compact = false) {
  const specs = listFrom(product.specs);
  const badges = listFrom(product.badges);
  const image = product.image || fallbackImage;
  const name = product.name || "Sản phẩm Amunra";

  if (compact) {
    return `
      <article class="mini-product">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" />
        <div>
          <h3>${escapeHtml(name)}</h3>
          <strong>${formatPrice(product.price)}</strong>
        </div>
      </article>
    `;
  }

  const discount = discountOf(product);
  return `
    <article class="product-card" data-type="${escapeHtml(product.type || "")}" data-name="${escapeHtml(
    name.toLowerCase()
  )}">
      <div class="product-card__badges">
        ${badges.map((badge, index) => `<span class="${badgeClass(index)}">${escapeHtml(badge)}</span>`).join("")}
        ${discount ? `<span class="badge badge--amber">-${discount}%</span>` : ""}
      </div>
      <div class="product-card__image">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" />
      </div>
      <h3>${escapeHtml(name)}</h3>
      <div class="product-card__specs">
        ${specs.map((spec) => `<span>${escapeHtml(spec)}</span>`).join("")}
      </div>
      <div class="price-row">
        <strong class="price">${formatPrice(product.price)}</strong>
        <span class="old-price">${formatPrice(product.oldPrice)}</span>
      </div>
      <div class="installment">Trả trước từ ${formatPrice(Math.round((Number(product.price) || 0) * 0.3))}</div>
      <div class="stock-line" aria-label="Còn ${Number(product.stock) || 0}% suất ưu đãi">
        <span style="width: ${Math.min(100, Math.max(0, Number(product.stock) || 0))}%"></span>
      </div>
      <button class="product-card__action" type="button" data-add-cart>
        <i data-lucide="shopping-bag"></i>
        Thêm vào giỏ
      </button>
    </article>
  `;
}

function renderEmpty(target, message) {
  target.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchFilter = activeFilter === "all" || product.type === activeFilter;
    const matchSearch = !query || String(product.name || "").toLowerCase().includes(query);
    return product.section !== "flash" && matchFilter && matchSearch;
  });

  if (!filteredProducts.length) {
    renderEmpty(productGrid, "Không tìm thấy sản phẩm phù hợp.");
  } else {
    productGrid.innerHTML = filteredProducts.map((product) => productCard(product)).join("");
  }
  refreshIcons();
}

function renderStaticSections() {
  const flashProducts = products.filter((product) => product.section === "flash");
  const computerProducts = products.filter((product) => product.section === "computers");
  const accessoryProducts = products.filter((product) => product.section === "accessories");

  if (flashProducts.length) {
    flashGrid.innerHTML = flashProducts.map((product) => productCard(product)).join("");
  } else {
    renderEmpty(flashGrid, "Chưa có sản phẩm flash sale.");
  }

  if (computerProducts.length) {
    computerGrid.innerHTML = computerProducts.map((product) => productCard(product, true)).join("");
  } else {
    renderEmpty(computerGrid, "Chưa có sản phẩm tablet hoặc laptop.");
  }

  if (accessoryProducts.length) {
    accessoryGrid.innerHTML = accessoryProducts.map((product) => productCard(product, true)).join("");
  } else {
    renderEmpty(accessoryGrid, "Chưa có sản phẩm phụ kiện.");
  }
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function bindImageFallbacks() {
  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (image.tagName !== "IMG" || image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = "true";
      image.src = fallbackImage;
    },
    true
  );
}

function startSlider() {
  const slides = [...document.querySelectorAll("[data-slide]")];
  const dots = [...document.querySelectorAll("[data-dot]")];
  if (!slides.length) return;
  let index = 0;

  const showSlide = (nextIndex) => {
    index = nextIndex;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => showSlide(Number(dot.dataset.dot)));
  });

  if (slides.length > 1) {
    window.setInterval(() => showSlide((index + 1) % slides.length), 5200);
  }
}

function startCountdown() {
  const hours = document.querySelector("#hours");
  const minutes = document.querySelector("#minutes");
  const seconds = document.querySelector("#seconds");

  const update = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const diff = Math.max(0, end - now);
    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    hours.textContent = String(h).padStart(2, "0");
    minutes.textContent = String(m).padStart(2, "0");
    seconds.textContent = String(s).padStart(2, "0");
  };

  update();
  window.setInterval(update, 1000);
}

function bindEvents() {
  document.querySelector(".search").addEventListener("submit", (event) => {
    event.preventDefault();
    renderProducts();
    document.querySelector("#phones").scrollIntoView({ behavior: "smooth" });
  });

  searchInput.addEventListener("input", renderProducts);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeFilter = tab.dataset.filter;
      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      renderProducts();
    });
  });

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) {
      cartItems += 1;
      cartCount.textContent = cartItems;
      addButton.textContent = "Đã thêm";
      window.setTimeout(() => {
        addButton.innerHTML = `<i data-lucide="shopping-bag"></i> Thêm vào giỏ`;
        refreshIcons();
      }, 1100);
    }

    const toggleButton = event.target.closest("[data-menu-toggle]");
    if (toggleButton) {
      const isOpen = document.body.classList.toggle("menu-open");
      toggleButton.setAttribute("aria-expanded", String(isOpen));
    }

    const menuLink = event.target.closest("[data-menu-panel] a");
    if (menuLink) {
      document.body.classList.remove("menu-open");
      document.querySelector("[data-menu-toggle]").setAttribute("aria-expanded", "false");
    }
  });

  document.querySelector(".newsletter").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.querySelector("button").textContent = "Đã đăng ký";
  });
}

applySiteContent();
renderHeroSlides();
renderStaticSections();
renderProducts();
bindImageFallbacks();
startSlider();
startCountdown();
bindEvents();
window.addEventListener("load", refreshIcons);
