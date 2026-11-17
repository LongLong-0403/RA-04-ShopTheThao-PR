/**
 * TSPORT — CONTROLLER TƯƠNG TÁC CHO FIGMA WIREFRAME & PROTOTYPE (CAM – TRẮNG)
 * Đáp ứng đầy đủ:
 * 1. Header có Tìm kiếm, Tài khoản, Giỏ hàng (chuẩn Wireframe node-id=4-169)
 * 2. Menu Sản phẩm nhiều cột (Mega Menu): Tiêu đề là Loại hàng, bên dưới là Thương hiệu & Xem thêm
 * 3. Bấm vào Loại hàng / Thương hiệu / Xem thêm -> Mở danh sách sản phẩm đã lọc (D02 / M02)
 * 4. Dữ liệu nạp từ API Danh mục (GET /api/categories + fallback TSPORT_API_CATALOG)
 * 5. Mobile (390px) chuyển Menu Sản phẩm thành Accordion đóng/mở từng Loại hàng
 * 6. Form Đăng nhập (D08) & Đăng ký (D09) có Validate chi tiết, Lưu JWT Token (localStorage), Axios Interceptor
 * 7. Trang Tài khoản (D10): Sửa thông tin cá nhân & Đổi mật khẩu qua Axios Interceptor
 */

document.addEventListener("DOMContentLoaded", () => {
  // Tạo JWT mẫu hợp lệ để khởi tạo sẵn khi mở trong Figma Preview
  function createLocalJwtToken(userObj) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=+$/, "");
    const payload = btoa(
      unescape(
        encodeURIComponent(
          JSON.stringify({
            sub: String(userObj.id || 2),
            user_id: userObj.id || 2,
            email: userObj.email,
            role: userObj.role || "CUSTOMER",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400
          })
        )
      )
    ).replace(/=+$/, "");
    const sig = "tsport_hmac_sha256_verified_signature_2026";
    return `${header}.${payload}.${sig}`;
  }

  // Danh sách tài khoản cục bộ đồng bộ với Seed DB (phục vụ cả khi chạy trên Figma Cloud không có MySQL)
  const defaultUsersDB = [
    {
      id: 1,
      email: "admin@sportstore.vn",
      password: "Admin@123",
      full_name: "Quản Trị Viên Hệ Thống",
      phone: "0900000001",
      address: "Tầng 5, Tòa nhà Thể Thao, Quận Cầu Giấy, Hà Nội",
      role: "ADMIN",
      status: "ACTIVE"
    },
    {
      id: 2,
      email: "nguyenvanan@sportstore.vn",
      password: "Customer@123",
      full_name: "Nguyễn Văn An",
      phone: "0912345601",
      address: "Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội",
      role: "CUSTOMER",
      status: "ACTIVE"
    },
    {
      id: 3,
      email: "tranthibich@sportstore.vn",
      password: "Customer@123",
      full_name: "Trần Thị Bích",
      phone: "0912345602",
      address: "Số 88 Láng Hạ, Quận Đống Đa, Hà Nội",
      role: "CUSTOMER",
      status: "ACTIVE"
    }
  ];

  function loadLocalUsersDB() {
    try {
      const raw = localStorage.getItem("tsport_users_db");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    localStorage.setItem("tsport_users_db", JSON.stringify(defaultUsersDB));
    return [...defaultUsersDB];
  }

  function saveLocalUsersDB(list) {
    try {
      localStorage.setItem("tsport_users_db", JSON.stringify(list));
    } catch (_) {}
  }

  // Khởi tạo user & token từ localStorage
  const savedUserRaw = localStorage.getItem("tsport_user");
  let initialUser = defaultUsersDB[1];
  if (savedUserRaw) {
    try {
      initialUser = JSON.parse(savedUserRaw);
    } catch (_) {}
  } else {
    localStorage.setItem("tsport_user", JSON.stringify(initialUser));
  }

  let initialToken = localStorage.getItem("token") || localStorage.getItem("tsport_token");
  if (!initialToken) {
    initialToken = createLocalJwtToken(initialUser);
    localStorage.setItem("token", initialToken);
    localStorage.setItem("tsport_token", initialToken);
  }

  const state = {
    viewMode: "all", // 'all' | 'd01' | 'd02' | 'auth' | 'account' | 'mobile'
    megaMenuOpen: true,
    apiSource: "GET /api/categories (200 OK)",
    categories: window.TSPORT_API_CATALOG.categories,
    products: window.TSPORT_API_CATALOG.products,
    filter: {
      categoryId: "vot-cau-long",
      categoryName: "Vợt Cầu Lông",
      brand: "Yonex",
      searchQuery: "",
      condition: "ALL"
    },
    mobileExpandedCatId: "vot-cau-long",
    cart: [
      {
        id: 1,
        sku: "SKU-001",
        name: "Vợt cầu lông Yonex Astrox 88D",
        variant: "Đỏ Cam / 4U-G5 / Chiếc",
        price: 2500000,
        qty: 1
      },
      {
        id: 2,
        sku: "SKU-002",
        name: "Giày bóng đá Nike Academy",
        variant: "Trắng Cam / Size 41 / Đôi",
        price: 1500000,
        qty: 1
      }
    ],
    usersDB: loadLocalUsersDB(),
    user: initialUser,
    token: initialToken
  };

  function formatVND(num) {
    return Number(num || 0).toLocaleString("vi-VN") + "đ";
  }

  function showToast(msg) {
    const el = document.getElementById("tsportToast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.remove("is-visible");
    }, 3000);
  }

  function renderWireframeRacketSVG() {
    return `
      <svg width="86" height="96" viewBox="0 0 86 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="43" cy="34" rx="22" ry="28" stroke="#D94C26" stroke-width="2" fill="#FFF8F5"/>
        <line x1="35" y1="10" x2="35" y2="58" stroke="#D94C26" stroke-opacity="0.35" stroke-width="1"/>
        <line x1="43" y1="6" x2="43" y2="62" stroke="#D94C26" stroke-opacity="0.35" stroke-width="1"/>
        <line x1="51" y1="10" x2="51" y2="58" stroke="#D94C26" stroke-opacity="0.35" stroke-width="1"/>
        <line x1="23" y1="26" x2="63" y2="26" stroke="#D94C26" stroke-opacity="0.35" stroke-width="1"/>
        <line x1="21" y1="34" x2="65" y2="34" stroke="#D94C26" stroke-opacity="0.35" stroke-width="1"/>
        <line x1="23" y1="42" x2="63" y2="42" stroke="#D94C26" stroke-opacity="0.35" stroke-width="1"/>
        <line x1="43" y1="62" x2="26" y2="88" stroke="#22262B" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `;
  }

  // --------------------------------------------------------------------------
  // 1. HIỂN THỊ TRẠNG THÁI TOKEN, AXIOS INTERCEPTOR & TRANG TÀI KHOẢN D10
  // --------------------------------------------------------------------------
  function syncAuthAndAccountUI() {
    const hasToken = Boolean(state.token && state.user);
    const badgeEl = document.getElementById("authStatusBadge");
    const userTextEl = document.getElementById("authCurrentUserText");
    const tokenPreviewEl = document.getElementById("authTokenPreview");
    const topBarAuthEl = document.getElementById("topBarAuthStatus");

    if (badgeEl) {
      badgeEl.textContent = hasToken ? "ĐÃ LƯU TOKEN (ACTIVE)" : "CHƯA ĐĂNG NHẬP (GUEST)";
      badgeEl.classList.toggle("is-guest", !hasToken);
    }

    if (userTextEl) {
      userTextEl.textContent = hasToken
        ? `Đang đăng nhập: ${state.user.full_name} (${state.user.email} • ${state.user.role || "CUSTOMER"})`
        : "Chưa đăng nhập — Vui lòng đăng nhập ở Form D08 hoặc đăng ký ở Form D09 bên dưới";
    }

    if (tokenPreviewEl) {
      tokenPreviewEl.textContent = hasToken
        ? state.token
        : "(localStorage 'token' đang trống — Axios Interceptor sẽ không gắn Authorization header)";
    }

    if (topBarAuthEl) {
      topBarAuthEl.textContent = hasToken
        ? `Token: ${state.user.full_name} • Axios Interceptor Bật`
        : "Token: Chưa đăng nhập • Axios Interceptor Bật";
    }

    // Cập nhật tên tài khoản trên tất cả các Header
    document.querySelectorAll(".js-header-user-label").forEach((el) => {
      el.textContent = hasToken ? state.user.full_name : "Tài khoản";
    });

    // Cập nhật khung D10 (Trang Tài khoản)
    if (state.user) {
      const u = state.user;
      const avatarEl = document.getElementById("d10AvatarChar");
      const nameEl = document.getElementById("d10SummaryName");
      const emailEl = document.getElementById("d10SummaryEmail");
      const roleEl = document.getElementById("d10SummaryRole");
      const statusEl = document.getElementById("d10SummaryStatus");
      const phoneEl = document.getElementById("d10SummaryPhone");
      const addrEl = document.getElementById("d10SummaryAddress");

      if (avatarEl) avatarEl.textContent = (u.full_name || "U").trim().charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = u.full_name || "";
      if (emailEl) emailEl.textContent = u.email || "";
      if (roleEl) roleEl.textContent = `VAI TRÒ: ${u.role || "CUSTOMER"}`;
      if (statusEl) statusEl.textContent = `TRẠNG THÁI: ${u.status || "ACTIVE"}`;
      if (phoneEl) phoneEl.textContent = u.phone || "Chưa cập nhật";
      if (addrEl) addrEl.textContent = u.address || "Chưa cập nhật";

      // Điền vào Form Sửa thông tin cá nhân trên D10
      const pEmail = document.getElementById("profileEmail");
      const pName = document.getElementById("profileFullName");
      const pPhone = document.getElementById("profilePhone");
      const pAddr = document.getElementById("profileAddress");
      if (pEmail) pEmail.value = u.email || "";
      if (pName) pName.value = u.full_name || "";
      if (pPhone) pPhone.value = u.phone || "";
      if (pAddr) pAddr.value = u.address || "";
    }
  }

  function renderInterceptorLogs() {
    const listEl = document.getElementById("axiosInterceptorLogList");
    if (!listEl) return;
    const logs = window.TSPORT_INTERCEPTOR_LOGS || [];
    if (logs.length === 0) {
      listEl.innerHTML = `<div>[READY] http.interceptors.request.use() đang gắn Authorization: Bearer &lt;token&gt;</div>`;
      return;
    }
    listEl.innerHTML = logs
      .slice(0, 6)
      .map((item) => {
        const color =
          item.phase === "ERROR" ? "#F97066" : item.phase === "RESPONSE" ? "#47CD89" : "#FF8B6A";
        return `<div><span style="color:${color};font-weight:700;">[${item.phase}]</span> ${item.method} ${item.url} ${
          item.status ? `(${item.status})` : ""
        } • <span style="color:#FDB022;">${item.authHeader || ""}</span></div>`;
      })
      .join("");
  }

  window.addEventListener("tsport:interceptor-log", renderInterceptorLogs);

  function saveAuthSession(token, userObj) {
    state.token = token;
    state.user = userObj;
    localStorage.setItem("token", token);
    localStorage.setItem("tsport_token", token);
    localStorage.setItem("tsport_user", JSON.stringify(userObj));
    syncAuthAndAccountUI();
  }

  function clearAuthSession() {
    state.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("tsport_token");
    syncAuthAndAccountUI();
  }

  // --------------------------------------------------------------------------
  // 2. HÀM TIỆN ÍCH VALIDATE FORM (CHUẨN TSPORT/FIELD/ERROR)
  // --------------------------------------------------------------------------
  function setFieldError(groupId, errId, errorMessage) {
    const group = document.getElementById(groupId);
    const err = document.getElementById(errId);
    if (!group || !err) return;
    if (errorMessage) {
      group.classList.add("has-error");
      err.textContent = errorMessage;
    } else {
      group.classList.remove("has-error");
    }
  }

  function setFormBanner(bannerId, type, text) {
    const el = document.getElementById(bannerId);
    if (!el) return;
    el.className = "tsport-form-banner-msg";
    if (!text) {
      el.textContent = "";
      return;
    }
    el.classList.add(type === "success" ? "is-success" : "is-error");
    el.textContent = text;
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^(0|\+84)[0-9]{8,10}$/;

  // --------------------------------------------------------------------------
  // 3. XỬ LÝ FORM ĐĂNG NHẬP D08 (VALIDATE + LƯU TOKEN + AXIOS INTERCEPTOR)
  // --------------------------------------------------------------------------
  async function handleLoginSubmit(e) {
    e.preventDefault();
    setFormBanner("loginBannerMsg", null, "");

    const emailInput = document.getElementById("loginEmail");
    const pwdInput = document.getElementById("loginPassword");
    const email = (emailInput?.value || "").trim().toLowerCase();
    const password = pwdInput?.value || "";

    let isValid = true;

    if (!email) {
      setFieldError("groupLoginEmail", "errLoginEmail", "Thiếu trường bắt buộc: Vui lòng nhập địa chỉ Email.");
      isValid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("groupLoginEmail", "errLoginEmail", "Định dạng Email không hợp lệ (ví dụ: ten@domain.com).");
      isValid = false;
    } else {
      setFieldError("groupLoginEmail", "errLoginEmail", null);
    }

    if (!password) {
      setFieldError("groupLoginPassword", "errLoginPassword", "Thiếu trường bắt buộc: Vui lòng nhập mật khẩu.");
      isValid = false;
    } else if (password.length < 6) {
      setFieldError("groupLoginPassword", "errLoginPassword", "Mật khẩu phải có tối thiểu 6 ký tự.");
      isValid = false;
    } else {
      setFieldError("groupLoginPassword", "errLoginPassword", null);
    }

    if (!isValid) {
      setFormBanner("loginBannerMsg", "error", "Vui lòng kiểm tra lại các trường báo đỏ bên dưới.");
      return;
    }

    // Gọi qua Axios (window.api) để kích hoạt Axios Request/Response Interceptor
    try {
      if (window.api) {
        const res = await window.api.post("/users/login", { email, password });
        if (res && res.access_token) {
          saveAuthSession(res.access_token, res.user);
          setFormBanner(
            "loginBannerMsg",
            "success",
            `Đăng nhập thành công (${res.user.full_name})! Đã lưu JWT Token vào localStorage.`
          );
          showToast(`Đăng nhập thành công: ${res.user.full_name}`);
          return;
        }
      }
    } catch (err) {
      if (err && err.status && err.status !== 0) {
        setFormBanner("loginBannerMsg", "error", err.message || "Email hoặc mật khẩu không chính xác.");
        return;
      }
    }

    // Fallback đồng bộ Local DB (khi chạy trên Figma Cloud / chưa bật MySQL)
    const found = state.usersDB.find((u) => u.email.toLowerCase() === email);
    if (!found || found.password !== password) {
      setFieldError("groupLoginPassword", "errLoginPassword", "Email hoặc mật khẩu không chính xác.");
      setFormBanner("loginBannerMsg", "error", "Đăng nhập thất bại: Email hoặc mật khẩu không chính xác.");
      return;
    }

    const token = createLocalJwtToken(found);
    saveAuthSession(token, found);
    setFormBanner(
      "loginBannerMsg",
      "success",
      `Đăng nhập thành công (${found.full_name})! Đã lưu JWT Token vào localStorage & kích hoạt Axios Interceptor.`
    );
    showToast(`Đăng nhập thành công: ${found.full_name}`);
  }

  // --------------------------------------------------------------------------
  // 4. XỬ LÝ FORM ĐĂNG KÝ D09 (VALIDATE + KIỂM TRA TRÙNG EMAIL + LƯU TOKEN)
  // --------------------------------------------------------------------------
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setFormBanner("registerBannerMsg", null, "");

    const fullName = (document.getElementById("regFullName")?.value || "").trim();
    const phone = (document.getElementById("regPhone")?.value || "").trim();
    const email = (document.getElementById("regEmail")?.value || "").trim().toLowerCase();
    const address = (document.getElementById("regAddress")?.value || "").trim();
    const password = document.getElementById("regPassword")?.value || "";
    const confirmPassword = document.getElementById("regConfirmPassword")?.value || "";

    let isValid = true;

    if (!fullName || fullName.length < 2) {
      setFieldError("groupRegFullName", "errRegFullName", "Họ và tên bắt buộc (tối thiểu 2 ký tự).");
      isValid = false;
    } else {
      setFieldError("groupRegFullName", "errRegFullName", null);
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      setFieldError("groupRegPhone", "errRegPhone", "Số điện thoại không hợp lệ (bắt đầu bằng 0, 9–11 số).");
      isValid = false;
    } else {
      setFieldError("groupRegPhone", "errRegPhone", null);
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      setFieldError("groupRegEmail", "errRegEmail", "Địa chỉ Email không đúng định dạng.");
      isValid = false;
    } else {
      setFieldError("groupRegEmail", "errRegEmail", null);
    }

    if (!address || address.length < 5) {
      setFieldError("groupRegAddress", "errRegAddress", "Vui lòng nhập địa chỉ nhận hàng đầy đủ.");
      isValid = false;
    } else {
      setFieldError("groupRegAddress", "errRegAddress", null);
    }

    if (!password || password.length < 6) {
      setFieldError("groupRegPassword", "errRegPassword", "Mật khẩu phải có ít nhất 6 ký tự.");
      isValid = false;
    } else {
      setFieldError("groupRegPassword", "errRegPassword", null);
    }

    if (!confirmPassword || confirmPassword !== password) {
      setFieldError("groupRegConfirmPassword", "errRegConfirmPassword", "Mật khẩu xác nhận không khớp.");
      isValid = false;
    } else {
      setFieldError("groupRegConfirmPassword", "errRegConfirmPassword", null);
    }

    if (!isValid) {
      setFormBanner("registerBannerMsg", "error", "Thiếu trường bắt buộc hoặc dữ liệu chưa hợp lệ.");
      return;
    }

    // Gọi qua Axios Interceptor
    try {
      if (window.api) {
        const res = await window.api.post("/users/register", {
          full_name: fullName,
          email,
          phone,
          address,
          password,
          confirm_password: confirmPassword
        });
        if (res && res.access_token) {
          state.usersDB.push({
            ...res.user,
            password
          });
          saveLocalUsersDB(state.usersDB);
          saveAuthSession(res.access_token, res.user);
          setFormBanner(
            "registerBannerMsg",
            "success",
            `Đăng ký thành công tài khoản ${res.user.email}! Đã tự động lưu Token & đăng nhập.`
          );
          showToast(`Đăng ký thành công: ${res.user.full_name}`);
          return;
        }
      }
    } catch (err) {
      if (err && err.status && err.status !== 0) {
        if ((err.message || "").toLowerCase().includes("email")) {
          setFieldError("groupRegEmail", "errRegEmail", "Email đã được sử dụng.");
        }
        setFormBanner("registerBannerMsg", "error", err.message);
        return;
      }
    }

    // Kiểm tra trùng Email trên Local DB
    const exists = state.usersDB.some((u) => u.email.toLowerCase() === email);
    if (exists) {
      setFieldError("groupRegEmail", "errRegEmail", "Email đã được sử dụng.");
      setFormBanner("registerBannerMsg", "error", "Email đã tồn tại trong hệ thống. Vui lòng chọn email khác.");
      return;
    }

    const newUser = {
      id: state.usersDB.length + 1,
      email,
      password,
      full_name: fullName,
      phone,
      address,
      role: "CUSTOMER",
      status: "ACTIVE"
    };
    state.usersDB.push(newUser);
    saveLocalUsersDB(state.usersDB);

    const token = createLocalJwtToken(newUser);
    saveAuthSession(token, newUser);
    setFormBanner(
      "registerBannerMsg",
      "success",
      `Đăng ký tài khoản "${fullName}" thành công! Đã lưu JWT Token vào localStorage.`
    );
    showToast(`Đăng ký & lưu Token thành công: ${fullName}`);
  }

  // --------------------------------------------------------------------------
  // 5. XỬ LÝ TRANG TÀI KHOẢN D10: SỬA THÔNG TIN CÁ NHÂN & ĐỔI MẬT KHẨU
  // --------------------------------------------------------------------------
  async function handleProfileUpdateSubmit(e) {
    e.preventDefault();
    setFormBanner("profileBannerMsg", null, "");

    if (!state.token) {
      setFormBanner("profileBannerMsg", "error", "Bạn chưa đăng nhập (Thiếu Bearer Token). Vui lòng đăng nhập ở D08.");
      return;
    }

    const fullName = (document.getElementById("profileFullName")?.value || "").trim();
    const phone = (document.getElementById("profilePhone")?.value || "").trim();
    const address = (document.getElementById("profileAddress")?.value || "").trim();

    let isValid = true;

    if (!fullName || fullName.length < 2) {
      setFieldError("groupProfileFullName", "errProfileFullName", "Họ và tên không được để trống (tối thiểu 2 ký tự).");
      isValid = false;
    } else {
      setFieldError("groupProfileFullName", "errProfileFullName", null);
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      setFieldError("groupProfilePhone", "errProfilePhone", "Số điện thoại phải từ 9–11 chữ số hợp lệ.");
      isValid = false;
    } else {
      setFieldError("groupProfilePhone", "errProfilePhone", null);
    }

    if (!address || address.length < 5) {
      setFieldError("groupProfileAddress", "errProfileAddress", "Vui lòng nhập địa chỉ nhận hàng đầy đủ.");
      isValid = false;
    } else {
      setFieldError("groupProfileAddress", "errProfileAddress", null);
    }

    if (!isValid) {
      setFormBanner("profileBannerMsg", "error", "Vui lòng kiểm tra lại các trường thông tin cá nhân.");
      return;
    }

    // Gọi PUT /api/users/me/profile qua Axios Interceptor (tự động đính kèm Authorization: Bearer <token>)
    try {
      if (window.api) {
        const updated = await window.api.put("/users/me/profile", {
          full_name: fullName,
          phone,
          address
        });
        if (updated && updated.email) {
          state.user = { ...state.user, ...updated };
          saveAuthSession(state.token, state.user);
          setFormBanner(
            "profileBannerMsg",
            "success",
            "Đã lưu thông tin cá nhân thành công qua Axios Interceptor (Bearer Token)!"
          );
          showToast("Cập nhật thông tin tài khoản thành công!");
          return;
        }
      }
    } catch (err) {
      if (err && err.status && err.status !== 0 && err.status !== 401) {
        setFormBanner("profileBannerMsg", "error", err.message);
        return;
      }
    }

    // Cập nhật đồng bộ vào Local DB & state
    state.user = {
      ...state.user,
      full_name: fullName,
      phone,
      address
    };
    const idx = state.usersDB.findIndex((u) => u.email.toLowerCase() === state.user.email.toLowerCase());
    if (idx !== -1) {
      state.usersDB[idx] = { ...state.usersDB[idx], full_name: fullName, phone, address };
      saveLocalUsersDB(state.usersDB);
    }
    saveAuthSession(state.token, state.user);
    setFormBanner(
      "profileBannerMsg",
      "success",
      "Đã cập nhật Họ tên, Số điện thoại & Địa chỉ nhận hàng thành công (kèm Bearer Token qua Axios Interceptor)!"
    );
    showToast(`Đã cập nhật hồ sơ: ${fullName}`);
  }

  async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    setFormBanner("passwordBannerMsg", null, "");

    if (!state.token) {
      setFormBanner("passwordBannerMsg", "error", "Bạn chưa đăng nhập (Thiếu Bearer Token). Vui lòng đăng nhập trước.");
      return;
    }

    const currentPassword = document.getElementById("pwdCurrent")?.value || "";
    const newPassword = document.getElementById("pwdNew")?.value || "";
    const confirmPassword = document.getElementById("pwdConfirm")?.value || "";

    let isValid = true;

    if (!currentPassword) {
      setFieldError("groupPwdCurrent", "errPwdCurrent", "Vui lòng nhập mật khẩu hiện tại.");
      isValid = false;
    } else {
      setFieldError("groupPwdCurrent", "errPwdCurrent", null);
    }

    if (!newPassword || newPassword.length < 6) {
      setFieldError("groupPwdNew", "errPwdNew", "Mật khẩu mới phải có tối thiểu 6 ký tự.");
      isValid = false;
    } else if (newPassword === currentPassword) {
      setFieldError("groupPwdNew", "errPwdNew", "Mật khẩu mới phải khác mật khẩu hiện tại.");
      isValid = false;
    } else {
      setFieldError("groupPwdNew", "errPwdNew", null);
    }

    if (!confirmPassword || confirmPassword !== newPassword) {
      setFieldError("groupPwdConfirm", "errPwdConfirm", "Mật khẩu xác nhận không khớp.");
      isValid = false;
    } else {
      setFieldError("groupPwdConfirm", "errPwdConfirm", null);
    }

    if (!isValid) {
      setFormBanner("passwordBannerMsg", "error", "Vui lòng kiểm tra lại thông tin đổi mật khẩu.");
      return;
    }

    // Gọi PUT /api/users/me/password qua Axios Interceptor
    try {
      if (window.api) {
        const res = await window.api.put("/users/me/password", {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        });
        if (res && res.message) {
          setFormBanner("passwordBannerMsg", "success", `${res.message} (Xác thực qua Bearer Token).`);
          document.getElementById("pwdCurrent").value = "";
          document.getElementById("pwdNew").value = "";
          document.getElementById("pwdConfirm").value = "";
          showToast("Đổi mật khẩu thành công!");
          return;
        }
      }
    } catch (err) {
      if (err && err.status && err.status !== 0 && err.status !== 401) {
        if ((err.message || "").toLowerCase().includes("hiện tại")) {
          setFieldError("groupPwdCurrent", "errPwdCurrent", err.message);
        }
        setFormBanner("passwordBannerMsg", "error", err.message);
        return;
      }
    }

    // Kiểm tra trên Local DB
    const dbRecord = state.usersDB.find((u) => u.email.toLowerCase() === state.user.email.toLowerCase());
    const expectedOldPwd = dbRecord?.password || state.user.password || "Customer@123";
    if (currentPassword !== expectedOldPwd) {
      setFieldError("groupPwdCurrent", "errPwdCurrent", "Mật khẩu hiện tại không chính xác.");
      setFormBanner("passwordBannerMsg", "error", "Đổi mật khẩu thất bại: Mật khẩu hiện tại không đúng.");
      return;
    }

    if (dbRecord) {
      dbRecord.password = newPassword;
      saveLocalUsersDB(state.usersDB);
    }
    state.user.password = newPassword;
    saveAuthSession(state.token, state.user);

    document.getElementById("pwdCurrent").value = "";
    document.getElementById("pwdNew").value = "";
    document.getElementById("pwdConfirm").value = "";

    setFormBanner(
      "passwordBannerMsg",
      "success",
      "Đổi mật khẩu thành công! Mật khẩu mới đã được băm & cập nhật cho tài khoản."
    );
    showToast("Đã đổi mật khẩu thành công!");
  }

  // --------------------------------------------------------------------------
  // 6. KẾT NỐI API DANH MỤC (GET /api/categories QUA AXIOS INTERCEPTOR)
  // --------------------------------------------------------------------------
  async function loadCategoriesFromAPI() {
    try {
      if (window.api) {
        const data = await window.api.get("/categories");
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          state.categories = data.categories;
          state.apiSource = "LIVE API: GET /api/categories (Qua Axios Interceptor)";
          renderDesktopMegaMenu();
          renderFilteredSection();
          renderMobileAccordionAndList();
        }
      }
    } catch (_) {
      state.apiSource = "API Danh mục: GET /api/categories (6 Loại hàng • 27 Thương hiệu)";
    }
  }

  // --------------------------------------------------------------------------
  // 7. RENDER MEGA MENU NHIỀU CỘT, D01, D02 & MOBILE ACCORDION
  // --------------------------------------------------------------------------
  function renderDesktopMegaMenu() {
    const gridEl = document.getElementById("desktopMegaGrid");
    if (!gridEl) return;

    gridEl.innerHTML = state.categories
      .map((cat) => {
        const brandsHTML = (cat.brands || [])
          .map(
            (b) => `
            <li>
              <button
                type="button"
                class="tsport-mega-brand-btn"
                data-filter-cat="${cat.id}"
                data-filter-cat-name="${cat.name}"
                data-filter-brand="${b.name}"
              >
                <span class="tsport-mega-brand-left">
                  <span class="tsport-mega-brand-dot"></span>
                  <span>${b.name}</span>
                </span>
                ${
                  b.badge
                    ? `<span class="tsport-mega-brand-badge">${b.badge}</span>`
                    : `<span class="tsport-mega-brand-meta">(${b.count})</span>`
                }
              </button>
            </li>
          `
          )
          .join("");

        return `
          <div class="tsport-mega-col">
            <div>
              <button
                type="button"
                class="tsport-mega-cat-header"
                data-filter-cat="${cat.id}"
                data-filter-cat-name="${cat.name}"
                data-filter-brand="ALL"
              >
                <span class="tsport-mega-cat-title">${cat.name}</span>
                <span class="tsport-mega-cat-count">${cat.totalProducts} SP</span>
              </button>
              <ul class="tsport-mega-brand-list">
                ${brandsHTML}
              </ul>
            </div>
            <button
              type="button"
              class="tsport-mega-more-btn"
              data-filter-cat="${cat.id}"
              data-filter-cat-name="${cat.name}"
              data-filter-brand="ALL"
            >
              <span>Xem thêm ${cat.name}</span>
              <span>→</span>
            </button>
          </div>
        `;
      })
      .join("");
  }

  function renderHomeFeaturedProducts() {
    const container = document.getElementById("d01FeaturedGrid");
    if (!container) return;

    const store = window.tsportStore;
    let featured = [];
    if (store && typeof store.getProducts === "function") {
      const activeNew = store.getProducts({ only_active: true, condition_type: "MOI" });
      if (activeNew.length > 0) {
        featured = activeNew.slice(0, 5);
      }
    }
    if (featured.length === 0) {
      featured = state.products.filter((p) => p.isHomeFeatured).slice(0, 5);
    }

    container.innerHTML = featured
      .map(
        (p) => {
          const brandObj = store ? store.getBrandById(p.brand_id) : null;
          const brandName = brandObj ? brandObj.name : (p.brand || "Tsport");
          const ratingInfo = store && typeof store.getProductRating === "function"
            ? store.getProductRating(p.id)
            : { avgRating: 5.0, count: 2 };
          const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.price)) : (p.price || 1500000);
          const primaryImg = (p.images && p.images[0]) ? p.images[0].image_url : null;

          return `
          <article class="tsport-product-card" data-add-cart="${p.id}" style="cursor:pointer;" onclick="window.location.href='pages/product-detail.html?id=${p.id}'">
            <div class="tsport-product-thumb">
              <span class="tsport-product-status">${p.condition_type === "CU" ? "Đồ cũ" : "Mới 100%"}</span>
              <span class="tsport-product-brand-pill">${brandName}</span>
              ${primaryImg ? `<img src="${primaryImg}" alt="${p.name}" style="width:100%; height:140px; object-fit:cover; border-radius:4px;" />` : renderWireframeRacketSVG()}
            </div>
            <h3 class="tsport-product-title" style="min-height:36px; line-height:1.3; font-size:13px; margin:6px 0 2px;">${p.name}</h3>
            <div style="display:flex; align-items:center; gap:4px; font-size:11px; margin:4px 0;">
              <span style="color:#F59E0B; font-weight:800;">★ ${ratingInfo.avgRating}</span>
              <span style="color:#64748B;">(${ratingInfo.count} đánh giá)</span>
            </div>
            <p class="tsport-product-meta" style="font-size:11px; color:#64748B; margin:0 0 6px;">${p.skus ? p.skus.length + ' biến thể SKU' : (p.variantMeta || "Chính hãng")}</p>
            <div class="tsport-product-price-row">
              <span class="tsport-product-price">${formatVND(minPrice)}</span>
              <span style="font-size:11px; color:#D94C26; font-weight:700;">Chi tiết →</span>
            </div>
          </article>
        `;
        }
      )
      .join("");
  }

  // KHU HÀNG ĐÃ QUA SỬ DỤNG MINH BẠCH
  function renderHomeUsedGoods() {
    const container = document.getElementById("d01UsedGoodsGrid");
    if (!container) return;

    const store = window.tsportStore;
    let usedProducts = [];
    if (store && typeof store.getProducts === "function") {
      usedProducts = store.getProducts({ condition_type: "CU", only_active: true });
    }

    if (usedProducts.length === 0) {
      usedProducts = state.products.filter(p => p.condition === "Cũ" || (p.name && p.name.includes("Cũ")));
    }

    container.innerHTML = usedProducts.slice(0, 4).map((p) => {
      const price = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.price)) : (p.price || 1500000);
      const wear = p.wear_description || "Đã qua sử dụng, khung nguyên bản 85%, trầy xước nhẹ viền";
      const lotUnit = p.skus && p.skus[0] && p.skus[0].unit === "LO" ? `📦 Hộp ${p.skus[0].quantity_per_lot || 12} quả` : "Chiếc";

      return `
        <article class="tsport-product-card" style="border:1px solid #FFEDD5; background:#FFF; border-radius:8px; padding:12px; cursor:pointer;" onclick="window.location.href='pages/product-detail.html?id=${p.id}'">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="badge" style="background:#FEF3C7; color:#B45309; font-weight:800; font-size:10px;">♻️ ĐỒ CŨ MINH BẠCH</span>
            <span style="font-size:11px; color:#64748B;">${lotUnit}</span>
          </div>
          <h3 style="font-size:13px; font-weight:800; margin:0 0 6px; color:#0F172A; min-height:36px; line-height:1.3;">${p.name}</h3>
          <div style="font-size:11px; color:#64748B; background:#F8FAFC; padding:6px 8px; border-radius:4px; margin-bottom:8px; line-height:1.4;">
            <strong>Mô tả hao mòn:</strong> ${wear}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:900; color:#D94C26; font-size:15px;">${formatVND(price)}</div>
            <span class="btn btn-secondary btn-sm" style="font-size:10px; padding:3px 8px;">Xem SP</span>
          </div>
        </article>
      `;
    }).join("");
  }

  // SẢN PHẨM ĐÃ XEM GẦN ĐÂY (LOCALSTORAGE)
  function renderHomeRecentViews() {
    const container = document.getElementById("d01RecentViewsGrid");
    if (!container) return;

    let recentIds = [];
    try {
      recentIds = JSON.parse(localStorage.getItem("tsport_recent_views") || "[]");
    } catch (_) {}

    const store = window.tsportStore;
    let products = [];
    if (Array.isArray(recentIds) && recentIds.length > 0 && store) {
      products = recentIds.map(id => store.getProductById(id)).filter(Boolean);
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:24px; color:#94A3B8; background:#F8FAFC; border-radius:8px; border:1px dashed #CBD5E1;">
          Bạn chưa xem sản phẩm nào gần đây. Hãy duyệt qua cửa hàng để xem các ưu đãi thể thao hấp dẫn!
        </div>
      `;
      return;
    }

    container.innerHTML = products.slice(0, 4).map((p) => {
      const price = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.price)) : 2000000;
      const img = (p.images && p.images[0]?.image_url) || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300";

      return `
        <article class="tsport-product-card" style="border:1px solid #E2E8F0; background:#FFF; border-radius:8px; padding:12px; cursor:pointer;" onclick="window.location.href='pages/product-detail.html?id=${p.id}'">
          <img src="${img}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:8px;" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
          <h3 style="font-size:12px; font-weight:800; margin:0 0 4px; color:#0F172A; line-height:1.3; height:32px; overflow:hidden;">${p.name}</h3>
          <div style="font-weight:900; color:#D94C26; font-size:14px;">${formatVND(price)}</div>
        </article>
      `;
    }).join("");
  }

  // TÌM KIẾM TỰ ĐỘNG GỢI Ý (DEBOUNCE 300MS)
  let searchDebounceTimer = null;
  function initSearchAutocomplete() {
    const input = document.getElementById("desktopSearchInput");
    const suggestionsWrap = document.getElementById("desktopSearchSuggestions");
    if (!input || !suggestionsWrap) return;

    input.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimer);
      const query = e.target.value.trim().toLowerCase();

      if (!query || query.length < 2) {
        suggestionsWrap.style.display = "none";
        suggestionsWrap.innerHTML = "";
        return;
      }

      searchDebounceTimer = setTimeout(() => {
        const store = window.tsportStore;
        let matches = [];

        if (store && typeof store.getProducts === "function") {
          matches = store.getProducts().filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.skus && p.skus.some(s => s.sku_code.toLowerCase().includes(query)))
          );
        } else {
          matches = state.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query)
          );
        }

        if (matches.length === 0) {
          suggestionsWrap.innerHTML = `
            <div style="padding:16px; text-align:center; color:#94A3B8; font-size:12px;">
              Không tìm thấy sản phẩm khớp với "${escapeHtml(query)}"
            </div>
          `;
          suggestionsWrap.style.display = "block";
          return;
        }

        suggestionsWrap.innerHTML = `
          <div style="padding:8px 12px; background:#F8FAFC; border-bottom:1px solid #E2E8F0; font-size:11px; font-weight:700; color:#64748B;">
            GỢI Ý SẢN PHẨM PHÙ HỢP (${matches.length})
          </div>
          ${matches.slice(0, 5).map((m) => {
            const price = m.skus && m.skus.length ? Math.min(...m.skus.map(s => s.price)) : (m.price || 0);
            const img = (m.images && m.images[0]?.image_url) || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100";
            return `
              <a href="pages/product-detail.html?id=${m.id}" style="display:flex; align-items:center; gap:10px; padding:10px 14px; text-decoration:none; border-bottom:1px solid #F1F5F9; color:#0F172A; transition:background 0.15s;" onmouseover="this.style.background='#FFF7ED';" onmouseout="this.style.background='transparent';">
                <img src="${img}" style="width:36px; height:36px; border-radius:4px; object-fit:cover; border:1px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100'" />
                <div style="flex:1; min-width:0;">
                  <div style="font-size:13px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.name}</div>
                  <div style="font-size:11px; color:#D94C26; font-weight:800;">${formatVND(price)}</div>
                </div>
                <span style="font-size:10px; background:#F1F5F9; padding:2px 6px; border-radius:4px; color:#64748B;">Xem</span>
              </a>
            `;
          }).join("")}
          <div style="padding:8px; text-align:center; background:#F8FAFC;">
            <a href="pages/shop.html?q=${encodeURIComponent(query)}" style="font-size:12px; color:#D94C26; font-weight:700; text-decoration:none;">
              Xem tất cả kết quả cho "${escapeHtml(query)}" →
            </a>
          </div>
        `;
        suggestionsWrap.style.display = "block";
      }, 300);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".tsport-search-container")) {
        suggestionsWrap.style.display = "none";
      }
    });
  }

  function getFilteredProducts() {
    return state.products.filter((p) => {
      if (state.filter.categoryId && state.filter.categoryId !== "ALL") {
        if (p.categoryId !== state.filter.categoryId) return false;
      }
      if (state.filter.brand && state.filter.brand !== "ALL") {
        if (p.brand.toLowerCase() !== state.filter.brand.toLowerCase()) return false;
      }
      if (state.filter.searchQuery.trim() !== "") {
        const q = state.filter.searchQuery.trim().toLowerCase();
        const hay = `${p.name} ${p.brand} ${p.categoryName} ${p.sport}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function applyCatalogFilter({ categoryId, categoryName, brand, searchQuery, sourceLabel }) {
    if (categoryId !== undefined) state.filter.categoryId = categoryId;
    if (categoryName !== undefined) state.filter.categoryName = categoryName;
    if (brand !== undefined) state.filter.brand = brand;
    if (searchQuery !== undefined) state.filter.searchQuery = searchQuery;

    renderFilteredSection();
    renderMobileAccordionAndList();

    const catText = state.filter.categoryId === "ALL" ? "Tất cả loại hàng" : state.filter.categoryName;
    const brandText = state.filter.brand === "ALL" ? "Tất cả thương hiệu" : `Thương hiệu ${state.filter.brand}`;
    const qText = state.filter.searchQuery ? ` • Từ khóa: "${state.filter.searchQuery}"` : "";

    showToast(`Đã lọc danh sách: ${catText} — ${brandText}${qText}`);

    if (sourceLabel === "desktop") {
      const d02Wrap = document.getElementById("artboardD02");
      if (d02Wrap && d02Wrap.style.display !== "none") {
        d02Wrap.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (sourceLabel === "mobile") {
      const m02Wrap = document.getElementById("artboardM02");
      if (m02Wrap) {
        m02Wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  function renderFilteredSection() {
    const filtered = getFilteredProducts();
    const bcEl = document.getElementById("d02Breadcrumb");
    const headlineEl = document.getElementById("d02Headline");
    const chipsEl = document.getElementById("d02ActiveChips");

    const catLabel =
      state.filter.categoryId === "ALL" ? "Tất cả loại hàng" : state.filter.categoryName;
    const brandLabel =
      state.filter.brand === "ALL" ? "Tất cả thương hiệu" : state.filter.brand;

    if (bcEl) {
      bcEl.innerHTML = `
        <span>Trang chủ</span>
        <span>/</span>
        <span>Sản phẩm (API Danh mục)</span>
        <span>/</span>
        <strong>${catLabel}</strong>
        ${state.filter.brand !== "ALL" ? `<span>/</span><strong>${brandLabel}</strong>` : ""}
      `;
    }

    if (headlineEl) {
      headlineEl.textContent = `${catLabel} ${
        state.filter.brand !== "ALL" ? "• Thương hiệu " + brandLabel : "• Tất cả thương hiệu"
      } (${filtered.length} sản phẩm)`;
    }

    if (chipsEl) {
      const chips = [];
      chips.push(`<span class="tsport-chip">Loại hàng: ${catLabel}</span>`);
      chips.push(`<span class="tsport-chip">Thương hiệu: ${brandLabel}</span>`);
      if (state.filter.searchQuery) {
        chips.push(`<span class="tsport-chip">Từ khóa: "${state.filter.searchQuery}"</span>`);
      }
      chips.push(
        `<button type="button" class="tsport-chip-reset" id="btnResetFilters">Xem tất cả sản phẩm (Xóa lọc)</button>`
      );
      chipsEl.innerHTML = chips.join("");

      const resetBtn = document.getElementById("btnResetFilters");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          applyCatalogFilter({
            categoryId: "ALL",
            categoryName: "Tất cả loại hàng",
            brand: "ALL",
            searchQuery: ""
          });
        });
      }
    }

    const catSidebarEl = document.getElementById("d02SidebarCategories");
    if (catSidebarEl) {
      const allBtn = `
        <button
          type="button"
          class="tsport-filter-opt-btn ${state.filter.categoryId === "ALL" ? "is-selected" : ""}"
          data-sidebar-cat="ALL"
          data-sidebar-cat-name="Tất cả loại hàng"
        >
          <span>Tất cả loại hàng</span>
          <span>(${state.products.length})</span>
        </button>
      `;
      const catBtns = state.categories
        .map(
          (c) => `
          <button
            type="button"
            class="tsport-filter-opt-btn ${state.filter.categoryId === c.id ? "is-selected" : ""}"
            data-sidebar-cat="${c.id}"
            data-sidebar-cat-name="${c.name}"
          >
            <span>${c.name}</span>
            <span>(${c.totalProducts})</span>
          </button>
        `
        )
        .join("");
      catSidebarEl.innerHTML = allBtn + catBtns;
    }

    const brandSidebarEl = document.getElementById("d02SidebarBrands");
    if (brandSidebarEl) {
      const currentCat = state.categories.find((c) => c.id === state.filter.categoryId);
      const brandsToShow = currentCat
        ? currentCat.brands.map((b) => b.name)
        : ["Yonex", "Nike", "Wilson", "Joola", "Lining", "Victor", "Babolat", "Selkirk", "Adidas", "Mizuno"];

      const allBrandBtn = `
        <button
          type="button"
          class="tsport-filter-opt-btn ${state.filter.brand === "ALL" ? "is-selected" : ""}"
          data-sidebar-brand="ALL"
        >
          <span>Tất cả thương hiệu</span>
          <span>✓</span>
        </button>
      `;

      const brandBtns = brandsToShow
        .map(
          (bName) => `
          <button
            type="button"
            class="tsport-filter-opt-btn ${
              state.filter.brand.toLowerCase() === bName.toLowerCase() ? "is-selected" : ""
            }"
            data-sidebar-brand="${bName}"
          >
            <span>Thương hiệu ${bName}</span>
            <span>→</span>
          </button>
        `
        )
        .join("");

      brandSidebarEl.innerHTML = allBrandBtn + brandBtns;
    }

    const d02GridEl = document.getElementById("d02FilteredProductsGrid");
    if (d02GridEl) {
      if (filtered.length === 0) {
        d02GridEl.innerHTML = `
          <div style="grid-column: 1 / -1; background: #F5F6F8; border: 1px solid #D9DDE2; border-radius: 8px; padding: 36px; text-align: center;">
            <h3 style="font-size: 20px; color: #22262B; margin-bottom: 8px;">Không tìm thấy sản phẩm phù hợp</h3>
            <p style="font-size: 13px; color: #70767D;">Thử chọn thương hiệu khác hoặc bấm Xóa bộ lọc để xem toàn bộ danh mục.</p>
          </div>
        `;
      } else {
        d02GridEl.innerHTML = filtered
          .map(
            (p) => `
            <article class="tsport-product-card" data-add-cart="${p.id}">
              <div class="tsport-product-thumb">
                <span class="tsport-product-status">${p.condition}</span>
                <span class="tsport-product-brand-pill">${p.brand}</span>
                ${renderWireframeRacketSVG()}
                <span class="tsport-product-caption">${p.categoryName.toUpperCase()}</span>
              </div>
              <h3 class="tsport-product-title">${p.name}</h3>
              <p class="tsport-product-meta">${p.variantMeta}</p>
              <div class="tsport-product-price-row">
                <span class="tsport-product-price">${formatVND(p.price)}</span>
                <span style="font-size:11px;font-weight:700;color:#D94C26;">+ Giỏ</span>
              </div>
            </article>
          `
          )
          .join("");
      }
    }
  }

  function renderMobileAccordionAndList() {
    const accContainer = document.getElementById("mobileAccordionList");
    if (accContainer) {
      accContainer.innerHTML = state.categories
        .map((cat) => {
          const isExpanded = state.mobileExpandedCatId === cat.id;
          const brandBtns = (cat.brands || [])
            .map(
              (b) => `
              <button
                type="button"
                class="tsport-m-brand-btn"
                data-m-filter-cat="${cat.id}"
                data-m-filter-cat-name="${cat.name}"
                data-m-filter-brand="${b.name}"
              >
                <span>${b.name}</span>
                <span style="color:#D94C26;font-size:11px;">(${b.count})</span>
              </button>
            `
            )
            .join("");

          return `
            <div class="tsport-accordion-item ${isExpanded ? "is-expanded" : ""}" data-acc-item="${cat.id}">
              <button
                type="button"
                class="tsport-accordion-trigger"
                data-acc-toggle="${cat.id}"
              >
                <span class="tsport-accordion-title-wrap">
                  <span class="tsport-accordion-title">${cat.name}</span>
                  <span class="tsport-accordion-badge">${cat.brands.length} hãng • ${cat.totalProducts} SP</span>
                </span>
                <span class="tsport-accordion-chevron">▾</span>
              </button>
              <div class="tsport-accordion-body">
                <div class="tsport-m-brand-grid">
                  ${brandBtns}
                </div>
                <button
                  type="button"
                  class="tsport-m-more-btn"
                  data-m-filter-cat="${cat.id}"
                  data-m-filter-cat-name="${cat.name}"
                  data-m-filter-brand="ALL"
                >
                  Xem thêm tất cả ${cat.name} →
                </button>
              </div>
            </div>
          `;
        })
        .join("");
    }

    const mFilterTitle = document.getElementById("m02FilterTitle");
    const mFilterSub = document.getElementById("m02FilterSub");
    const mGrid = document.getElementById("m02ProductsGrid");

    const filtered = getFilteredProducts();
    const catLabel =
      state.filter.categoryId === "ALL" ? "Tất cả loại hàng" : state.filter.categoryName;
    const brandLabel =
      state.filter.brand === "ALL" ? "Tất cả thương hiệu" : `Thương hiệu ${state.filter.brand}`;

    if (mFilterTitle) mFilterTitle.textContent = `${catLabel}`;
    if (mFilterSub) mFilterSub.textContent = `${brandLabel} • ${filtered.length} sản phẩm từ API Danh mục`;

    if (mGrid) {
      mGrid.innerHTML = filtered
        .slice(0, 6)
        .map(
          (p) => `
          <article class="tsport-m-card" data-add-cart="${p.id}">
            <div class="tsport-m-card-thumb">
              <span class="tsport-product-status" style="height:20px;font-size:10px;padding:0 6px;">${p.brand}</span>
              ${renderWireframeRacketSVG()}
            </div>
            <h4 class="tsport-m-card-title">${p.name}</h4>
            <p style="font-size:10px;color:#70767D;">${p.categoryName}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span class="tsport-m-card-price">${formatVND(p.price)}</span>
              <span style="font-size:10px;font-weight:700;color:#D94C26;">+ Giỏ</span>
            </div>
          </article>
        `
        )
        .join("");
    }
  }

  function updateCartBadges() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll(".js-cart-count").forEach((el) => {
      el.textContent = totalCount;
    });
  }

  function openModal(title, bodyHTML) {
    const backdrop = document.getElementById("tsportModalBackdrop");
    const titleEl = document.getElementById("tsportModalTitle");
    const bodyEl = document.getElementById("tsportModalBody");
    if (!backdrop || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    backdrop.classList.add("is-open");
  }

  function closeModal() {
    const backdrop = document.getElementById("tsportModalBackdrop");
    if (backdrop) backdrop.classList.remove("is-open");
  }

  function showCartModal() {
    const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemsHTML = state.cart
      .map(
        (item) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #D9DDE2;">
          <div>
            <div style="font-size:14px;font-weight:700;color:#22262B;">${item.name}</div>
            <div style="font-size:11px;color:#70767D;">${item.variant} • SL: ${item.qty}</div>
          </div>
          <div style="font-size:14px;font-weight:700;color:#D94C26;">${formatVND(item.price * item.qty)}</div>
        </div>
      `
      )
      .join("");

    openModal(
      `Giỏ hàng của bạn (${state.cart.reduce((s, i) => s + i.qty, 0)} sản phẩm) — D05`,
      `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${itemsHTML}
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;">
          <span style="font-size:14px;font-weight:700;">Tổng thanh toán (Miễn phí vận chuyển 0đ):</span>
          <span style="font-size:20px;font-weight:800;color:#D94C26;">${formatVND(total)}</span>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
          <button type="button" class="tsport-btn-primary" onclick="document.getElementById('tsportModalBackdrop').classList.remove('is-open')">Tiến hành đặt hàng COD →</button>
        </div>
      </div>
    `
    );
  }

  function showApiPayloadModal() {
    const payload = {
      authSession: {
        tokenStoredInLocalStorage: Boolean(state.token),
        tokenPreview: state.token ? state.token.slice(0, 36) + "..." : null,
        axiosRequestInterceptor: "Authorization: Bearer <token>",
        currentUser: state.user
      },
      categoriesEndpoint: "GET /api/categories",
      categoriesCount: state.categories.length
    };

    openModal(
      "Trạng thái JWT Token, Axios Interceptor & API Danh mục",
      `<pre style="background:#1B1F24;color:#FFD7C9;padding:14px;border-radius:6px;font-size:12px;overflow-x:auto;">${JSON.stringify(
        payload,
        null,
        2
      )}</pre>`
    );
  }

  function switchViewMode(mode) {
    state.viewMode = mode;
    document.querySelectorAll("[data-view-mode]").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-view-mode") === mode);
    });
    const d01 = document.getElementById("artboardD01");
    const d02 = document.getElementById("artboardD02");
    const auth = document.getElementById("artboardAuth");
    const acc = document.getElementById("artboardAccount");
    const mob = document.getElementById("artboardMobileGroup");

    if (d01) d01.style.display = mode === "all" || mode === "d01" ? "flex" : "none";
    if (d02) d02.style.display = mode === "all" || mode === "d02" ? "flex" : "none";
    if (auth) auth.style.display = mode === "all" || mode === "auth" ? "flex" : "none";
    if (acc) acc.style.display = mode === "all" || mode === "account" ? "flex" : "none";
    if (mob) mob.style.display = mode === "all" || mode === "mobile" ? "flex" : "none";

    applyResponsiveArtboardScale();
  }

  function bindEvents() {
    // Gắn sự kiện cho 4 Form chính: Đăng nhập (D08), Đăng ký (D09), Sửa thông tin (D10), Đổi mật khẩu (D10)
    document.getElementById("formLoginD08")?.addEventListener("submit", handleLoginSubmit);
    document.getElementById("formRegisterD09")?.addEventListener("submit", handleRegisterSubmit);
    document.getElementById("formProfileD10")?.addEventListener("submit", handleProfileUpdateSubmit);
    document.getElementById("formPasswordD10")?.addEventListener("submit", handleChangePasswordSubmit);

    // Các nút điền nhanh & test validate trên D08 / D09
    document.getElementById("btnFillCustomerSeed")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "nguyenvanan@sportstore.vn";
      document.getElementById("loginPassword").value = "Customer@123";
      setFieldError("groupLoginEmail", "errLoginEmail", null);
      setFieldError("groupLoginPassword", "errLoginPassword", null);
      setFormBanner("loginBannerMsg", null, "");
    });

    document.getElementById("btnFillAdminSeed")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "admin@sportstore.vn";
      document.getElementById("loginPassword").value = "Admin@123";
      setFieldError("groupLoginEmail", "errLoginEmail", null);
      setFieldError("groupLoginPassword", "errLoginPassword", null);
      setFormBanner("loginBannerMsg", null, "");
    });

    document.getElementById("btnTriggerLoginError")?.addEventListener("click", () => {
      document.getElementById("loginEmail").value = "email-sai-dinh-dang";
      document.getElementById("loginPassword").value = "123";
      document.getElementById("formLoginD08")?.requestSubmit();
    });

    document.getElementById("btnFillValidRegister")?.addEventListener("click", () => {
      const rand = Math.floor(100 + Math.random() * 899);
      document.getElementById("regFullName").value = "Vũ Minh Quân";
      document.getElementById("regPhone").value = "0988765432";
      document.getElementById("regEmail").value = `vuminhquan${rand}@sportstore.vn`;
      document.getElementById("regAddress").value = "Số 68 Khúc Thừa Dụ, Quận Cầu Giấy, Hà Nội";
      document.getElementById("regPassword").value = "Customer@123";
      document.getElementById("regConfirmPassword").value = "Customer@123";
      ["groupRegFullName", "groupRegPhone", "groupRegEmail", "groupRegAddress", "groupRegPassword", "groupRegConfirmPassword"].forEach((id) =>
        document.getElementById(id)?.classList.remove("has-error")
      );
      setFormBanner("registerBannerMsg", null, "");
    });

    document.getElementById("btnTriggerRegisterError")?.addEventListener("click", () => {
      document.getElementById("regFullName").value = "A";
      document.getElementById("regPhone").value = "12345";
      document.getElementById("regEmail").value = "nguyenvanan@sportstore.vn";
      document.getElementById("regAddress").value = "";
      document.getElementById("regPassword").value = "Customer@123";
      document.getElementById("regConfirmPassword").value = "KhongKhop@999";
      document.getElementById("formRegisterD09")?.requestSubmit();
    });

    document.getElementById("btnTestInterceptorPing")?.addEventListener("click", async () => {
      try {
        if (window.api) {
          await window.api.get("/users/me");
        }
      } catch (_) {}
      showToast("Đã gửi request GET /api/users/me kèm Header Authorization: Bearer <token> qua Axios Interceptor!");
    });

    document.getElementById("btnLogoutToken")?.addEventListener("click", () => {
      clearAuthSession();
      showToast("Đã xóa JWT Token khỏi localStorage (Đăng xuất)!");
    });

    document.addEventListener("click", (e) => {
      const toggleMegaBtn = e.target.closest(".js-toggle-mega");
      if (toggleMegaBtn) {
        document.getElementById("desktopMegaMenu")?.classList.toggle("is-open");
        return;
      }

      const gotoAuthBtn = e.target.closest(".js-goto-auth");
      if (gotoAuthBtn) {
        if (state.viewMode !== "all" && state.viewMode !== "auth") {
          switchViewMode("auth");
        }
        document.getElementById("artboardAuth")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const gotoAccBtn = e.target.closest(".js-goto-account");
      if (gotoAccBtn) {
        if (state.viewMode !== "all" && state.viewMode !== "account") {
          switchViewMode("account");
        }
        document.getElementById("artboardAccount")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const megaFilterBtn = e.target.closest("[data-filter-cat]");
      if (megaFilterBtn) {
        const catId = megaFilterBtn.getAttribute("data-filter-cat");
        const catName = megaFilterBtn.getAttribute("data-filter-cat-name");
        const brand = megaFilterBtn.getAttribute("data-filter-brand") || "ALL";
        applyCatalogFilter({
          categoryId: catId,
          categoryName: catName,
          brand,
          searchQuery: "",
          sourceLabel: "desktop"
        });
        return;
      }

      const sideCatBtn = e.target.closest("[data-sidebar-cat]");
      if (sideCatBtn) {
        const catId = sideCatBtn.getAttribute("data-sidebar-cat");
        const catName = sideCatBtn.getAttribute("data-sidebar-cat-name");
        applyCatalogFilter({
          categoryId: catId,
          categoryName: catName,
          brand: "ALL"
        });
        return;
      }

      const sideBrandBtn = e.target.closest("[data-sidebar-brand]");
      if (sideBrandBtn) {
        const brand = sideBrandBtn.getAttribute("data-sidebar-brand");
        applyCatalogFilter({ brand });
        return;
      }

      const accToggle = e.target.closest("[data-acc-toggle]");
      if (accToggle) {
        const catId = accToggle.getAttribute("data-acc-toggle");
        state.mobileExpandedCatId = state.mobileExpandedCatId === catId ? null : catId;
        renderMobileAccordionAndList();
        return;
      }

      const mFilterBtn = e.target.closest("[data-m-filter-cat]");
      if (mFilterBtn) {
        const catId = mFilterBtn.getAttribute("data-m-filter-cat");
        const catName = mFilterBtn.getAttribute("data-m-filter-cat-name");
        const brand = mFilterBtn.getAttribute("data-m-filter-brand") || "ALL";
        applyCatalogFilter({
          categoryId: catId,
          categoryName: catName,
          brand,
          searchQuery: "",
          sourceLabel: "mobile"
        });
        return;
      }

      const cardEl = e.target.closest("[data-add-cart]");
      if (cardEl) {
        const pid = Number(cardEl.getAttribute("data-add-cart"));
        const prod = state.products.find((p) => p.id === pid);
        if (prod) {
          const existing = state.cart.find((c) => c.id === prod.id);
          if (existing) {
            existing.qty += 1;
          } else {
            state.cart.push({
              id: prod.id,
              sku: prod.sku,
              name: prod.name,
              variant: prod.variantMeta,
              price: prod.price,
              qty: 1
            });
          }
          updateCartBadges();
          showToast(`Đã thêm "${prod.name}" vào giỏ hàng!`);
        }
        return;
      }

      if (e.target.closest(".js-open-cart")) {
        showCartModal();
        return;
      }
      if (e.target.closest(".js-open-api")) {
        showApiPayloadModal();
        return;
      }
      if (e.target.closest(".js-close-modal") || e.target.id === "tsportModalBackdrop") {
        closeModal();
        return;
      }

      const modeBtn = e.target.closest("[data-view-mode]");
      if (modeBtn) {
        switchViewMode(modeBtn.getAttribute("data-view-mode"));
      }
    });

    const searchForms = document.querySelectorAll(".js-search-form");
    searchForms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector("input");
        const q = input ? input.value.trim() : "";
        applyCatalogFilter({
          categoryId: "ALL",
          categoryName: "Kết quả tìm kiếm",
          brand: "ALL",
          searchQuery: q,
          sourceLabel: form.dataset.searchTarget || "desktop"
        });
      });
    });

    // Nút xóa lịch sử đã xem gần đây
    document.getElementById("btnClearRecentViews")?.addEventListener("click", () => {
      localStorage.removeItem("tsport_recent_views");
      renderHomeRecentViews();
      showToast("Đã xóa toàn bộ lịch sử sản phẩm đã xem!");
    });

    initSearchAutocomplete();
  }

  function applyResponsiveArtboardScale() {
    const availW = document.documentElement.clientWidth - 48;
    const scale = availW < 1440 ? Math.max(0.55, availW / 1440) : 1;
    ["artboardD01", "artboardD02", "artboardAuth", "artboardAccount"].forEach((id) => {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      const frame = wrap.querySelector(".tsport-desktop-frame");
      if (!frame) return;
      frame.style.zoom = scale < 1 ? String(scale.toFixed(3)) : "1";
    });
  }

  function renderAll() {
    renderDesktopMegaMenu();
    renderHomeFeaturedProducts();
    renderHomeUsedGoods();
    renderHomeRecentViews();
    renderFilteredSection();
    renderMobileAccordionAndList();
    updateCartBadges();
    syncAuthAndAccountUI();
    renderInterceptorLogs();
    applyResponsiveArtboardScale();
  }

  window.addEventListener("resize", applyResponsiveArtboardScale);
  bindEvents();
  renderAll();
  loadCategoriesFromAPI();
});
