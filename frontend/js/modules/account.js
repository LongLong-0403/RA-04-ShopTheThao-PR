/**
 * TSPORT — MODULE TÀI KHOẢN CỦA TÔI & ĐỔI MẬT KHẨU (ACCOUNT V2)
 */

(function () {
  function getInitials(name) {
    const parts = String(name || "TS").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function initAccountModule() {
    let user;
    try { user = await api.get("/auth/me"); }
    catch (err) {
      if (err.status === 401) location.replace("auth.html");
      else showToast(err.message, "error");
      return;
    }

    // Tìm kiếm từ header
    document.getElementById("accountSearchForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = document.getElementById("accountSearchInput")?.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });

    // Nạp thông tin vào form và sidebar
    const emailField = document.getElementById("profileEmail");
    const nameField = document.getElementById("profileFullName");
    const phoneField = document.getElementById("profilePhone");
    const addrField = document.getElementById("profileAddress");

    if (emailField) emailField.value = user.email || "";
    if (nameField) nameField.value = user.full_name || "";
    if (phoneField) phoneField.value = user.phone || "";
    if (addrField) addrField.value = user.address || "";

    const sbName = document.getElementById("sbProfileName");
    const sbRole = document.getElementById("sbProfileRole");
    const sbAvatar = document.getElementById("sbProfileAvatar");
    if (sbName) sbName.textContent = user.full_name || user.email;
    if (sbRole) sbRole.textContent = user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    if (sbAvatar) sbAvatar.textContent = getInitials(user.full_name || user.email);

    // Nút Hiện / Ẩn mật khẩu
    document.querySelectorAll(".js-toggle-pass").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.textContent = isPassword ? "Ẩn" : "Hiện";
        btn.classList.toggle("is-visible", isPassword);
      });
    });

    // Lưu thay đổi thông tin cá nhân
    document.getElementById("formUpdateProfile")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updatedName = document.getElementById("profileFullName").value.trim();
      const updatedPhone = document.getElementById("profilePhone").value.trim();
      const updatedAddr = document.getElementById("profileAddress").value.trim();

      if (!updatedName) {
        showToast("Vui lòng nhập họ và tên.", "error");
        return;
      }

      try { user = await api.put("/auth/me", {full_name: updatedName, phone: updatedPhone, address: updatedAddr}); }
      catch (err) { showToast(err.message, "error"); return; }
      localStorage.setItem("tsport_current_user", JSON.stringify(user));

      if (sbName) sbName.textContent = updatedName;
      if (sbAvatar) sbAvatar.textContent = getInitials(updatedName);
      const userLabel = document.querySelector(".js-header-user-label");
      if (userLabel) userLabel.textContent = updatedName;

      showToast("Đã lưu thay đổi thông tin cá nhân!", "success");
    });

    // Đổi mật khẩu
    document.getElementById("formChangePassword")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const cur = document.getElementById("passCurrent").value;
      const nw = document.getElementById("passNew").value;
      const cf = document.getElementById("passConfirm").value;

      if (!cur) {
        showToast("Vui lòng nhập mật khẩu hiện tại.", "error");
        return;
      }
      if (!nw || nw.length < 8) {
        showToast("Mật khẩu mới phải có tối thiểu 8 ký tự.", "error");
        return;
      }
      if (nw !== cf) {
        showToast("Nhập lại mật khẩu mới không trùng khớp.", "error");
        return;
      }

      try { await api.post("/auth/password", {current_password: cur, new_password: nw}); }
      catch (err) { showToast(err.message, "error"); return; }
      showToast("Cập nhật mật khẩu thành công!", "success");
      document.getElementById("formChangePassword").reset();
    });

    // Đăng xuất
    document.getElementById("btnAccountLogout")?.addEventListener("click", async () => {
      try { await api.post("/auth/logout"); } catch (err) { if (err.status !== 401) { showToast(err.message,"error"); return; } }
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      showToast("Đã đăng xuất tài khoản.", "success");
      setTimeout(() => {
        window.location.href = "auth.html";
      }, 450);
    });
  }

  document.addEventListener("DOMContentLoaded", initAccountModule);
})();
