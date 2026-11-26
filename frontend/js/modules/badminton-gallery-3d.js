/**
 * TSPORT — TRIỂN LÃM CẦU LÔNG 3D (PHÒNG TRƯNG BÀY VÀ XEM CHI TIẾT)
 *
 * Cấu trúc module:
 * - BADMINTON_GALLERY_CONFIG: Toàn bộ thông số hình học, camera, tương tác & thời lượng chuyển cảnh
 * - GalleryScene: Three.js WebGLRenderer, PerspectiveCamera, hai tường bên và tường cuối phòng, sàn xám nhạt
 * - ArtworkMesh: 20 sản phẩm cầu lông thật từ tsportStore, giữ nguyên tỷ lệ ảnh + nhãn tên/giá đi theo phối cảnh
 * - GalleryControls: Kéo chuột, vuốt ngang mobile, wheel/trackpad ngang, phím mũi tên, quán tính delta-time
 * - TransitionController: Máy trạng thái gallery -> focusing -> detail -> returning -> gallery bằng GSAP 3
 */

(function () {
  // ==========================================================================
  // 1. CẤU HÌNH TẬP TRUNG (CHỈNH TẤT CẢ THÔNG SỐ HIỆU ỨNG TẠI ĐÂY)
  // ==========================================================================
  const BADMINTON_GALLERY_CONFIG = {
    roomHalfWidth: 5,
    roomBack: -19,
    roomEntrance: 7,
    roomOffsetZ: -8,
    previewRadius: 14.8,
    previewArtworkRadius: 14.64,
    previewWallHeight: 11.8,
    previewFloorY: -2.85,
    wallHeight: 8,
    floorY: -3.1,
    artworkY: 0.42,
    featureZ: -15.5,
    featureScale: 1.45,
    maxItems: 18,
    cameraFov: 45,
    cameraMobileFov: 57,
    cameraOutsideZ: -3.8,
    cameraInsideZ: -8,
    cameraY: 0.16,
    dragSensitivity: 0.0022,  // Độ nhạy kéo chuột / vuốt ngang
    wheelSensitivity: 0.00055,// Độ nhạy con lăn / trackpad
    damping: 5.2,             // Hệ số tắt dần quán tính (theo delta time)
    maxVelocity: 2.2,         // Giới hạn vận tốc góc (rad/s)
    clickThresholdPx: 8,      // Ngưỡng phân biệt click (<8px) và drag
    focusDuration: 0.55,      // Giai đoạn A: xoay ngắn nhất đưa sản phẩm về trung tâm (giây)
    zoomDuration: 0.85,       // Giai đoạn B: tiến camera gần sản phẩm (giây)
    detailDuration: 0.65      // Giai đoạn C: trượt ảnh sang cột trái & hiện chi tiết (giây)
  };
  window.BADMINTON_GALLERY_CONFIG = BADMINTON_GALLERY_CONFIG;

  const REDUCED_MOTION =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatVND(val) {
    return (Number(val) || 0).toLocaleString("vi-VN") + "đ";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeAngle(rad) {
    let a = rad % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // ==========================================================================
  // 2. LẤY DỮ LIỆU 20 SẢN PHẨM CẦU LÔNG THẬT TỪ TSPORT STORE
  // ==========================================================================
  function getBadmintonCatalog() {
    const store = window.tsportStore;
    if (!store) return [];

    const all = store.getProducts({ only_active: true }) || [];
    const brands = store.getBrands() || [];
    const cats = store.getCategories() || [];

    // Lấy toàn bộ sản phẩm môn Cầu lông (sport_id === 1), ưu tiên vợt, giày, cầu, túi, áo
    const badminton = all.filter((p) => Number(p.sport_id) === 1).slice(0, BADMINTON_GALLERY_CONFIG.maxItems);

    return badminton.map((p, idx) => {
      const brand = brands.find((b) => Number(b.id) === Number(p.brand_id))?.name || "Tsport";
      const cat = cats.find((c) => Number(c.id) === Number(p.category_id))?.name || "Cầu lông";
      const skus = Array.isArray(p.skus) && p.skus.length ? p.skus : [{ id: p.id, size: "Tiêu chuẩn", color: "Nguyên bản", price: 1500000, stock: 10 }];
      const minPrice = Math.min(...skus.map((s) => Number(s.sale_price || s.price) || 0));
      const img = storefrontImageUrl(p.images?.[0]?.image_url || "/assets/products/catalog/p001.webp");

      // Phối hợp khung đứng và khung ngang kích thước lớn rõ nét
      const isLandscape = Number(p.category_id) === 6 || (idx % 4 === 2);
      return {
        id: p.id,
        title: p.name,
        artist: brand,
        collection: cat,
        image: img,
        width: isLandscape ? 3.25 : 2.75,
        height: isLandscape ? 2.6 : 3.4,
        price: minPrice,
        description: p.description || "Sản phẩm cầu lông chính hãng phân phối tại Tsport.",
        specifications: p.specifications || {},
        condition_type: p.condition_type || "MOI",
        wear_description: p.wear_description || null,
        skus
      };
    });
  }

  // ==========================================================================
  // 3. KHÔNG GIAN PHÒNG TRIỂN LÃM
  // ==========================================================================
  class GalleryScene {
    constructor(canvas, container) {
      this.canvas = canvas;
      this.container = container;
      const THREE = window.THREE;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf2f2f0);

      const rect = container.getBoundingClientRect();
      const aspect = Math.max(rect.width, 320) / Math.max(rect.height, 320);
      const isMobile = rect.width <= 768;

      this.baseCameraZ = isMobile ? BADMINTON_GALLERY_CONFIG.cameraOutsideZ - 1.2 : BADMINTON_GALLERY_CONFIG.cameraOutsideZ;
      this.roomProgress = 0;
      this.architectureOpacity = 1;
      this.camera = new THREE.PerspectiveCamera(
        isMobile ? BADMINTON_GALLERY_CONFIG.cameraMobileFov : BADMINTON_GALLERY_CONFIG.cameraFov,
        aspect,
        0.1,
        80
      );
      this.camera.position.set(0, BADMINTON_GALLERY_CONFIG.cameraY, this.baseCameraZ);
      this.camera.lookAt(0, 0.05, BADMINTON_GALLERY_CONFIG.featureZ);

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      this._setRenderSize(rect);
      if (THREE.SRGBColorSpace) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      this.galleryGroup = new THREE.Group();
      this.scene.add(this.galleryGroup);

      this._buildArchitecture();
      this._buildLights();
    }

    _createWallTexture() {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      // Chuyển sáng theo chiều đứng trên tường
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, "#EAEAE7");
      grad.addColorStop(0.28, "#F5F5F3");
      grad.addColorStop(0.75, "#EFEFEC");
      grad.addColorStop(0.95, "#DFDFDB");
      grad.addColorStop(1.0, "#D3D3CF");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Đường chân tường mỏng cực tinh tế tại tiếp giáp tường & sàn
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 506, 512, 6);

      const tex = new window.THREE.CanvasTexture(c);
      if (window.THREE.SRGBColorSpace) tex.colorSpace = window.THREE.SRGBColorSpace;
      return tex;
    }

    _createFloorTexture() {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
      grad.addColorStop(0, "#E4E4E0");
      grad.addColorStop(0.75, "#DCDCD8");
      grad.addColorStop(1, "#CFCFCB");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new window.THREE.CanvasTexture(c);
      if (window.THREE.SRGBColorSpace) tex.colorSpace = window.THREE.SRGBColorSpace;
      return tex;
    }

    _buildArchitecture() {
      const THREE = window.THREE;
      const { roomHalfWidth, roomBack, roomEntrance, wallHeight, floorY, featureZ, roomOffsetZ,
        previewRadius, previewWallHeight, previewFloorY } = BADMINTON_GALLERY_CONFIG;
      const depth = roomEntrance - roomBack;
      const midZ = (roomEntrance + roomBack) / 2;
      const midY = floorY + wallHeight / 2;

      this.wallMat = new THREE.MeshBasicMaterial({ map: this._createWallTexture(), transparent: true });
      this.floorMat = new THREE.MeshBasicMaterial({ map: this._createFloorTexture(), transparent: true });
      this.roomMeshes = [];
      const plane = (width, height, material, x, y, z, rx, ry) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
        mesh.position.set(x, y, z + roomOffsetZ);
        mesh.rotation.set(rx, ry, 0);
        this.scene.add(mesh);
        this.roomMeshes.push(mesh);
      };
      plane(depth, wallHeight, this.wallMat, -roomHalfWidth, midY, midZ, 0, Math.PI / 2);
      plane(depth, wallHeight, this.wallMat, roomHalfWidth, midY, midZ, 0, -Math.PI / 2);
      plane(roomHalfWidth * 2, wallHeight, this.wallMat, 0, midY, roomBack, 0, 0);
      plane(roomHalfWidth * 2, depth + 7, this.floorMat, 0, floorY, midZ + 3.5, -Math.PI / 2, 0);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.45, 2.5), this.floorMat);
      plinth.position.set(0, floorY + 0.225, featureZ + roomOffsetZ);
      this.scene.add(plinth);
      this.roomMeshes.push(plinth);

      const previewWall = new THREE.Mesh(
        new THREE.CylinderGeometry(previewRadius, previewRadius, previewWallHeight, 84, 1, true),
        this.wallMat.clone()
      );
      previewWall.material.side = THREE.BackSide;
      previewWall.position.y = previewFloorY + previewWallHeight / 2;
      const previewFloor = new THREE.Mesh(new THREE.CircleGeometry(previewRadius + 0.08, 84), this.floorMat.clone());
      previewFloor.rotation.x = -Math.PI / 2;
      previewFloor.position.y = previewFloorY;
      this.previewMeshes = [previewWall, previewFloor];
      this.scene.add(...this.previewMeshes);
    }

    _buildLights() {
      const THREE = window.THREE;
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    }

    _setRenderSize({ width, height }) {
      // Keep high-density displays sharp within a bounded GPU pixel count.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3000000 / (width * height)));
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(width, height, false);
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const isMobile = rect.width <= 768;
      this.camera.fov = isMobile ? BADMINTON_GALLERY_CONFIG.cameraMobileFov : BADMINTON_GALLERY_CONFIG.cameraFov;
      this.camera.aspect = rect.width / rect.height;
      this.camera.updateProjectionMatrix();
      this._setRenderSize(rect);
    }

    render() {
      const progress = this.roomProgress;
      this.wallMat.opacity = this.floorMat.opacity = progress * this.architectureOpacity;
      this.wallMat.depthWrite = this.floorMat.depthWrite = progress === 1;
      this.roomMeshes.forEach((mesh) => {
        mesh.visible = progress > 0;
        mesh.renderOrder = progress === 1 ? 0 : -2;
      });
      this.previewMeshes.forEach((mesh) => {
        mesh.visible = progress < 1;
        mesh.material.opacity = (1 - progress) * this.architectureOpacity;
        mesh.material.depthWrite = progress === 0;
        mesh.renderOrder = progress === 0 ? 0 : -1;
      });
      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      this.roomMeshes.forEach((mesh) => mesh.geometry.dispose());
      this.previewMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      this.wallMat.map?.dispose();
      this.wallMat.dispose();
      this.floorMat.map?.dispose();
      this.floorMat.dispose();
      this.renderer.dispose();
    }
  }

  // ==========================================================================
  // 4. ARTWORK MESH (TRANH / SẢN PHẨM + NHÃN PHỐI CẢNH)
  // ==========================================================================
  class ArtworkMesh {
    constructor(item, index, total) {
      const THREE = window.THREE;
      this.item = item;
      this.index = index;
      this.theta = (index / total) * Math.PI * 2;

      this.group = new THREE.Group();

      // Vầng sáng hào quang tự động phía sau sản phẩm khi vào chính giữa (không cần hover)
      this.glowGeo = new THREE.PlaneGeometry(item.width * 1.42, item.height * 1.38);
      this.glowMat = new THREE.MeshBasicMaterial({
        map: this._createGlowTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      this.glowMesh = new THREE.Mesh(this.glowGeo, this.glowMat);
      this.glowMesh.position.set(0, 0, -0.03);
      this.group.add(this.glowMesh);

      // Placeholder texture sạch trong khi ảnh thật đang nạp
      const placeholderTex = this._createPlaceholderTexture(item.width, item.height);
      this.artGeo = new THREE.PlaneGeometry(item.width, item.height);
      this.artMat = new THREE.MeshBasicMaterial({
        map: placeholderTex,
        transparent: true,
        opacity: 1
      });
      this.artMesh = new THREE.Mesh(this.artGeo, this.artMat);
      this.artMesh.userData.artwork = this;
      this.group.add(this.artMesh);

      // Nhãn nhỏ bên dưới đi theo sản phẩm & chịu phối cảnh 3D
      const capW = Math.max(item.width, 2.8);
      const capH = 0.56;
      this.capGeo = new THREE.PlaneGeometry(capW, capH);
      this.capMat = new THREE.MeshBasicMaterial({
        map: this._createCaptionTexture(item),
        transparent: true,
        opacity: 0.96,
        depthWrite: false
      });
      this.capMesh = new THREE.Mesh(this.capGeo, this.capMat);
      this.capMesh.position.set(0, -item.height / 2 - 0.38, 0.01);
      this.group.add(this.capMesh);

      this.loadedImage = null;
      this._loadProductImage(item);
    }

    _createGlowTexture() {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d");
      const grad = ctx.createRadialGradient(128, 128, 28, 128, 128, 126);
      grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.55, "rgba(255, 255, 255, 0.72)");
      grad.addColorStop(0.82, "rgba(255, 255, 255, 0.22)");
      grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new window.THREE.CanvasTexture(c);
      if (window.THREE.SRGBColorSpace) tex.colorSpace = window.THREE.SRGBColorSpace;
      return tex;
    }

    _createPlaceholderTexture(w, h) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = Math.round(256 * (h / w));
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#ECECE9";
      ctx.fillRect(16, 16, c.width - 32, c.height - 32);
      const tex = new window.THREE.CanvasTexture(c);
      if (window.THREE.SRGBColorSpace) tex.colorSpace = window.THREE.SRGBColorSpace;
      return tex;
    }

    _loadProductImage(item) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.loadedImage = img;
        const c = document.createElement("canvas");
        const cw = Math.max(768, Math.min(1200, img.naturalWidth));
        const ch = Math.round(cw * (item.height / item.width));
        c.width = cw;
        c.height = ch;
        const ctx = c.getContext("2d");

        // Nền trắng tinh khiết chuẩn triển lãm, giữ nguyên tỷ lệ ảnh gốc không kéo giãn
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, cw, ch);

        const pad = Math.round(Math.min(cw, ch) * 0.04);
        const availW = cw - pad * 2;
        const availH = ch - pad * 2;
        const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

        // Đường viền mảnh cực nhẹ phân tách ảnh trắng trên tường trắng xám
        ctx.strokeStyle = "rgba(17, 24, 39, 0.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, cw - 2, ch - 2);

        const tex = new window.THREE.CanvasTexture(c);
        if (window.THREE.SRGBColorSpace) tex.colorSpace = window.THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        if (this.artMat.map) this.artMat.map.dispose();
        this.artMat.map = tex;
        this.artMat.needsUpdate = true;
      };
      img.src = item.image;
    }

    _createCaptionTexture(item) {
      const c = document.createElement("canvas");
      c.width = 768;
      c.height = 152;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);

      ctx.fillStyle = "#111827";
      ctx.font = "800 30px Roboto, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const title = item.title.length > 34 ? item.title.slice(0, 33) + "…" : item.title;
      ctx.fillText(title, 6, 12);

      ctx.fillStyle = "#4B5563";
      ctx.font = "600 24px Roboto, sans-serif";
      ctx.fillText(`${item.artist}  •  ${formatVND(item.price)}`, 6, 58);

      const tex = new window.THREE.CanvasTexture(c);
      if (window.THREE.SRGBColorSpace) tex.colorSpace = window.THREE.SRGBColorSpace;
      return tex;
    }

    setOpacity(val) {
      this.artMat.opacity = val;
      this.capMat.opacity = val * 0.92;
      if (this.glowMat) this.glowMat.opacity = Math.min(this.glowMat.opacity, val);
    }

    // Chiếu chính xác 4 góc mặt phẳng sản phẩm sang tọa độ pixel trên viewport
    getScreenRect(camera, canvas) {
      const THREE = window.THREE;
      const hw = this.item.width / 2;
      const hh = this.item.height / 2;
      const corners = [
        new THREE.Vector3(-hw, hh, 0),
        new THREE.Vector3(hw, hh, 0),
        new THREE.Vector3(-hw, -hh, 0),
        new THREE.Vector3(hw, -hh, 0)
      ];
      this.artMesh.updateWorldMatrix(true, false);
      const canvasRect = canvas.getBoundingClientRect();

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      corners.forEach((v) => {
        v.applyMatrix4(this.artMesh.matrixWorld);
        v.project(camera);
        const sx = canvasRect.left + ((v.x + 1) * 0.5) * canvasRect.width;
        const sy = canvasRect.top + ((1 - v.y) * 0.5) * canvasRect.height;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      });

      return {
        left: minX,
        top: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY)
      };
    }

    dispose() {
      this.glowGeo?.dispose();
      this.glowMat?.map?.dispose();
      this.glowMat?.dispose();
      this.artGeo.dispose();
      this.artMat.map?.dispose();
      this.artMat.dispose();
      this.capGeo.dispose();
      this.capMat.map?.dispose();
      this.capMat.dispose();
    }
  }

  // ==========================================================================
  // 5. GALLERY CONTROLS (KÉO, VUỐT, WHEEL, BÀN PHÍM, QUÁN TÍNH DELTA-TIME)
  // ==========================================================================
  class GalleryControls {
    constructor(stageEl, onClickHit, onArrowStep) {
      this.stageEl = stageEl;
      this.onClickHit = onClickHit;
      this.onArrowStep = onArrowStep;

      this.angle = 0;
      this.velocity = 0;
      this.locked = false;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.lastX = 0;
      this.totalMovePx = 0;
      this.touchAxis = null; // null | 'x' | 'y'

      this._bind();
    }

    _bind() {
      this._onPointerDown = (e) => {
        if (this.locked || e.target.closest("button, a")) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.lastX = e.clientX;
        this.totalMovePx = 0;
        this.touchAxis = null;
        this.velocity = 0;
        this.stageEl.classList.add("is-grabbing");
      };

      this._onPointerMove = (e) => {
        if (!this.isDragging || this.locked) return;
        const dx = e.clientX - this.lastX;
        const totalDx = Math.abs(e.clientX - this.dragStartX);
        const totalDy = Math.abs(e.clientY - this.dragStartY);
        this.totalMovePx = Math.hypot(totalDx, totalDy);

        if (e.pointerType === "touch" && !this.touchAxis && this.totalMovePx > 6) {
          this.touchAxis = totalDx >= totalDy ? "x" : "y";
        }
        if (this.touchAxis === "y") return;

        this.lastX = e.clientX;
        const deltaAngle = dx * BADMINTON_GALLERY_CONFIG.dragSensitivity;
        this.angle += deltaAngle;
        this.velocity = Math.max(
          -BADMINTON_GALLERY_CONFIG.maxVelocity,
          Math.min(BADMINTON_GALLERY_CONFIG.maxVelocity, deltaAngle * 42)
        );
      };

      this._onPointerUp = (e) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.stageEl.classList.remove("is-grabbing");

        if (!this.locked && this.totalMovePx < BADMINTON_GALLERY_CONFIG.clickThresholdPx) {
          this.velocity = 0;
          this.onClickHit(e.clientX, e.clientY);
        }
      };

      this._onWheel = (e) => {
        if (this.locked) return;
        // Hỗ trợ trackpad vuốt ngang (deltaX) hoặc giữ Shift + cuộn dọc
        const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        if (!horizontal) return;
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const impulse = -delta * BADMINTON_GALLERY_CONFIG.wheelSensitivity;
        this.angle += impulse;
        this.velocity = Math.max(
          -BADMINTON_GALLERY_CONFIG.maxVelocity,
          Math.min(BADMINTON_GALLERY_CONFIG.maxVelocity, this.velocity + impulse * 12)
        );
      };

      this._onKeyDown = (e) => {
        if (this.locked || !this.stageEl.contains(document.activeElement)) return;
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (e.key === "ArrowLeft") {
          this.onArrowStep(1);
        } else if (e.key === "ArrowRight") {
          this.onArrowStep(-1);
        }
      };

      this.stageEl.addEventListener("pointerdown", this._onPointerDown);
      window.addEventListener("pointermove", this._onPointerMove);
      window.addEventListener("pointerup", this._onPointerUp);
      this.stageEl.addEventListener("wheel", this._onWheel, { passive: false });
      window.addEventListener("keydown", this._onKeyDown);
    }

    update(dt) {
      if (this.locked || this.isDragging) return;
      if (Math.abs(this.velocity) > 0.0004) {
        this.angle += this.velocity * dt;
        const decay = Math.exp(-BADMINTON_GALLERY_CONFIG.damping * dt);
        this.velocity *= decay;
      } else {
        this.velocity = 0;
      }
    }

    dispose() {
      this.stageEl.removeEventListener("pointerdown", this._onPointerDown);
      window.removeEventListener("pointermove", this._onPointerMove);
      window.removeEventListener("pointerup", this._onPointerUp);
      this.stageEl.removeEventListener("wheel", this._onWheel);
      window.removeEventListener("keydown", this._onKeyDown);
    }
  }

  // ==========================================================================
  // 6. PRODUCT DETAIL OVERLAY & TRANSITION CONTROLLER (GSAP 3)
  // ==========================================================================
  class TransitionController {
    constructor(sceneObj, artworks, controls, allItems) {
      this.sceneObj = sceneObj;
      this.artworks = artworks;
      this.controls = controls;
      this.allItems = allItems;

      this.state = "gallery"; // gallery | focusing | detail | returning
      this.activeArtwork = null;
      this.savedAngle = 0;
      this.activeTimeline = null;
      this.selectedSku = null;
      this.qty = 1;

      this.overlay = document.getElementById("bg3dDetailOverlay");
      this.flyWrap = document.getElementById("bg3dFlyWrap");
      this.flyImg = document.getElementById("bg3dFlyImg");
      this.imgSlot = document.getElementById("bg3dDetailImgSlot");
      this.infoCol = document.getElementById("bg3dDetailInfoCol");
      this.relatedWrap = document.getElementById("bg3dRelatedSection");

      this._bindOverlayEvents();
    }

    _bindOverlayEvents() {
      document.getElementById("btnBg3dBack")?.addEventListener("click", () => this.closeDetail());
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.state === "detail") {
          this.closeDetail();
        }
      });

      // Accordions
      this.overlay?.addEventListener("click", (e) => {
        const accBtn = e.target.closest(".ts-bg3d-acc-trigger");
        if (accBtn) {
          const item = accBtn.closest(".ts-bg3d-acc-item");
          const open = item.classList.toggle("is-open");
          accBtn.querySelector(".js-acc-sign").textContent = open ? "−" : "+";
          return;
        }

        const relBtn = e.target.closest(".ts-bg3d-rel-card");
        if (relBtn) {
          const nextId = Number(relBtn.dataset.id);
          const nextArt = this.artworks.find((a) => Number(a.item.id) === nextId);
          if (nextArt) {
            this.activeArtwork = nextArt;
            this._populateDetail(nextArt.item);
            this.overlay.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      });

      // Qty stepper
      document.getElementById("bg3dQtyMinus")?.addEventListener("click", () => {
        if (this.qty > 1) {
          this.qty -= 1;
          document.getElementById("bg3dQtyVal").textContent = String(this.qty);
        }
      });
      document.getElementById("bg3dQtyPlus")?.addEventListener("click", () => {
        const maxStock = this.selectedSku ? Number(this.selectedSku.stock) || 10 : 10;
        if (this.qty < maxStock) {
          this.qty += 1;
          document.getElementById("bg3dQtyVal").textContent = String(this.qty);
        }
      });

      // Add to bag
      document.getElementById("btnBg3dAddToBag")?.addEventListener("click", async (event) => {
        if (!this.activeArtwork || !window.tsportStore) return;
        const button = event.currentTarget;
        const prod = this.activeArtwork.item;
        const sku = this.selectedSku || prod.skus[0];
        if (!sku) return;
        button.disabled = true;
        try {
          await window.tsportStore.addToCart(prod.id, sku.id, this.qty);
          const total = window.tsportStore.getCartTotals().totalItems;
          document.querySelectorAll(".js-cart-count").forEach((el) => {
            el.textContent = String(total);
          });
          animateProductToCart(
            document.getElementById("bg3dDetailHeroImg"),
            document.getElementById("btnBg3dAddToBag"),
            this.overlay
          );
          if (typeof showToast === "function") {
            const productLabel = `"${prod.title}"${sku.size ? ` (${sku.size})` : ""}`;
            showToast(`Đã thêm ${productLabel} vào giỏ hàng!`, "success", {
              emphasis: productLabel,
              action: { label: "Xem giỏ hàng", href: "pages/cart.html" }
            });
          }
        } catch (err) {
          handleAddToCartError(err, prod.id);
        } finally {
          button.disabled = false;
        }
      });
    }

    _populateDetail(item) {
      this.qty = 1;
      const skus = item.skus || [];
      this.selectedSku = skus[0] || null;

      document.getElementById("bg3dDetailBrand").textContent = `${item.artist}  •  ${item.collection}`;
      document.getElementById("bg3dDetailTitle").textContent = item.title;
      document.getElementById("bg3dDetailPrice").textContent = formatVND(this.selectedSku ? (this.selectedSku.sale_price || this.selectedSku.price) : item.price);
      document.getElementById("bg3dDetailDesc").textContent = item.description;
      document.getElementById("bg3dQtyVal").textContent = "1";

      const fullLink = document.getElementById("bg3dFullPageLink");
      if (fullLink) fullLink.href = `pages/product-detail.html?id=${item.id}`;

      const heroImg = document.getElementById("bg3dDetailHeroImg");
      if (heroImg) {
        heroImg.src = item.image;
        heroImg.alt = item.title;
      }

      // Render Size pills
      const sizes = [...new Set(skus.map((s) => s.size).filter(Boolean))];
      const colors = [...new Set(skus.map((s) => s.color).filter(Boolean))];
      const sizeWrap = document.getElementById("bg3dSizePills");
      const colorWrap = document.getElementById("bg3dColorPills");

      if (sizeWrap) {
        sizeWrap.innerHTML = sizes
          .map((sz, i) => `<button type="button" class="ts-bg3d-opt-pill ${i === 0 ? "is-active" : ""}" data-size="${escapeHtml(sz)}">${escapeHtml(sz)}</button>`)
          .join("");
        sizeWrap.onclick = (e) => {
          const btn = e.target.closest(".ts-bg3d-opt-pill");
          if (!btn) return;
          sizeWrap.querySelectorAll(".ts-bg3d-opt-pill").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          const chosen = skus.find((s) => s.size === btn.dataset.size) || skus[0];
          this.selectedSku = chosen;
          document.getElementById("bg3dDetailPrice").textContent = formatVND(chosen.sale_price || chosen.price);
        };
      }

      if (colorWrap) {
        colorWrap.innerHTML = colors
          .map((cl, i) => `<button type="button" class="ts-bg3d-opt-pill ${i === 0 ? "is-active" : ""}" data-color="${escapeHtml(cl)}">${escapeHtml(cl)}</button>`)
          .join("");
        colorWrap.onclick = (e) => {
          const btn = e.target.closest(".ts-bg3d-opt-pill");
          if (!btn) return;
          colorWrap.querySelectorAll(".ts-bg3d-opt-pill").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
        };
      }

      // Specs accordion content
      const specLines = Object.entries(item.specifications || {})
        .map(([k, v]) => `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`)
        .join("");
      const specsEl = document.getElementById("bg3dAccSpecs");
      if (specsEl) {
        specsEl.innerHTML =
          specLines ||
          "Sản phẩm chính hãng đạt tiêu chuẩn thi đấu, bảo hành khung và tem phân phối chính hãng Tsport.";
      }

      // Related items (Get the collection)
      const relGrid = document.getElementById("bg3dRelatedGrid");
      if (relGrid) {
        const related = this.allItems.filter((x) => x.id !== item.id).slice(0, 4);
        relGrid.innerHTML = related
          .map(
            (r) => `
            <button type="button" class="ts-bg3d-rel-card" data-id="${r.id}">
              <div class="ts-bg3d-rel-thumb">
                <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}" loading="lazy" />
              </div>
              <div class="ts-bg3d-rel-name">${escapeHtml(r.title)}</div>
              <div class="ts-bg3d-rel-price">${formatVND(r.price)}</div>
            </button>
          `
          )
          .join("");
      }
    }

    openArtwork(artwork) {
      if (this.state !== "gallery" || !artwork) return;
      this.state = "focusing";
      this.activeArtwork = artwork;
      this.savedAngle = this.controls.angle;
      this.controls.locked = true;
      this.controls.velocity = 0;
      artwork.artMat.color.setRGB(1, 1, 1);
      artwork.setOpacity(1);

      this._populateDetail(artwork.item);

      const gsap = window.gsap;
      const dFocus = REDUCED_MOTION ? 0.18 : BADMINTON_GALLERY_CONFIG.focusDuration;
      const dZoom = REDUCED_MOTION ? 0.22 : BADMINTON_GALLERY_CONFIG.zoomDuration;
      const dDetail = REDUCED_MOTION ? 0.2 : BADMINTON_GALLERY_CONFIG.detailDuration;

      // Tính góc xoay ngắn nhất đưa sản phẩm về chính giữa (worldAngle = theta - controls.angle = 0)
      const currentWorldTheta = normalizeAngle(artwork.theta - this.controls.angle);
      const targetAngle = this.controls.angle + currentWorldTheta;

      // Khoảng cách camera tiến gần để sản phẩm chiếm ~56% chiều cao khung hình
      const fovRad = (this.sceneObj.camera.fov * Math.PI) / 180;
      const config = BADMINTON_GALLERY_CONFIG;
      const progress = this.sceneObj.roomProgress;
      const scale = window.THREE.MathUtils.lerp(1, config.featureScale, progress);
      const targetDist = Math.max(3.4, (artwork.item.height * scale / 0.58) / (2 * Math.tan(fovRad / 2)));
      const targetCamZ = window.THREE.MathUtils.lerp(-config.previewArtworkRadius, config.featureZ + config.roomOffsetZ, progress) + targetDist;

      if (this.activeTimeline) this.activeTimeline.kill();

      const otherArtworks = this.artworks.filter((a) => a !== artwork);
      const fadeProxy = { others: 1, room: 1 };

      const tl = gsap.timeline();
      this.activeTimeline = tl;

      // Giai đoạn A: Chọn vị trí trưng bày trung tâm
      tl.to(this.controls, {
        angle: targetAngle,
        duration: dFocus,
        ease: "power3.inOut"
      });

      // Giai đoạn B: Tiến camera gần sản phẩm + làm mờ các sản phẩm xung quanh & tường/sàn
      tl.to(
        this.sceneObj.camera.position,
        {
          z: targetCamZ,
          y: BADMINTON_GALLERY_CONFIG.artworkY,
          duration: dZoom,
          ease: "power3.inOut"
        },
        `-=${Math.min(0.18, dFocus * 0.35)}`
      );

      tl.to(
        fadeProxy,
        {
          others: 0,
          room: 0.15,
          duration: dZoom * 0.85,
          ease: "power2.out",
          onUpdate: () => {
            otherArtworks.forEach((a) => a.setOpacity(fadeProxy.others));
            this.sceneObj.architectureOpacity = fadeProxy.room;
          }
        },
        "<"
      );

      // Giai đoạn C: Chuyển liền mạch WebGL -> ảnh HTML trùng khít pixel rồi trượt sang cột trái
      tl.add(() => {
        this.sceneObj.render();
        const startRect = artwork.getScreenRect(this.sceneObj.camera, this.sceneObj.canvas);

        // Hiện overlay ở trạng thái ẩn nội dung để đo chính xác vị trí đích cột trái
        this.overlay.classList.add("is-open");
        this.overlay.scrollTop = 0;
        gsap.set(this.overlay, { opacity: 0 });
        gsap.set(this.infoCol, { opacity: 0, y: 24 });
        gsap.set(this.relatedWrap, { opacity: 0, y: 20 });

        const heroImg = document.getElementById("bg3dDetailHeroImg");
        if (heroImg) heroImg.style.visibility = "hidden";

        const endRect = this.imgSlot.getBoundingClientRect();

        // Đặt ảnh bay trùng khít vị trí WebGL
        this.flyImg.src = artwork.item.image;
        this.flyWrap.style.display = "block";
        gsap.set(this.flyWrap, {
          left: startRect.left,
          top: startRect.top,
          width: startRect.width,
          height: startRect.height
        });

        const phaseC = gsap.timeline({
          onComplete: () => {
            if (heroImg) heroImg.style.visibility = "visible";
            this.flyWrap.style.display = "none";
            document.body.style.overflow = "hidden";
            this.state = "detail";
          }
        });

        phaseC.to(this.overlay, { opacity: 1, duration: 0.22, ease: "power1.out" }, 0);
        phaseC.to(
          this.flyWrap,
          {
            left: endRect.left,
            top: endRect.top,
            width: endRect.width,
            height: endRect.height,
            duration: dDetail,
            ease: "power3.inOut"
          },
          0.06
        );
        phaseC.to(
          this.infoCol,
          { opacity: 1, y: 0, duration: dDetail * 0.85, ease: "power3.out" },
          0.2
        );
        phaseC.to(
          this.relatedWrap,
          { opacity: 1, y: 0, duration: dDetail * 0.75, ease: "power2.out" },
          0.32
        );
      });
    }

    closeDetail() {
      if (this.state !== "detail" || !this.activeArtwork) return;
      this.state = "returning";
      const gsap = window.gsap;
      const dDetail = REDUCED_MOTION ? 0.18 : BADMINTON_GALLERY_CONFIG.detailDuration * 0.85;
      const dZoom = REDUCED_MOTION ? 0.2 : BADMINTON_GALLERY_CONFIG.zoomDuration * 0.85;

      this.overlay.scrollTop = 0;
      const startRect = this.imgSlot.getBoundingClientRect();
      const targetRect = this.activeArtwork.getScreenRect(this.sceneObj.camera, this.sceneObj.canvas);
      const heroImg = document.getElementById("bg3dDetailHeroImg");

      this.flyImg.src = this.activeArtwork.item.image;
      this.flyWrap.style.display = "block";
      gsap.set(this.flyWrap, {
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height
      });
      if (heroImg) heroImg.style.visibility = "hidden";

      const otherArtworks = this.artworks.filter((a) => a !== this.activeArtwork);
      const fadeProxy = { others: 0, room: 0.15 };

      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = "";
          this.controls.locked = false;
          this.state = "gallery";
          this.activeArtwork = null;
        }
      });
      this.activeTimeline = tl;

      tl.to([this.infoCol, this.relatedWrap], { opacity: 0, y: 14, duration: 0.22, ease: "power2.in" }, 0);
      tl.to(
        this.flyWrap,
        {
          left: targetRect.left,
          top: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          duration: dDetail,
          ease: "power3.inOut"
        },
        0.04
      );
      tl.to(this.overlay, { opacity: 0, duration: 0.2, ease: "power1.in" }, dDetail - 0.14);
      tl.add(() => {
        this.overlay.classList.remove("is-open");
        this.flyWrap.style.display = "none";
        if (heroImg) heroImg.style.visibility = "visible";
      });

      // Lùi camera về đúng vị trí cũ & khôi phục toàn bộ tường/sàn/sản phẩm
      tl.to(this.sceneObj.camera.position, {
        z: this.sceneObj.baseCameraZ,
        y: BADMINTON_GALLERY_CONFIG.cameraY,
        duration: dZoom,
        ease: "power3.inOut"
      });
      tl.to(
        fadeProxy,
        {
          others: 1,
          room: 1,
          duration: dZoom * 0.85,
          ease: "power2.out",
          onUpdate: () => {
            otherArtworks.forEach((a) => a.setOpacity(fadeProxy.others));
            this.sceneObj.architectureOpacity = fadeProxy.room;
          }
        },
        "<"
      );
      tl.to(
        this.controls,
        {
          angle: this.savedAngle,
          duration: dZoom * 0.9,
          ease: "power2.inOut"
        },
        "<"
      );
    }
  }

  // ==========================================================================
  // 7. KHỞI CHẠY & FALLBACK KHÔNG CÓ WEBGL
  // ==========================================================================
  function initBadmintonGallery3D() {
    const sectionEl = document.getElementById("sectionBadmintonGallery3D");
    const stageEl = document.getElementById("bg3dStage");
    const canvasEl = document.getElementById("bg3dCanvas");
    const fallbackEl = document.getElementById("bg3dFallback");
    if (!sectionEl || !stageEl || !canvasEl) return;

    const items = getBadmintonCatalog();
    if (!items.length) {
      showFallback();
      return;
    }

    // Kiểm tra WebGL + Three.js
    let webglOk = false;
    try {
      const testC = document.createElement("canvas");
      webglOk = Boolean(window.gsap && window.THREE && (testC.getContext("webgl2") || testC.getContext("webgl")));
    } catch (_e) {
      webglOk = false;
    }

    function showFallback() {
      stageEl.hidden = true;
      if (fallbackEl) fallbackEl.textContent = "Hiện không thể mở triển lãm 3D.";
    }

    if (!webglOk) {
      showFallback();
      return;
    }
    const THREE = window.THREE;
    let sceneObj;
    stageEl.hidden = false;
    try {
      sceneObj = new GalleryScene(canvasEl, stageEl);
    } catch (error) {
      console.warn("Không khởi tạo được bộ sưu tập 3D:", error);
      showFallback();
      return;
    }
    if (fallbackEl) fallbackEl.hidden = true;
    const artworks = items.map((item, idx) => {
      const aw = new ArtworkMesh(item, idx, items.length);
      sceneObj.galleryGroup.add(aw.group);
      return aw;
    });

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let hoveredArtwork = null;
    let transitionCtrl = null;

    function hitTest(clientX, clientY) {
      const rect = canvasEl.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, sceneObj.camera);
      const hits = raycaster.intersectObjects(artworks.map((a) => a.artMesh), false);
      return hits.length ? hits[0].object.userData.artwork : null;
    }

    function getCenteredArtwork() {
      const center = Math.round(controls.angle / stepAngle);
      return artworks[((center % artworks.length) + artworks.length) % artworks.length];
    }

    const stepAngle = (Math.PI * 2) / artworks.length;
    const controls = new GalleryControls(
      stageEl,
      (cx, cy) => {
        const hit = hitTest(cx, cy);
        if (hit && transitionCtrl) transitionCtrl.openArtwork(hit);
      },
      (dir) => {
        if (!window.gsap || controls.locked) return;
        window.gsap.to(controls, {
          angle: controls.angle + dir * stepAngle,
          duration: 0.5,
          overwrite: "auto",
          ease: "power3.out"
        });
      }
    );

    transitionCtrl = new TransitionController(sceneObj, artworks, controls, items);

    // Hover nhẹ khi rê chuột lên sản phẩm
    stageEl.addEventListener("pointermove", (e) => {
      if (controls.locked || controls.isDragging) {
        hoveredArtwork = null;
        stageEl.classList.remove("is-hovering");
        return;
      }
      hoveredArtwork = hitTest(e.clientX, e.clientY);
      stageEl.classList.toggle("is-hovering", Boolean(hoveredArtwork));
    });
    stageEl.addEventListener("pointerleave", () => {
      hoveredArtwork = null;
      stageEl.classList.remove("is-hovering");
    });

    // Cập nhật tiêu đề bộ sưu tập động theo sản phẩm ở giữa
    const collSubEl = document.getElementById("bg3dCollSub");
    let lastCaption = "";

    const roomEntry = { progress: 0 };
    let entryTween;
    if (window.ScrollTrigger) {
      const plugin = window.ScrollTrigger;
      window.gsap.registerPlugin(plugin);
      entryTween = window.gsap.to(roomEntry, {
        progress: 1,
        ease: "none",
        scrollTrigger: {
          trigger: stageEl,
          start: () => {
            const header = document.querySelector(".ts-min-header");
            const mobileHeader = document.querySelector(".ts-mob-header");
            return "top " + ((header?.offsetHeight || mobileHeader?.offsetHeight || 0) + 4) + "px";
          },
          end: () => "+=" + Math.round(stageEl.clientHeight * 0.95),
          pin: sectionEl,
          pinSpacing: true,
          scrub: REDUCED_MOTION ? true : 0.28,
          invalidateOnRefresh: true
        }
      });
      plugin.refresh();
    }

    let lastLayoutAngle;
    let lastLayoutProgress;
    let settled = false;
    function layoutRoom(dt) {
      const { roomHalfWidth, artworkY, featureZ, featureScale, roomOffsetZ, previewArtworkRadius } = BADMINTON_GALLERY_CONFIG;
      const progress = sceneObj.roomProgress;
      if (settled && lastLayoutAngle === controls.angle && lastLayoutProgress === progress) return;
      const firstLayout = lastLayoutAngle === undefined;
      lastLayoutAngle = controls.angle;
      lastLayoutProgress = progress;
      settled = true;
      const mix = THREE.MathUtils.lerp;
      // Keep the original carousel responsive, while easing position changes on the room walls.
      const follow = firstLayout || REDUCED_MOTION ? 1 : mix(1, 1 - Math.exp(-18 * dt), progress);
      const center = Math.round(controls.angle / stepAngle);
      const half = Math.floor(artworks.length / 2);
      for (const artwork of artworks) {
        const angle = normalizeAngle(artwork.theta - controls.angle);
        const offset = ((artwork.index - center + half) % artworks.length + artworks.length) % artworks.length - half;
        const side = Math.sign(offset);
        const slot = Math.max(0, Math.abs(offset) - 1);
        const column = Math.floor(slot / 2);
        const wallY = slot % 2 === 0 ? 0.15 : 2.95;
        const roomZ = side ? -16.2 + column * 3.55 : featureZ;
        const x = mix(previewArtworkRadius * Math.sin(angle), side * (roomHalfWidth - 0.09), progress);
        const y = mix(artworkY, side ? wallY : artworkY, progress);
        const z = mix(-previewArtworkRadius * Math.cos(angle), roomZ + roomOffsetZ, progress);
        const rotation = -angle + normalizeAngle(angle - side * Math.PI / 2) * progress;
        const scale = mix(1, side ? 0.66 : featureScale, progress);
        const group = artwork.group;
        const turn = normalizeAngle(rotation - group.rotation.y);
        const arrived = Math.abs(x - group.position.x) + Math.abs(y - group.position.y) +
          Math.abs(z - group.position.z) + Math.abs(turn) + Math.abs(scale - group.scale.x) < 0.001;
        const blend = arrived ? 1 : follow;
        if (blend < 1) settled = false;
        group.position.set(mix(group.position.x, x, blend), mix(group.position.y, y, blend), mix(group.position.z, z, blend));
        group.rotation.y = blend === 1 ? rotation : normalizeAngle(group.rotation.y + turn * blend);
        group.scale.setScalar(mix(group.scale.x, scale, blend));
      }
    }

    let rafId = null;
    let lastTs = performance.now();
    let stageNearby = true;
    const visibility = new IntersectionObserver(([entry]) => {
      stageNearby = entry.isIntersecting;
    }, { rootMargin: "180px 0px" });
    visibility.observe(stageEl);

    function animate(ts) {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      if (!stageNearby && transitionCtrl.state === "gallery") return;
      controls.update(dt);
      const { cameraOutsideZ, cameraInsideZ, cameraY } = BADMINTON_GALLERY_CONFIG;
      if (transitionCtrl.state === "gallery") {
        const progress = roomEntry.progress;
        sceneObj.roomProgress = REDUCED_MOTION ? Number(progress >= 0.5) : progress * progress * (3 - 2 * progress);
      }
      const mobileOffset = sceneObj.camera.aspect < 1 ? THREE.MathUtils.lerp(-1.2, 1, sceneObj.roomProgress) : 0;
      sceneObj.baseCameraZ = THREE.MathUtils.lerp(cameraOutsideZ, cameraInsideZ, sceneObj.roomProgress) + mobileOffset;
      layoutRoom(dt);

      if (transitionCtrl.state === "gallery") {
        sceneObj.camera.position.set(0, cameraY, sceneObj.baseCameraZ);
        const appearanceBlend = 1 - Math.exp(-12 * dt);
        const sideOpacity = THREE.MathUtils.lerp(0.30, 0.90, sceneObj.roomProgress);
        const sideBrightness = THREE.MathUtils.lerp(0.54, 0.85, sceneObj.roomProgress);
        const sideCaption = THREE.MathUtils.lerp(0.14, 0.65, sceneObj.roomProgress);
        artworks.forEach((a) => {
          const isHov = a === hoveredArtwork;
          const distFromCenter = Math.abs(normalizeAngle(a.theta - controls.angle));
          const focusFactor = Math.exp(-Math.pow(distFromCenter / (stepAngle * 0.68), 2));

          // Sản phẩm chính giữa tự động phát sáng (hào quang trắng + sáng 100%) không cần hover; hai bên tối mờ dịu

          const targetOpacity = isHov ? 1.0 : sideOpacity + (1 - sideOpacity) * focusFactor;
          a.artMat.opacity += (targetOpacity - a.artMat.opacity) * appearanceBlend;

          const targetBright = isHov ? 1.0 : sideBrightness + (1 - sideBrightness) * focusFactor;
          const curBright = a.artMat.color.r;
          const nextBright = curBright + (targetBright - curBright) * appearanceBlend;
          a.artMat.color.setRGB(nextBright, nextBright, nextBright);

          if (a.glowMat) {
            const targetGlow = Math.pow(focusFactor, 2.2) * 0.95;
            a.glowMat.opacity += (targetGlow - a.glowMat.opacity) * appearanceBlend;
          }

          const targetCapOpacity = isHov ? 1.0 : sideCaption + (1 - sideCaption) * Math.pow(focusFactor, 1.5);
          a.capMat.opacity += (targetCapOpacity - a.capMat.opacity) * appearanceBlend;
        });

        const centered = getCenteredArtwork();
        const hint = roomEntry.progress < 0.8 ? "Cuộn xuống để tiến vào phòng" : "Dùng mũi tên để đổi sản phẩm";
        const caption = `${centered.item.title} • ${hint}`;
        if (collSubEl && caption !== lastCaption) {
          lastCaption = caption;
          collSubEl.textContent = caption;
        }
      }

      sceneObj.render();
    }
    rafId = requestAnimationFrame(animate);

    const onResize = () => sceneObj.resize();
    window.addEventListener("resize", onResize);

    window.addEventListener("beforeunload", () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      visibility.disconnect();
      entryTween?.scrollTrigger?.kill();
      entryTween?.kill();
      controls.dispose();
      artworks.forEach((a) => a.dispose());
      sceneObj.dispose();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await window.tsportCatalogReady;
    initBadmintonGallery3D();
  });
})();
