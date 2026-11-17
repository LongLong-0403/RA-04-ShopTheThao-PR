/**
 * TSPORT — MODULE NHẬP CSV SẢN PHẨM & SKU (LINE-BY-LINE VALIDATION)
 * Tính năng:
 * - Admin tải file CSV sản phẩm + biến thể SKU
 * - Kiểm tra từng dòng, báo chính xác số dòng lỗi kèm lý do chi tiết
 * - Cho phép tải template CSV mẫu
 * - Nạp các dòng hợp lệ vào store
 */

(function () {
  let currentValidationResult = null;

  const SAMPLE_VALID_CSV = `name,sport_id,category_id,brand_id,condition_type,wear_description,sku_code,size,color,price,stock,unit,quantity_per_lot
Vợt Cầu Lông Victor Auraspeed 90K,1,2,3,MOI,,ARS-90K-4U,4U,Trắng Đỏ,3650000,20,CHIEC,1
Vợt Tennis Babolat Pure Aero 2024,3,3,7,MOI,,PA2024-G2,G2,Vàng Đen,4890000,12,CHIEC,1
Hộp 12 Quả Cầu Lông Victor Champion Cũ,1,10,3,CU,Đã đánh qua 1 hiệp còn lông nguyên 80%,USED-VCTC-LO,Tiêu chuẩn,Trắng,180000,5,LO,12`;

  const SAMPLE_INVALID_CSV = `name,sport_id,category_id,brand_id,condition_type,wear_description,sku_code,size,color,price,stock,unit,quantity_per_lot
Vợt Cầu Lông Lỗi Tên Trống,,2,1,MOI,,ERR-SKU-1,3U,Đỏ,2000000,10,CHIEC,1
Vợt Tennis Hàng Cũ Thiếu Mô Tả,3,3,6,CU,,ERR-SKU-2,G3,Xanh,1500000,5,CHIEC,1
Giày Đá Bóng Giá Âm và Lỗi Môn,99,7,4,MOI,,ERR-SKU-3,42,Đen,-500000,-2,CHIEC,1
Bóng Tennis Bán Theo Lô Nhưng Số Lượng Sai,3,12,6,MOI,,ERR-SKU-4,Tiêu chuẩn,Vàng,250000,10,LO,1`;

  function initCsvImport() {
    bindCsvEvents();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      const textarea = document.getElementById("csvRawText");
      if (textarea) textarea.value = text;
      runValidation(text);
    };
    reader.readAsText(file, "UTF-8");
  }

  function runValidation(csvContent) {
    const store = window.tsportStore;
    if (!store) return;

    try {
      currentValidationResult = store.validateAndImportProductsCSV(csvContent);
      renderValidationReport(currentValidationResult);
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  function renderValidationReport(result) {
    const reportWrap = document.getElementById("csvValidationReport");
    if (!reportWrap) return;

    reportWrap.style.display = "block";

    const summaryEl = document.getElementById("csvValidationSummary");
    const errorsTbody = document.getElementById("csvErrorsTbody");
    const commitBtn = document.getElementById("btnCommitCsvImport");

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
          <div>Tổng số dòng: <strong>${result.totalLines}</strong></div>
          <div style="color:#16A34A; font-weight:700;">✓ Hợp lệ: ${result.validCount} dòng</div>
          <div style="color:#DC2626; font-weight:700;">✕ Phát hiện lỗi: ${result.errorCount} lỗi</div>
        </div>
      `;
    }

    if (errorsTbody) {
      if (result.errors.length === 0) {
        errorsTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; color:#16A34A; padding:20px; font-weight:700;">
              ✓ Tuyệt vời! Toàn bộ ${result.validCount} dòng dữ liệu đều hợp lệ và chuẩn xác theo quy định SRS.
            </td>
          </tr>
        `;
      } else {
        errorsTbody.innerHTML = result.errors.map((err) => `
          <tr style="background:#FEF2F2;">
            <td><strong style="color:#DC2626;">Dòng ${err.line}</strong></td>
            <td><code>${escapeHtml(err.field)}</code></td>
            <td style="color:#7F1D1D;">${escapeHtml(err.raw || '(Trống)')}</td>
            <td style="color:#B91C1C; font-weight:700;">⚠️ ${escapeHtml(err.message)}</td>
          </tr>
        `).join("");
      }
    }

    if (commitBtn) {
      if (result.validCount > 0) {
        commitBtn.disabled = false;
        commitBtn.textContent = `Nhập ${result.validCount} dòng hợp lệ vào Kho sản phẩm`;
      } else {
        commitBtn.disabled = true;
        commitBtn.textContent = "Không có dòng hợp lệ để nhập";
      }
    }
  }

  function downloadCsvTemplate() {
    const template = `name,sport_id,category_id,brand_id,condition_type,wear_description,sku_code,size,color,price,stock,unit,quantity_per_lot
Vợt Cầu Lông Yonex Astrox 77 Pro,1,2,1,MOI,,AX77P-4U-OR,4U,Cam Đen,3850000,15,CHIEC,1
Vợt Cầu Lông Yonex Astrox 77 Pro Cũ,1,2,1,CU,Trầy sơn viền góc 11h độ mới 88% khung nguyên bản,USED-AX77P-4U,4U,Cam Đen,2100000,1,CHIEC,1
Hộp 12 Quả Cầu Lông Hải Yến Đỏ,1,10,11,MOI,,HYD-HOP-12,Tiêu chuẩn,Trắng,240000,50,LO,12`;

    const blob = new Blob(["\uFEFF" + template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_products_sku.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Đã tải template CSV mẫu về máy!", "success");
  }

  function bindCsvEvents() {
    // Tải file qua input
    document.getElementById("csvFileInput")?.addEventListener("change", handleFileSelect);

    // Nút tải template
    document.getElementById("btnDownloadCsvTemplate")?.addEventListener("click", downloadCsvTemplate);

    // Nút phân tích nội dung textarea
    document.getElementById("btnParseCsvText")?.addEventListener("click", () => {
      const text = document.getElementById("csvRawText")?.value.trim();
      if (!text) {
        alert("⚠️ Vui lòng dán hoặc nhập nội dung CSV trước!");
        return;
      }
      runValidation(text);
    });

    // Test nạp mẫu CSV hợp lệ
    document.getElementById("btnLoadSampleValidCsv")?.addEventListener("click", () => {
      const textarea = document.getElementById("csvRawText");
      if (textarea) textarea.value = SAMPLE_VALID_CSV;
      runValidation(SAMPLE_VALID_CSV);
    });

    // Test nạp mẫu CSV cố tình lỗi
    document.getElementById("btnLoadSampleInvalidCsv")?.addEventListener("click", () => {
      const textarea = document.getElementById("csvRawText");
      if (textarea) textarea.value = SAMPLE_INVALID_CSV;
      runValidation(SAMPLE_INVALID_CSV);
    });

    // Nút cam kết nhập vào kho
    document.getElementById("btnCommitCsvImport")?.addEventListener("click", () => {
      if (!currentValidationResult || currentValidationResult.validRows.length === 0) return;
      const store = window.tsportStore;
      const count = store.commitImportedProducts(currentValidationResult.validRows);
      closeModal("modalCsvImport");
      showToast(`Đã nhập thành công ${count} sản phẩm mới vào Kho!`, "success");
      if (typeof window.renderProductsTable === "function") {
        window.renderProductsTable();
      }
    });

    // Mở modal CSV
    document.getElementById("btnOpenCsvImportModal")?.addEventListener("click", () => {
      openModal("modalCsvImport");
    });
  }

  window.initCsvImport = initCsvImport;
  document.addEventListener("DOMContentLoaded", initCsvImport);
})();
