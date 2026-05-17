const storageKeys = window.AMUNRA_STORAGE || {
  products: "amunraProducts",
  slides: "amunraHeroSlides",
  site: "amunraSiteContent",
};
const defaultData = window.AMUNRA_DEFAULTS || { products: [], heroSlides: [], site: {} };
const money = new Intl.NumberFormat("vi-VN");
const fallbackImage =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";

let siteContent = readStoredValue(storageKeys.site, defaultData.site);
let heroSlides = readStoredValue(storageKeys.slides, defaultData.heroSlides);
let products = readStoredValue(storageKeys.products, defaultData.products);

const siteForm = document.querySelector("#siteForm");
const slideForm = document.querySelector("#slideForm");
const slideList = document.querySelector("#slideList");
const productForm = document.querySelector("#productForm");
const productList = document.querySelector("#productList");
const productSearch = document.querySelector("#productSearch");
const productSubmit = document.querySelector("#productSubmit");
const toast = document.querySelector("#toast");
const saveStatus = document.querySelector("#saveStatus");

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

function saveValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  saveStatus.textContent = "Đã lưu thay đổi";
  showToast("Đã lưu nội dung");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
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

function formatPrice(value) {
  return `${money.format(Number(value) || 0)} đ`;
}

function parseMoney(value) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function listFromText(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillSiteForm() {
  Object.entries(siteContent).forEach(([key, value]) => {
    const field = siteForm.elements[key];
    if (field) field.value = value || "";
  });
}

function collectSiteForm() {
  const formData = new FormData(siteForm);
  siteContent = { ...siteContent };
  formData.forEach((value, key) => {
    siteContent[key] = String(value).trim();
  });
}

function renderStats() {
  document.querySelector("#productCount").textContent = products.length;
  document.querySelector("#flashCount").textContent = products.filter((product) => product.section === "flash").length;
  document.querySelector("#slideCount").textContent = heroSlides.length;
}

function slideTemplate(slide, index) {
  return `
    <article class="slide-editor" data-slide-index="${index}">
      <div class="slide-preview">
        <img src="${escapeAttribute(slide.image || fallbackImage)}" alt="" />
      </div>
      <div class="slide-fields">
        <h3>Banner ${index + 1}</h3>
        <label>
          Nhãn nhỏ
          <input name="eyebrow" type="text" value="${escapeAttribute(slide.eyebrow)}" />
        </label>
        <label>
          Tiêu đề
          <input name="title" type="text" value="${escapeAttribute(slide.title)}" />
        </label>
        <label class="wide">
          Mô tả
          <textarea name="description" rows="2">${escapeHtml(slide.description)}</textarea>
        </label>
        <label>
          Chữ trên nút
          <input name="buttonText" type="text" value="${escapeAttribute(slide.buttonText)}" />
        </label>
        <label>
          Link nút
          <input name="buttonHref" type="text" value="${escapeAttribute(slide.buttonHref)}" />
        </label>
        <label class="wide">
          Link ảnh banner
          <input name="image" type="url" value="${escapeAttribute(slide.image)}" />
        </label>
        <label class="wide">
          Mô tả ảnh
          <input name="alt" type="text" value="${escapeAttribute(slide.alt)}" />
        </label>
        <div class="form-actions wide">
          <button class="remove-slide" type="button" data-remove-slide="${index}">Xóa banner này</button>
        </div>
      </div>
    </article>
  `;
}

function renderSlides() {
  slideList.innerHTML = heroSlides.map((slide, index) => slideTemplate(slide, index)).join("");
  refreshIcons();
}

function collectSlides() {
  heroSlides = [...document.querySelectorAll(".slide-editor")].map((editor) => {
    const getValue = (name) => editor.querySelector(`[name="${name}"]`).value.trim();
    return {
      eyebrow: getValue("eyebrow"),
      title: getValue("title"),
      description: getValue("description"),
      buttonText: getValue("buttonText"),
      buttonHref: getValue("buttonHref") || "#deals",
      image: getValue("image") || fallbackImage,
      alt: getValue("alt"),
    };
  });
}

function clearProductForm() {
  productForm.reset();
  productForm.elements.editIndex.value = "";
  productSubmit.innerHTML = `<i data-lucide="plus"></i> Thêm sản phẩm`;
  refreshIcons();
}

function fillProductForm(product, index) {
  productForm.elements.editIndex.value = String(index);
  productForm.elements.name.value = product.name || "";
  productForm.elements.section.value = product.section || "phones";
  productForm.elements.type.value = product.type || "phone";
  productForm.elements.price.value = product.price || "";
  productForm.elements.oldPrice.value = product.oldPrice || "";
  productForm.elements.stock.value = product.stock || 50;
  productForm.elements.image.value = product.image || "";
  productForm.elements.specs.value = Array.isArray(product.specs) ? product.specs.join(", ") : "";
  productForm.elements.badges.value = Array.isArray(product.badges) ? product.badges.join(", ") : "";
  productSubmit.innerHTML = `<i data-lucide="save"></i> Lưu sản phẩm`;
  document.querySelector("#productContent").scrollIntoView({ behavior: "smooth" });
  refreshIcons();
}

function collectProductForm() {
  const price = parseMoney(productForm.elements.price.value);
  const oldPrice = Math.max(parseMoney(productForm.elements.oldPrice.value), price);
  return {
    name: productForm.elements.name.value.trim(),
    section: productForm.elements.section.value,
    type: productForm.elements.type.value,
    price,
    oldPrice,
    stock: Math.min(100, Math.max(0, Number(productForm.elements.stock.value) || 0)),
    image: productForm.elements.image.value.trim() || fallbackImage,
    specs: listFromText(productForm.elements.specs.value),
    badges: listFromText(productForm.elements.badges.value),
  };
}

function renderProducts() {
  const query = productSearch.value.trim().toLowerCase();
  const filtered = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => !query || String(product.name || "").toLowerCase().includes(query));

  if (!filtered.length) {
    productList.innerHTML = `<p class="help-note">Không tìm thấy sản phẩm phù hợp.</p>`;
    return;
  }

  productList.innerHTML = filtered
    .map(
      ({ product, index }) => `
        <article class="product-row">
          <img src="${escapeAttribute(product.image || fallbackImage)}" alt="" />
          <div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(labelForSection(product.section))} · ${formatPrice(product.price)} · ${escapeHtml(
        product.badges?.join(", ") || "Chưa có nhãn"
      )}</p>
          </div>
          <div class="product-row__actions">
            <button class="row-button" type="button" data-edit-product="${index}">Sửa</button>
            <button class="row-button row-button--danger" type="button" data-delete-product="${index}">Xóa</button>
          </div>
        </article>
      `
    )
    .join("");
}

function labelForSection(section) {
  const labels = {
    flash: "Flash sale",
    phones: "Điện thoại nổi bật",
    computers: "Tablet & laptop",
    accessories: "Phụ kiện",
  };
  return labels[section] || section;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function bindEvents() {
  document.addEventListener("input", () => {
    saveStatus.textContent = "Có thay đổi chưa lưu";
  });

  siteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    collectSiteForm();
    saveValue(storageKeys.site, siteContent);
  });

  slideForm.addEventListener("submit", (event) => {
    event.preventDefault();
    collectSlides();
    saveValue(storageKeys.slides, heroSlides);
    renderStats();
  });

  document.querySelector("#addSlide").addEventListener("click", () => {
    heroSlides.push({
      eyebrow: "Ưu đãi mới",
      title: "Tiêu đề banner mới",
      description: "Nhập mô tả ngắn cho banner.",
      buttonText: "Xem thêm",
      buttonHref: "#deals",
      image: fallbackImage,
      alt: "Banner Amunra",
    });
    renderSlides();
    renderStats();
  });

  slideList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-slide]");
    if (!removeButton) return;
    const index = Number(removeButton.dataset.removeSlide);
    heroSlides.splice(index, 1);
    renderSlides();
    renderStats();
  });

  slideList.addEventListener("input", (event) => {
    if (event.target.name !== "image") return;
    const editor = event.target.closest(".slide-editor");
    const preview = editor?.querySelector(".slide-preview img");
    if (preview) {
      preview.dataset.fallbackApplied = "";
      preview.src = event.target.value.trim() || fallbackImage;
    }
  });

  productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const product = collectProductForm();
    const editIndex = productForm.elements.editIndex.value;
    if (editIndex === "") {
      products.push(product);
    } else {
      products[Number(editIndex)] = product;
    }
    saveValue(storageKeys.products, products);
    clearProductForm();
    renderProducts();
    renderStats();
  });

  document.querySelector("#clearProductForm").addEventListener("click", clearProductForm);
  productSearch.addEventListener("input", renderProducts);

  productList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");

    if (editButton) {
      const index = Number(editButton.dataset.editProduct);
      fillProductForm(products[index], index);
    }

    if (deleteButton) {
      const index = Number(deleteButton.dataset.deleteProduct);
      const ok = window.confirm(`Xóa sản phẩm "${products[index].name}"?`);
      if (!ok) return;
      products.splice(index, 1);
      saveValue(storageKeys.products, products);
      renderProducts();
      renderStats();
    }
  });

  document.querySelector("#resetData").addEventListener("click", () => {
    const ok = window.confirm("Khôi phục toàn bộ nội dung mẫu của Amunra?");
    if (!ok) return;
    localStorage.removeItem(storageKeys.site);
    localStorage.removeItem(storageKeys.slides);
    localStorage.removeItem(storageKeys.products);
    siteContent = cloneValue(defaultData.site);
    heroSlides = cloneValue(defaultData.heroSlides);
    products = cloneValue(defaultData.products);
    fillSiteForm();
    renderSlides();
    renderProducts();
    renderStats();
    saveStatus.textContent = "Đã khôi phục dữ liệu mẫu";
    showToast("Đã khôi phục dữ liệu mẫu");
  });
}

fillSiteForm();
renderSlides();
renderProducts();
renderStats();
bindImageFallbacks();
bindEvents();
window.addEventListener("load", refreshIcons);
