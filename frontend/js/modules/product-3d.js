/**
 * TSPORT — INTERACTIVE 3D PRODUCT VIEWER (THREE.JS WEBGL)
 * - Hỗ trợ xoay 360° mượt mà bằng chuột & cảm ứng (có quán tính damping 60fps)
 * - Cuộn chuột để thu phóng (zoom)
 * - Tự động dựng mô hình 3D chuẩn theo loại sản phẩm (Vợt cầu lông/tennis, Vợt Pickleball, Giày, Phụ kiện)
 * - Đổi màu sắc mô hình 3D realtime khi chọn biến thể màu
 */

(function () {
  class TsportProduct3DViewer {
    constructor(containerEl) {
      this.container = containerEl;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.productGroup = null;
      this.accentMaterials = [];
      this.primaryMaterials = [];

      // Trạng thái xoay mượt có quán tính
      this.targetRotY = 0.45;
      this.targetRotX = 0.16;
      this.currentRotY = 0.45;
      this.currentRotX = 0.16;
      this.velY = 0;
      this.velX = 0;

      // Zoom mượt
      this.targetZoom = 4.2;
      this.currentZoom = 4.2;

      // Tương tác chuột
      this.isDragging = false;
      this.lastPointerX = 0;
      this.lastPointerY = 0;
      this.autoRotate = true;
      this.animFrameId = null;
      this.disposed = false;
      this.resizeObserver = null;

      this._initThree();
      this._bindPointerEvents();
      this._animate();
    }

    _initThree() {
      if (typeof window.THREE === "undefined" || !this.container) return;
      const THREE = window.THREE;

      const w = this.container.clientWidth || 520;
      const h = this.container.clientHeight || 520;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
      this.camera.position.set(0, 0.25, this.currentZoom);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      this.container.innerHTML = "";
      this.container.appendChild(this.renderer.domElement);

      // Hệ thống ánh sáng studio 3 điểm mềm mại
      const ambient = new THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xffffff, 0xd1d5db, 0.65);
      hemi.position.set(0, 6, 0);
      this.scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
      keyLight.position.set(4, 6, 5);
      this.scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xffede6, 0.85);
      rimLight.position.set(-5, 3, -4);
      this.scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.45);
      fillLight.position.set(-3, -2, 4);
      this.scene.add(fillLight);

      // Đĩa bóng mờ dưới chân sản phẩm
      const shadowGeo = new THREE.CircleGeometry(1.35, 48);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.08,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -1.68;
      this.scene.add(shadowMesh);

      // Theo dõi thay đổi kích thước khung
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.container);
      } else {
        window.addEventListener("resize", () => this.resize());
      }
    }

    resize() {
      if (!this.renderer || !this.camera || !this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w <= 0 || h <= 0) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    loadProductModel(product, colorName) {
      if (!this.scene || typeof window.THREE === "undefined") return;
      const THREE = window.THREE;

      if (this.productGroup) {
        this.scene.remove(this.productGroup);
      }
      this.accentMaterials = [];
      this.primaryMaterials = [];

      const name = String(product?.name || "").toLowerCase();
      const palette = this._resolveColorPalette(colorName);

      if (name.includes("pickleball") && name.includes("vợt")) {
        this.productGroup = this._buildPickleballPaddle(THREE, palette);
      } else if (name.includes("giày")) {
        this.productGroup = this._buildSportShoe(THREE, palette);
      } else if (name.includes("vợt") || name.includes("astrox") || name.includes("clash") || name.includes("nanoflare")) {
        this.productGroup = this._buildBadmintonRacket(THREE, palette);
      } else if (name.includes("bóng") || name.includes("quả")) {
        this.productGroup = this._buildSportBall(THREE, palette);
      } else {
        // Mặc định dựng vợt cầu lông thể thao cao cấp
        this.productGroup = this._buildBadmintonRacket(THREE, palette);
      }

      this.scene.add(this.productGroup);
      this.resetView();
    }

    setColorVariant(colorName) {
      if (typeof window.THREE === "undefined") return;
      const THREE = window.THREE;
      const palette = this._resolveColorPalette(colorName);

      this.primaryMaterials.forEach((mat) => {
        mat.color.setHex(palette.primary);
      });
      this.accentMaterials.forEach((mat) => {
        mat.color.setHex(palette.accent);
      });
    }

    setAutoRotate(enabled) {
      this.autoRotate = Boolean(enabled);
    }

    resetView() {
      this.targetRotY = 0.48;
      this.targetRotX = 0.14;
      this.targetZoom = 4.2;
      this.velX = 0;
      this.velY = 0;
    }

    _resolveColorPalette(colorName) {
      const text = String(colorName || "").toLowerCase();
      if (text.includes("trắng")) {
        return { primary: 0xf3f4f6, accent: 0xd94c26, grip: 0x1f2937 };
      }
      if (text.includes("xanh dương") || text.includes("navy") || text.includes("xanh")) {
        return { primary: 0x1e3a8a, accent: 0x38bdf8, grip: 0x111827 };
      }
      if (text.includes("vàng") || text.includes("gold")) {
        return { primary: 0x1f2937, accent: 0xf59e0b, grip: 0x111827 };
      }
      if (text.includes("cam")) {
        return { primary: 0x1f2937, accent: 0xd94c26, grip: 0x111827 };
      }
      if (text.includes("tím")) {
        return { primary: 0x312e81, accent: 0xa855f7, grip: 0x111827 };
      }
      // Mặc định: Đen Carbon / Đỏ Cam Tsport
      return { primary: 0x18181b, accent: 0xd94c26, grip: 0x111827 };
    }

    // 1. MÔ HÌNH 3D VỢT CẦU LÔNG / TENNIS CHI TIẾT CAO
    _buildBadmintonRacket(THREE, palette) {
      const group = new THREE.Group();

      const frameMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        metalness: 0.45,
        roughness: 0.28
      });
      this.primaryMaterials.push(frameMat);

      const accentMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        metalness: 0.52,
        roughness: 0.25
      });
      this.accentMaterials.push(accentMat);

      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.55,
        roughness: 0.22
      });

      const gripMat = new THREE.MeshStandardMaterial({
        color: palette.grip,
        metalness: 0.05,
        roughness: 0.88
      });

      const stringMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.1,
        roughness: 0.4,
        transparent: true,
        opacity: 0.88
      });

      // Đầu vợt hình oval isometric
      const rx = 0.62;
      const ry = 0.78;
      const headCenterY = 0.78;
      const headPoints = [];
      const segments = 72;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        // Làm hơi vuông nhẹ đầu isometric
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const isoX = Math.sign(cosT) * Math.pow(Math.abs(cosT), 0.92) * rx;
        const isoY = Math.sign(sinT) * Math.pow(Math.abs(sinT), 0.94) * ry + headCenterY;
        headPoints.push(new THREE.Vector3(isoX, isoY, 0));
      }
      const headCurve = new THREE.CatmullRomCurve3(headPoints, true);
      const headGeo = new THREE.TubeGeometry(headCurve, 96, 0.042, 16, true);
      const headMesh = new THREE.Mesh(headGeo, frameMat);
      group.add(headMesh);

      // Dải màu nhấn 2 bên khung vợt (3h & 9h)
      [-1, 1].forEach((side) => {
        const accentPts = [];
        for (let i = -10; i <= 10; i++) {
          const ang = (side === 1 ? 0 : Math.PI) + (i / 10) * 0.62;
          const x = Math.cos(ang) * rx;
          const y = Math.sin(ang) * ry + headCenterY;
          accentPts.push(new THREE.Vector3(x, y, 0));
        }
        const accentCurve = new THREE.CatmullRomCurve3(accentPts);
        const accentGeo = new THREE.TubeGeometry(accentCurve, 28, 0.046, 12, false);
        group.add(new THREE.Mesh(accentGeo, accentMat));
      });

      // Khớp chữ T (T-Joint)
      const tJointGeo = new THREE.CylinderGeometry(0.055, 0.042, 0.16, 16);
      const tJoint = new THREE.Mesh(tJointGeo, accentMat);
      tJoint.position.y = headCenterY - ry - 0.04;
      group.add(tJoint);

      // Lưới cước đan dọc & ngang sắc nét
      const stringsGroup = new THREE.Group();
      const vLines = 15;
      for (let i = 1; i < vLines; i++) {
        const u = (i / vLines) * 2 - 1;
        const x = u * (rx - 0.055);
        const maxY = Math.sqrt(Math.max(0, 1 - Math.pow(x / (rx - 0.02), 2))) * (ry - 0.035);
        if (maxY > 0.08) {
          const geo = new THREE.CylinderGeometry(0.0045, 0.0045, maxY * 2, 6);
          const mesh = new THREE.Mesh(geo, stringMat);
          mesh.position.set(x, headCenterY, 0);
          stringsGroup.add(mesh);
        }
      }
      const hLines = 18;
      for (let i = 1; i < hLines; i++) {
        const u = (i / hLines) * 2 - 1;
        const yOff = u * (ry - 0.055);
        const maxX = Math.sqrt(Math.max(0, 1 - Math.pow(yOff / (ry - 0.02), 2))) * (rx - 0.035);
        if (maxX > 0.08) {
          const geo = new THREE.CylinderGeometry(0.0045, 0.0045, maxX * 2, 6);
          const mesh = new THREE.Mesh(geo, stringMat);
          mesh.rotation.z = Math.PI / 2;
          mesh.position.set(0, headCenterY + yOff, 0);
          stringsGroup.add(mesh);
        }
      }
      group.add(stringsGroup);

      // Thân đũa vợt (Carbon Shaft)
      const shaftLen = 0.86;
      const shaftGeo = new THREE.CylinderGeometry(0.022, 0.025, shaftLen, 16);
      const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
      shaftMesh.position.y = headCenterY - ry - 0.09 - shaftLen / 2;
      group.add(shaftMesh);

      // Vòng trang trí trên thân vợt
      const ringGeo = new THREE.CylinderGeometry(0.027, 0.027, 0.1, 16);
      const ringMesh = new THREE.Mesh(ringGeo, accentMat);
      ringMesh.position.y = headCenterY - ry - 0.45;
      group.add(ringMesh);

      // Chụp cán vợt (Cone / Ferrule)
      const coneTopY = headCenterY - ry - 0.09 - shaftLen;
      const coneGeo = new THREE.CylinderGeometry(0.028, 0.068, 0.16, 16);
      const coneMesh = new THREE.Mesh(coneGeo, frameMat);
      coneMesh.position.y = coneTopY - 0.08;
      group.add(coneMesh);

      // Cán cầm quấn grip (Grip Handle)
      const gripLen = 0.62;
      const gripGeo = new THREE.CylinderGeometry(0.068, 0.074, gripLen, 8);
      const gripMesh = new THREE.Mesh(gripGeo, gripMat);
      gripMesh.position.y = coneTopY - 0.16 - gripLen / 2;
      group.add(gripMesh);

      // Đường quấn cán xoắn nhẹ tạo chiều sâu thực tế
      const wrapRingMat = new THREE.MeshStandardMaterial({
        color: 0x374151,
        roughness: 0.9
      });
      for (let i = 0; i < 6; i++) {
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.071, 0.006, 8, 24), wrapRingMat);
        torus.rotation.x = Math.PI / 2 + 0.14;
        torus.position.y = coneTopY - 0.22 - i * 0.095;
        group.add(torus);
      }

      // Đế chụp cuối cán (Butt Cap)
      const capGeo = new THREE.CylinderGeometry(0.076, 0.08, 0.055, 8);
      const capMesh = new THREE.Mesh(capGeo, accentMat);
      capMesh.position.y = coneTopY - 0.16 - gripLen - 0.025;
      group.add(capMesh);

      // Nghiêng nhẹ góc trưng bày thể thao đẹp mắt
      group.position.y = 0.08;
      group.rotation.z = -0.22;
      return group;
    }

    // 2. MÔ HÌNH 3D VỢT PICKLEBALL
    _buildPickleballPaddle(THREE, palette) {
      const group = new THREE.Group();

      const faceMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        metalness: 0.25,
        roughness: 0.45
      });
      this.primaryMaterials.push(faceMat);

      const accentMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        metalness: 0.4,
        roughness: 0.3
      });
      this.accentMaterials.push(accentMat);

      const gripMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.88
      });

      // Mặt vợt bo góc chuẩn Pickleball
      const shape = new THREE.Shape();
      const w = 0.64;
      const h = 0.88;
      const r = 0.16;
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.quadraticCurveTo(w, -h, w, -h + r);
      shape.lineTo(w, h - r);
      shape.quadraticCurveTo(w, h, w - r, h);
      shape.lineTo(-w + r, h);
      shape.quadraticCurveTo(-w, h, -w, h - r);
      shape.lineTo(-w, -h + r);
      shape.quadraticCurveTo(-w, -h, -w + r, -h);

      const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.02
      });
      extrudeGeo.center();
      const faceMesh = new THREE.Mesh(extrudeGeo, faceMat);
      faceMesh.position.y = 0.42;
      group.add(faceMesh);

      // Dải sọc thương hiệu 2 mặt vợt
      [-0.068, 0.068].forEach((zPos) => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 0.01), accentMat);
        stripe.position.set(0, 0.42, zPos);
        stripe.rotation.z = 0.16;
        group.add(stripe);
      });

      // Cổ vợt & tay cầm
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.095, 0.22, 16), accentMat);
      neck.position.y = -0.54;
      group.add(neck);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.098, 0.72, 12), gripMat);
      handle.position.y = -0.98;
      group.add(handle);

      const butt = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.11, 0.06, 12), accentMat);
      butt.position.y = -1.36;
      group.add(butt);

      group.rotation.z = -0.18;
      return group;
    }

    // 3. MÔ HÌNH 3D GIÀY THỂ THAO
    _buildSportShoe(THREE, palette) {
      const group = new THREE.Group();

      const upperMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        metalness: 0.12,
        roughness: 0.62
      });
      this.primaryMaterials.push(upperMat);

      const accentMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        metalness: 0.25,
        roughness: 0.42
      });
      this.accentMaterials.push(accentMat);

      const soleMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.55
      });

      // Đế giày (Midsole + Outsole)
      const sole = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.26, 0.86), soleMat);
      sole.position.set(0, -0.35, 0);
      group.add(sole);

      const tread = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.08, 0.88), accentMat);
      tread.position.set(0, -0.49, 0);
      group.add(tread);

      // Thân giày chính (Upper)
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.54, 0.78), upperMat);
      body.position.set(-0.08, 0.02, 0);
      group.add(body);

      // Mũi giày bo tròn
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.41, 24, 16), upperMat);
      toe.scale.set(1.3, 0.72, 0.94);
      toe.position.set(0.76, -0.06, 0);
      group.add(toe);

      // Cổ giày (Collar)
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.36, 20), accentMat);
      collar.position.set(-0.62, 0.36, 0);
      group.add(collar);

      // Dải sọc thể thao 2 bên hông
      [-0.4, 0.4].forEach((z) => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.03), accentMat);
        stripe.position.set(0.05, 0.02, z);
        stripe.rotation.z = -0.18;
        group.add(stripe);
      });

      group.position.y = -0.15;
      return group;
    }

    // 4. MÔ HÌNH 3D BÓNG THỂ THAO
    _buildSportBall(THREE, palette) {
      const group = new THREE.Group();
      const baseMat = new THREE.MeshStandardMaterial({
        color: palette.primary === 0x18181b ? 0xf8fafc : palette.primary,
        roughness: 0.38,
        metalness: 0.08
      });
      this.primaryMaterials.push(baseMat);

      const accentMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.35
      });
      this.accentMaterials.push(accentMat);

      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.95, 40, 40), baseMat);
      group.add(sphere);

      const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.955, 0.022, 12, 64), accentMat);
      group.add(band1);

      const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.955, 0.022, 12, 64), accentMat);
      band2.rotation.y = Math.PI / 2;
      group.add(band2);

      return group;
    }

    _bindPointerEvents() {
      if (!this.renderer) return;
      const dom = this.renderer.domElement;

      const onPointerDown = (e) => {
        this.isDragging = true;
        this.autoRotate = false;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.velX = 0;
        this.velY = 0;
        dom.setPointerCapture?.(e.pointerId);
        this.container.classList.add("is-dragging");
        window.dispatchEvent(new CustomEvent("tsport-3d-autorotate-change", { detail: { autoRotate: false } }));
      };

      const onPointerMove = (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;

        this.velY = dx * 0.0085;
        this.velX = dy * 0.0065;
        this.targetRotY += this.velY;
        this.targetRotX = Math.max(-1.15, Math.min(1.15, this.targetRotX + this.velX));
      };

      const onPointerUp = (e) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        dom.releasePointerCapture?.(e.pointerId);
        this.container.classList.remove("is-dragging");
      };

      const onWheel = (e) => {
        e.preventDefault();
        this.targetZoom = Math.max(2.5, Math.min(6.2, this.targetZoom + e.deltaY * 0.0028));
      };

      dom.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      dom.addEventListener("wheel", onWheel, { passive: false });
    }

    _animate() {
      if (this.disposed) return;
      this.animFrameId = requestAnimationFrame(() => this._animate());

      if (this.productGroup) {
        if (!this.isDragging) {
          if (this.autoRotate) {
            this.targetRotY += 0.006;
          } else {
            // Quán tính mượt khi thả chuột
            this.targetRotY += this.velY;
            this.targetRotX = Math.max(-1.15, Math.min(1.15, this.targetRotX + this.velX));
            this.velY *= 0.92;
            this.velX *= 0.92;
          }
        }

        // Damping mượt mà 60fps
        this.currentRotY += (this.targetRotY - this.currentRotY) * 0.14;
        this.currentRotX += (this.targetRotX - this.currentRotX) * 0.14;

        this.productGroup.rotation.y = this.currentRotY;
        this.productGroup.rotation.x = this.currentRotX;
      }

      if (this.camera) {
        this.currentZoom += (this.targetZoom - this.currentZoom) * 0.12;
        this.camera.position.z = this.currentZoom;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  window.TsportProduct3DViewer = TsportProduct3DViewer;
})();
