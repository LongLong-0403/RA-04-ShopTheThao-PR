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
    const isSpecialAdmin = email.toLowerCase() === "admin123@gmail.com" || email.toLowerCase().includes("admin");
    const role = isSpecialAdmin ? "ADMIN" : "CUSTOMER";
    const fullName = isSpecialAdmin ? "Quản Trị Viên (admin123)" : email.split("@")[0];

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify({ sub: email, role, exp: Date.now() + 86400000 })) + ".sig_verified_tsport";
    localStorage.setItem("token", token);
    localStorage.setItem("tsport_token", token);
    localStorage.setItem("tsport_current_user", JSON.stringify({ email, full_name: fullName, role }));

    logAxiosInterceptor("POST", "/api/users/login", token);
    showToast(`Đăng nhập thành công (${role})! Đang chuyển hướng...`, "success");

    const userLabel = document.querySelector(".js-header-user-label");
    if (userLabel) userLabel.textContent = fullName;

    setTimeout(() => {
      if (role === "ADMIN") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "account.html";
      }
    }, 800);
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

    const isSpecialAdmin = email.toLowerCase() === "admin123@gmail.com" || email.toLowerCase().includes("admin");
    const role = isSpecialAdmin ? "ADMIN" : "CUSTOMER";
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify({ sub: email, role })) + ".sig_verified_tsport";
    localStorage.setItem("token", token);
    localStorage.setItem("tsport_token", token);
    localStorage.setItem("tsport_current_user", JSON.stringify({ email, full_name: fullName, phone, role }));

    logAxiosInterceptor("POST", "/api/users/register", token);
    showToast(`Đăng ký tài khoản ${email} (${role}) thành công! Đang chuyển hướng...`, "success");

    setTimeout(() => {
      if (role === "ADMIN") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "account.html";
      }
    }, 800);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formLogin")?.addEventListener("submit", handleLoginSubmit);
    document.getElementById("formRegister")?.addEventListener("submit", handleRegisterSubmit);

    // Tìm kiếm từ header
    document.getElementById("authSearchForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("authSearchInput")?.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });

    // Chuyển đổi qua lại giữa Đăng nhập & Đăng ký
    const loginPanel = document.getElementById("authLoginPanel");
    const regPanel = document.getElementById("authRegisterPanel");
    document.getElementById("btnShowRegister")?.addEventListener("click", () => {
      if (loginPanel) loginPanel.style.display = "none";
      if (regPanel) regPanel.style.display = "block";
      document.title = "Đăng ký tài khoản | Tsport";
    });
    document.getElementById("btnShowLogin")?.addEventListener("click", () => {
      if (regPanel) regPanel.style.display = "none";
      if (loginPanel) loginPanel.style.display = "block";
      document.title = "Đăng nhập | Tsport";
    });

    // Modal Liên hệ quản trị viên
    const contactModal = document.getElementById("modalContactAdmin");
    const openContact = () => {
      if (!contactModal) return;
      const loginEmailVal = document.getElementById("loginEmail")?.value.trim();
      const contactAccount = document.getElementById("contactAccount");
      if (contactAccount && !contactAccount.value && loginEmailVal) {
        contactAccount.value = loginEmailVal;
      }
      contactModal.classList.add("is-open");
      contactModal.setAttribute("aria-hidden", "false");
    };
    const closeContact = () => {
      if (!contactModal) return;
      contactModal.classList.remove("is-open");
      contactModal.setAttribute("aria-hidden", "true");
    };

    document.getElementById("btnOpenContactAdmin")?.addEventListener("click", openContact);
    document.getElementById("btnCloseContactAdmin")?.addEventListener("click", closeContact);
    document.getElementById("btnCancelContactAdmin")?.addEventListener("click", closeContact);
    contactModal?.addEventListener("click", (e) => {
      if (e.target === contactModal) closeContact();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && contactModal?.classList.contains("is-open")) {
        closeContact();
      }
    });

    document.getElementById("formContactAdmin")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const account = document.getElementById("contactAccount")?.value.trim();
      const reason = document.getElementById("contactReason")?.value || "Tài khoản bị khóa";
      const message = document.getElementById("contactMessage")?.value.trim();

      if (!account || !message) {
        showToast("Vui lòng nhập đầy đủ thông tin tài khoản và nội dung cần hỗ trợ.", "error");
        return;
      }

      try {
        const tickets = JSON.parse(localStorage.getItem("tsport_support_tickets") || "[]");
        const ticketCode = "SUP-" + String(Date.now()).slice(-6);
        tickets.unshift({
          code: ticketCode,
          account,
          reason,
          message,
          status: "PENDING",
          created_at: new Date().toLocaleString("vi-VN")
        });
        localStorage.setItem("tsport_support_tickets", JSON.stringify(tickets));
        document.getElementById("contactMessage").value = "";
        closeContact();
        showToast(`Đã gửi yêu cầu hỗ trợ (${ticketCode}) tới quản trị viên!`, "success");
      } catch (_) {
        closeContact();
        showToast("Đã gửi yêu cầu hỗ trợ tới quản trị viên!", "success");
      }
    });

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

    document.getElementById("btnQuickLoginCustomer")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "nguyenvanan@sportstore.vn";
      document.getElementById("loginPassword").value = "Customer@123";
      document.getElementById("loginEmail").classList.remove("is-invalid");
      document.getElementById("errLoginEmail").textContent = "";
      document.getElementById("loginPassword").classList.remove("is-invalid");
      document.getElementById("errLoginPassword").textContent = "";
    });

    document.getElementById("btnQuickLoginAdmin")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "admin123@gmail.com";
      document.getElementById("loginPassword").value = "admin123@gmail.com";
      document.getElementById("loginEmail").classList.remove("is-invalid");
      document.getElementById("errLoginEmail").textContent = "";
      document.getElementById("loginPassword").classList.remove("is-invalid");
      document.getElementById("errLoginPassword").textContent = "";
    });
  });
})();
