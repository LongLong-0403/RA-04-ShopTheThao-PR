/**
 * TSPORT — MODULE AUTH (ĐĂNG NHẬP & ĐĂNG KÝ D08 / D09)
 */

(function () {
  function logAxiosInterceptor(method, url, authHeader) {
    const monitor = document.getElementById("axiosInterceptorLog");
    if (!monitor) return;
    const time = new Date().toLocaleTimeString("vi-VN");
    const item = document.createElement("div");
    item.className = "tsport-log-item";
    item.innerHTML = `
      <span class="tsport-log-time">[${time}]</span>
      <span class="tsport-log-method">${method}</span>
      <span class="tsport-log-url">${url}</span>
      <span class="tsport-log-auth">↳ Header: ${authHeader ? 'Authorization: Bearer ' + authHeader.slice(0, 15) + '...' : '(No Auth)'}</span>
    `;
    monitor.prepend(item);
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    let hasError = false;
    if (!email || !email.includes("@")) {
      document.getElementById("loginEmail").classList.add("is-invalid");
      document.getElementById("errLoginEmail").textContent = "Email không hợp lệ (cần định dạng @domain.com)";
      hasError = true;
    } else {
      document.getElementById("loginEmail").classList.remove("is-invalid");
      document.getElementById("errLoginEmail").textContent = "";
    }

    if (!password || password.length < 6) {
      document.getElementById("loginPassword").classList.add("is-invalid");
      document.getElementById("errLoginPassword").textContent = "Mật khẩu tối thiểu 6 ký tự";
      hasError = true;
    } else {
      document.getElementById("loginPassword").classList.remove("is-invalid");
      document.getElementById("errLoginPassword").textContent = "";
    }

    if (hasError) return;

    // Giả lập token JWT
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify({ sub: email, role: "CUSTOMER", exp: Date.now() + 86400000 })) + ".sig_verified_tsport";
    localStorage.setItem("token", token);
    localStorage.setItem("tsport_token", token);
    localStorage.setItem("tsport_current_user", JSON.stringify({ email, full_name: email.split("@")[0], role: "CUSTOMER" }));

    logAxiosInterceptor("POST", "/api/users/login", token);
    showToast(`Đăng nhập thành công! Đã lưu JWT Token vào localStorage.`, "success");

    const userLabel = document.querySelector(".js-header-user-label");
    if (userLabel) userLabel.textContent = email.split("@")[0];
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById("regFullName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value;
    const confirmPass = document.getElementById("regConfirmPassword").value;

    let hasError = false;
    if (!fullName) {
      document.getElementById("regFullName").classList.add("is-invalid");
      hasError = true;
    } else document.getElementById("regFullName").classList.remove("is-invalid");

    if (!phone || phone.length < 9) {
      document.getElementById("regPhone").classList.add("is-invalid");
      hasError = true;
    } else document.getElementById("regPhone").classList.remove("is-invalid");

    if (!email || !email.includes("@")) {
      document.getElementById("regEmail").classList.add("is-invalid");
      hasError = true;
    } else document.getElementById("regEmail").classList.remove("is-invalid");

    if (!pass || pass.length < 6) {
      document.getElementById("regPassword").classList.add("is-invalid");
      hasError = true;
    } else document.getElementById("regPassword").classList.remove("is-invalid");

    if (pass !== confirmPass) {
      document.getElementById("regConfirmPassword").classList.add("is-invalid");
      alert("⚠️ Mật khẩu xác nhận không khớp!");
      return;
    } else document.getElementById("regConfirmPassword").classList.remove("is-invalid");

    if (hasError) {
      alert("⚠️ Vui lòng kiểm tra lại các trường báo đỏ!");
      return;
    }

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify({ sub: email, role: "CUSTOMER" })) + ".sig_verified_tsport";
    localStorage.setItem("token", token);
    localStorage.setItem("tsport_token", token);
    localStorage.setItem("tsport_current_user", JSON.stringify({ email, full_name: fullName, phone, role: "CUSTOMER" }));

    logAxiosInterceptor("POST", "/api/users/register", token);
    showToast(`Đăng ký tài khoản ${email} thành công! Token đã lưu.`, "success");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formLogin")?.addEventListener("submit", handleLoginSubmit);
    document.getElementById("formRegister")?.addEventListener("submit", handleRegisterSubmit);

    // Nút test lỗi validate
    document.getElementById("btnTestValidationError")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "email-sai-dinh-dang";
      document.getElementById("loginPassword").value = "123";
      document.getElementById("loginEmail").classList.add("is-invalid");
      document.getElementById("errLoginEmail").textContent = "Định dạng Email không hợp lệ (ví dụ: user@sportstore.vn)";
      document.getElementById("loginPassword").classList.add("is-invalid");
      document.getElementById("errLoginPassword").textContent = "Mật khẩu phải có tối thiểu 6 ký tự";
      showToast("Đã kích hoạt trạng thái báo đỏ validate form!", "error");
    });

    // Nút điền nhanh khách An
    document.getElementById("btnFillCustomerAn")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "nguyenvanan@sportstore.vn";
      document.getElementById("loginPassword").value = "Customer@123";
      document.getElementById("loginEmail").classList.remove("is-invalid");
      document.getElementById("errLoginEmail").textContent = "";
      document.getElementById("loginPassword").classList.remove("is-invalid");
      document.getElementById("errLoginPassword").textContent = "";
    });
  });
})();
