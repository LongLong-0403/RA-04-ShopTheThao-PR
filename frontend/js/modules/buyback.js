/**
 * TSPORT — MODULE THU MUA ĐỒ CŨ (BUYBACK REQUEST FIGMA)
 * - Cho phép khách chọn môn, nhập Hãng/Model, mô tả tình trạng thực tế, giá mong muốn và tải ảnh
 * - Lưu yêu cầu định giá vào tsportStore.saveBuyback()
 */

(function () {
  let uploadedPreviews = [];

  function initBuybackPage() {
    initHeaderSearch();
    populateSports();
    bindEvents();
  }

  function initHeaderSearch() {
    const form = document.getElementById("bbHeaderSearchForm");
    const input = document.getElementById("bbHeaderSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function populateSports() {
    const select = document.getElementById("bbSportSelect");
    const store = window.tsportStore;
    if (!select || !store) return;

    const sports = store.getSports() || [];
    select.innerHTML = sports
      .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
      .join("");
  }

  function parsePriceNumber(raw) {
    const digits = String(raw || "").replace(/[^\d]/g, "");
    return Number(digits) || 0;
  }

  function renderPreviews() {
    const wrap = document.getElementById("bbPhotoPreviews");
    if (!wrap) return;
    wrap.innerHTML = uploadedPreviews
      .map(
        (src, idx) => `
        <div class="ts-bb-v2-preview-item">
          <img src="${src}" alt="Ảnh sản phẩm ${idx + 1}" />
          <button type="button" class="ts-bb-v2-preview-del js-del-bb-img" data-idx="${idx}" aria-label="Xóa ảnh">✕</button>
        </div>
      `
      )
      .join("");
  }

  function bindEvents() {
    const fileInput = document.getElementById("bbPhotoInput");
    fileInput?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []).slice(0, 5);
      files.forEach((file) => {
        if (!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 1499900) { showToast("Chọn ảnh JPG, PNG hoặc WebP dưới 1,5 MB.", "error"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (uploadedPreviews.length < 5 && ev.target?.result) {
            uploadedPreviews.push(ev.target.result);
            renderPreviews();
          }
        };
        reader.readAsDataURL(file);
      });
    });

    document.getElementById("bbPhotoPreviews")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-del-bb-img");
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      uploadedPreviews.splice(idx, 1);
      renderPreviews();
    });

    document.getElementById("formBuybackRequest")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const sportId = Number(document.getElementById("bbSportSelect")?.value) || 1;
      const sportObj = store.getSports().find((s) => Number(s.id) === sportId);
      const model = document.getElementById("bbModelInput")?.value.trim();
      const desc = document.getElementById("bbConditionDesc")?.value.trim();
      const expectedPrice = parsePriceNumber(document.getElementById("bbExpectedPrice")?.value);


      if (!model || !desc || !expectedPrice) {
        showToast("Vui lòng nhập đầy đủ Hãng/Model, tình trạng và giá mong muốn.", "error");
        return;
      }

      try {
        if (!uploadedPreviews.length) { showToast("Vui lòng thêm ảnh thực tế của sản phẩm.", "error"); return; }
        const created = await api.post("/buyback-requests", {sport_id: sportId, brand_model: model, condition_detail: desc, expected_price: expectedPrice, images: uploadedPreviews});

        document.getElementById("formBuybackRequest").reset();
        uploadedPreviews = [];
        renderPreviews();
        showToast(`Đã gửi yêu cầu định giá (${created.request_code || "BB-" + created.id}) thành công!`, "success");
      } catch (err) {
        showToast(err.message || "Không thể gửi yêu cầu lúc này.", "error");
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  document.addEventListener("DOMContentLoaded", () => initCustomerPage(initBuybackPage));
})();
