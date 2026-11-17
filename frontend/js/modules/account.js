/**
 * TSPORT — MODULE TÀI KHOẢN & ĐỔI MẬT KHẨU (D10)
 */

(function () {
  function initAccountModule() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || {
      email: "nguyenvanan@sportstore.vn",
      full_name: "Nguyễn Văn An",
      phone: "0912345601",
      address: "Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội",
      role: "CUSTOMER"
    };

    // Render thông tin sang form và sidebar
    const emailField = document.getElementById("profileEmail");
    const nameField = document.getElementById("profileFullName");
    const phoneField = document.getElementById("profilePhone");
    const addrField = document.getElementById("profileAddress");

    if (emailField) emailField.value = user.email;
    if (nameField) nameField.value = user.full_name || "";
    if (phoneField) phoneField.value = user.phone || "";
    if (addrField) addrField.value = user.address || "";

    const sbName = document.getElementById("sbProfileName");
    const sbEmail = document.getElementById("sbProfileEmail");
    const sbPhone = document.getElementById("sbProfilePhone");
    if (sbName) sbName.textContent = user.full_name || user.email;
    if (sbEmail) sbEmail.textContent = user.email;
    if (sbPhone) sbPhone.textContent = user.phone || "Chưa cập nhật";

    // Form Update Profile
    document.getElementById("formUpdateProfile")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const updatedName = document.getElementById("profileFullName").value.trim();
      const updatedPhone = document.getElementById("profilePhone").value.trim();
      const updatedAddr = document.getElementById("profileAddress").value.trim();

      user.full_name = updatedName;
      user.phone = updatedPhone;
      user.address = updatedAddr;
      localStorage.setItem("tsport_current_user", JSON.stringify(user));

      if (sbName) sbName.textContent = updatedName;
      if (sbPhone) sbPhone.textContent = updatedPhone;
      const userLabel = document.querySelector(".js-header-user-label");
      if (userLabel) userLabel.textContent = updatedName;

      showToast("Cập nhật thông tin cá nhân thành công (Gửi kèm Bearer Token)!", "success");
    });

    // Form Change Password
    document.getElementById("formChangePassword")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const cur = document.getElementById("passCurrent").value;
      const nw = document.getElementById("passNew").value;
      const cf = document.getElementById("passConfirm").value;

      if (!cur) {
        alert("⚠️ Vui lòng nhập mật khẩu hiện tại!");
        return;
      }
      if (!nw || nw.length < 6) {
        alert("⚠️ Mật khẩu mới phải có tối thiểu 6 ký tự!");
        return;
      }
      if (nw !== cf) {
        alert("⚠️ Mật khẩu xác nhận không trùng khớp!");
        return;
      }

      showToast("Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.", "success");
      document.getElementById("formChangePassword").reset();
    });
  }

  document.addEventListener("DOMContentLoaded", initAccountModule);
})();
