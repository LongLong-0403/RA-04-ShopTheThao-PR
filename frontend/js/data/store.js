/**
 * TSPORT — QUẢN LÝ DỮ LIỆU TẬP TRUNG (STORE & LOCAL STORAGE)
 * Đồng bộ chuẩn SRS & Backend FastAPI:
 * - 5 Môn thể thao (Sports)
 * - 16 Danh mục (Categories) có cấu trúc Cây cha - con
 * - 11 Thương hiệu (Brands)
 * - 38 Sản phẩm (Products) có bảng SKU, Upload ảnh, Thông số & Hàng cũ hao mòn
 */

(function () {
  const STORAGE_KEY = "tsport_store_data_v2";

  // Dữ liệu hạt giống (Seed Data) chuẩn SRS
  const initialData = {
    sports: [
      { id: 1, name: "Cầu lông", slug: "cau-long", description: "Môn thể thao dùng vợt đánh cầu lông phong trào và chuyên nghiệp", status: "ACTIVE" },
      { id: 2, name: "Bóng đá", slug: "bong-da", description: "Môn thể thao vua với giày đinh sân cỏ nhân tạo và bóng thi đấu", status: "ACTIVE" },
      { id: 3, name: "Tennis", slug: "tennis", description: "Quần vợt chuyên nghiệp với vợt trợ lực và bóng thi đấu nỉ cao cấp", status: "ACTIVE" },
      { id: 4, name: "Pickleball", slug: "pickleball", description: "Môn thể thao xu hướng kết hợp bóng bàn, tennis và cầu lông", status: "ACTIVE" },
      { id: 5, name: "Bóng rổ", slug: "bong-ro", description: "Môn thể thao bóng rổ trong nhà sàn gỗ và ngoài trời bê tông", status: "ACTIVE" }
    ],
    categories: [
      { id: 1, parent_id: null, sport_id: 1, name: "Vợt thể thao", slug: "vot-the-thao", status: "ACTIVE" },
      { id: 2, parent_id: 1, sport_id: 1, name: "Vợt cầu lông", slug: "vot-cau-long", status: "ACTIVE" },
      { id: 3, parent_id: 1, sport_id: 3, name: "Vợt Tennis", slug: "vot-tennis", status: "ACTIVE" },
      { id: 4, parent_id: 1, sport_id: 4, name: "Vợt Pickleball", slug: "vot-pickleball", status: "ACTIVE" },
      { id: 5, parent_id: null, sport_id: 2, name: "Giày thể thao", slug: "giay-the-thao", status: "ACTIVE" },
      { id: 6, parent_id: 5, sport_id: 1, name: "Giày cầu lông", slug: "giay-cau-long", status: "ACTIVE" },
      { id: 7, parent_id: 5, sport_id: 2, name: "Giày bóng đá", slug: "giay-bong-da", status: "ACTIVE" },
      { id: 8, parent_id: 5, sport_id: 3, name: "Giày Tennis & Pickleball", slug: "giay-tennis-pickleball", status: "ACTIVE" },
      { id: 9, parent_id: null, sport_id: 1, name: "Bóng & Quả thi đấu", slug: "bong-va-qua-thi-dau", status: "ACTIVE" },
      { id: 10, parent_id: 9, sport_id: 1, name: "Quả cầu lông", slug: "qua-cau-long", status: "ACTIVE" },
      { id: 11, parent_id: 9, sport_id: 2, name: "Quả bóng đá", slug: "qua-bong-da", status: "ACTIVE" },
      { id: 12, parent_id: 9, sport_id: 3, name: "Bóng Tennis", slug: "bong-tennis", status: "ACTIVE" },
      { id: 13, parent_id: 9, sport_id: 4, name: "Bóng Pickleball", slug: "bong-pickleball", status: "ACTIVE" },
      { id: 14, parent_id: null, sport_id: 1, name: "Trang phục & Balo", slug: "trang-phuc-balo", status: "ACTIVE" },
      { id: 15, parent_id: 14, sport_id: 1, name: "Áo đấu & Trang phục", slug: "ao-dau-trang-phuc", status: "ACTIVE" },
      { id: 16, parent_id: 14, sport_id: 1, name: "Túi vợt & Balo", slug: "tui-vot-balo", status: "ACTIVE" }
    ],
    brands: [
      { id: 1, name: "Yonex", slug: "yonex", logo_url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=120", status: "ACTIVE" },
      { id: 2, name: "Lining", slug: "lining", logo_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120", status: "ACTIVE" },
      { id: 3, name: "Victor", slug: "victor", logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120", status: "ACTIVE" },
      { id: 4, name: "Nike", slug: "nike", logo_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120", status: "ACTIVE" },
      { id: 5, name: "Adidas", slug: "adidas", logo_url: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=120", status: "ACTIVE" },
      { id: 6, name: "Wilson", slug: "wilson", logo_url: "https://images.unsplash.com/photo-1530915365347-e34b1e8df1db?w=120", status: "ACTIVE" },
      { id: 7, name: "Babolat", slug: "babolat", logo_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=120", status: "ACTIVE" },
      { id: 8, name: "Selkirk", slug: "selkirk", logo_url: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=120", status: "ACTIVE" },
      { id: 9, name: "Joola", slug: "joola", logo_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=120", status: "ACTIVE" },
      { id: 10, name: "Mizuno", slug: "mizuno", logo_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120", status: "ACTIVE" },
      { id: 11, name: "Kamito", slug: "kamito", logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120", status: "ACTIVE" }
    ],
    products: [
      {
        id: 1,
        sport_id: 1,
        category_id: 2,
        brand_id: 1,
        name: "Vợt cầu lông Yonex Astrox 88D Pro 2024",
        description: "Dòng vợt tấn công đỉnh cao dành cho người chơi cầu sau, trợ lực đập smash cực mạnh.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { weight: "3U, 4U", grip: "G5", tension: "28 lbs", balance: "Head Heavy", material: "HM Graphite + Namd" },
        images: [
          { id: 1, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true, sort_order: 1 },
          { id: 2, image_url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=600", is_primary: false, sort_order: 2 }
        ],
        skus: [
          { id: 1, sku_code: "AX88DP-4U-BK", size: "4U", color: "Đen Đỏ", price: 4250000, stock: 15, unit: "CHIEC", quantity_per_lot: 1 },
          { id: 2, sku_code: "AX88DP-3U-BK", size: "3U", color: "Đen Đỏ", price: 4250000, stock: 10, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 2,
        sport_id: 1,
        category_id: 2,
        brand_id: 1,
        name: "Vợt cầu lông Yonex Nanoflare 1000Z",
        description: "Siêu phẩm tốc độ đẩy cầu, vung vợt chớp nhoáng với công nghệ Sonic Flare System.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { weight: "4U", grip: "G5", tension: "28 lbs", balance: "Head Light", material: "Ultra PE Fiber" },
        images: [
          { id: 3, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 3, sku_code: "NF1000Z-4U-YL", size: "4U", color: "Vàng Lightning", price: 4100000, stock: 18, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 3,
        sport_id: 1,
        category_id: 2,
        brand_id: 2,
        name: "Vợt cầu lông Lining Axforce 90 Max Tiger",
        description: "Vợt dành cho lối đánh uy lực như hổ săn mồi, thân vợt mỏng dẻo tạo lực nảy lớn.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { weight: "3U, 4U", grip: "G5", tension: "30 lbs", balance: "Heavy Head", material: "TB Nano + M50 Super" },
        images: [
          { id: 4, image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 4, sku_code: "AX90T-4U-RD", size: "4U", color: "Đỏ Hổ", price: 3950000, stock: 20, unit: "CHIEC", quantity_per_lot: 1 },
          { id: 5, sku_code: "AX90T-3U-RD", size: "3U", color: "Đỏ Hổ", price: 3950000, stock: 12, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 4,
        sport_id: 1,
        category_id: 6,
        brand_id: 1,
        name: "Giày cầu lông Yonex Power Cushion 65Z3",
        description: "Đôi giày quốc dân êm ái, bám sân cực tốt và giảm chấn thương gót chân tối đa.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { outsole: "Radial Blade Sole", midsole: "Power Cushion+", upper: "Synthetic Fiber", weight: "310g" },
        images: [
          { id: 5, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 6, sku_code: "65Z3-WH-40", size: "40", color: "Trắng Đỏ", price: 2650000, stock: 20, unit: "CHIEC", quantity_per_lot: 1 },
          { id: 7, sku_code: "65Z3-WH-41", size: "41", color: "Trắng Đỏ", price: 2650000, stock: 30, unit: "CHIEC", quantity_per_lot: 1 },
          { id: 8, sku_code: "65Z3-WH-42", size: "42", color: "Trắng Đỏ", price: 2650000, stock: 25, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 5,
        sport_id: 2,
        category_id: 7,
        brand_id: 4,
        name: "Giày đá bóng Nike Mercurial Vapor 15 Pro TF",
        description: "Đế đệm Air Zoom đàn hồi, bứt tốc trên sân cỏ nhân tạo cực bén.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { surface: "Sân cỏ nhân tạo TF", upper: "NikeSkin", cushion: "Air Zoom" },
        images: [
          { id: 9, image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 9, sku_code: "VAPOR15-TF-40", size: "40", color: "Đỏ Cam Hồng", price: 2850000, stock: 15, unit: "CHIEC", quantity_per_lot: 1 },
          { id: 10, sku_code: "VAPOR15-TF-41", size: "41", color: "Đỏ Cam Hồng", price: 2850000, stock: 20, unit: "CHIEC", quantity_per_lot: 1 },
          { id: 11, sku_code: "VAPOR15-TF-42", size: "42", color: "Đỏ Cam Hồng", price: 2850000, stock: 18, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 6,
        sport_id: 4,
        category_id: 4,
        brand_id: 9,
        name: "Vợt Pickleball Joola Ben Johns Perseus 16mm",
        description: "Vợt thi đấu chuyên nghiệp của số 1 thế giới Ben Johns, mặt carbon CFS độ bám xoáy vượt trội.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { core: "16mm Reactive Honeycomb", surface: "Carbon Friction Surface", weight: "8.0 oz" },
        images: [
          { id: 12, image_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 12, sku_code: "JOOLA-PERSEUS-16MM", size: "16mm", color: "Đen Bạc Nhám", price: 6200000, stock: 20, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 7,
        sport_id: 1,
        category_id: 10,
        brand_id: 1,
        name: "Ống cầu lông Yonex Aerosensa 50 (Lô 12 quả)",
        description: "Quả cầu lông lông vũ cao cấp chuẩn thi đấu Olympic và BWF World Tour.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { feather: "Lông ngỗng tuyển chọn", speed: "Speed 77", quantity: "12 quả / ống" },
        images: [
          { id: 13, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 13, sku_code: "YONEX-AS50-TUBE", size: "Tiêu chuẩn", color: "Trắng", price: 850000, stock: 80, unit: "LO", quantity_per_lot: 12 }
        ]
      },
      {
        id: 8,
        sport_id: 4,
        category_id: 13,
        brand_id: 9,
        name: "Hộp 3 Quả bóng Pickleball Joola Primo (Lô 3 quả)",
        description: "Bóng thi đấu ngoài trời 40 lỗ chuẩn USAPA, đường bay ổn định.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { holes: "40 lỗ khoan", type: "Outdoor", quantity: "3 quả / hộp" },
        images: [
          { id: 14, image_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 14, sku_code: "JOOLA-PRIMO-3PK", size: "Hộp 3 quả", color: "Vàng Chanh Neon", price: 250000, stock: 200, unit: "LO", quantity_per_lot: 3 }
        ]
      },
      // SẢN PHẨM CŨ (CONDITION_TYPE = 'CU') CÓ MÔ TẢ HAO MÒN THEO CHUẨN SRS
      {
        id: 9,
        sport_id: 1,
        category_id: 2,
        brand_id: 1,
        name: "Vợt cầu lông Yonex Astrox 100ZZ Kurenai (Đã qua sử dụng 92%)",
        description: "Cây vợt cựu số 1 Viktor Axelsen, đũa vợt siêu mỏng trợ lực tấn công mạnh mẽ.",
        condition_type: "CU",
        wear_description: "Khung vợt xước nhẹ 2 vết góc 2h và 10h do cạch cầu, không nứt lún cacbon, gen vợt đã thay mới, nước sơn đỏ Kurenai còn bóng đẹp, đũa vợt nguyên bản.",
        status: "ACTIVE",
        specifications: { weight: "4U", grip: "G5", tension_current: "26.5 lbs BG65Ti", condition_grade: "92%" },
        images: [
          { id: 15, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 15, sku_code: "USED-AX100ZZ-4U", size: "4U/G5", color: "Đỏ Kurenai", price: 2700000, stock: 1, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 10,
        sport_id: 1,
        category_id: 2,
        brand_id: 3,
        name: "Vợt cầu lông Victor Auraspeed 90K II (Đã qua sử dụng 95%)",
        description: "Vợt tốc độ phản tạt đôi nam cực thoát tay, ngoại hình còn rất mới.",
        condition_type: "CU",
        wear_description: "Ngoại hình như mới 95%, chỉ xước dăm li ti ở nắp chụp cán vợt, khung chưa từng va chạm mạnh, tem phân phối chính hãng còn nguyên.",
        status: "ACTIVE",
        specifications: { weight: "3U", grip: "G5", tension_current: "27 lbs VBS-66N", condition_grade: "95%" },
        images: [
          { id: 16, image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 16, sku_code: "USED-ARS90K2-3U", size: "3U/G5", color: "Trắng Xanh Tím", price: 2450000, stock: 1, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 11,
        sport_id: 4,
        category_id: 4,
        brand_id: 9,
        name: "Vợt Pickleball Joola Hyperion CFS 16 Swift (Đã qua sử dụng 93%)",
        description: "Mẫu vợt bán chạy nhất của Joola với lõi carbon giảm rung chấn tuyệt hảo.",
        condition_type: "CU",
        wear_description: "Mặt nhám carbon còn độ bám xoáy tốt 90%, viền cạnh vợt có vết cọ nhẹ do đỡ bóng thấp sát sàn, cán cuốn mới 100%.",
        status: "ACTIVE",
        specifications: { core: "16mm Reactive Core", face: "Carbon Friction Surface", weight: "7.9 oz", condition_grade: "93%" },
        images: [
          { id: 17, image_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 17, sku_code: "USED-JOOLA-HYP-16", size: "16mm", color: "Đen Carbon", price: 3400000, stock: 1, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      },
      {
        id: 12,
        sport_id: 1,
        category_id: 6,
        brand_id: 1,
        name: "Giày cầu lông Yonex Comfort Z3 Wide (Đã qua sử dụng 90%)",
        description: "Dòng giày siêu êm ái đệm Power Cushion toàn bàn chân form chân bè 4E.",
        condition_type: "CU",
        wear_description: "Đế giày mòn nhẹ góc ngoài gót chân khoảng 10%, da upper và mũi giày nguyên vẹn không rách, lót giày trong còn nguyên đệm khí êm.",
        status: "ACTIVE",
        specifications: { size: "41", width: "4E Wide", usage_time: "3 tháng (đánh 2 buổi/tuần)", condition_grade: "90%" },
        images: [
          { id: 18, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 18, sku_code: "USED-CZ3-WH-41", size: "41", color: "Trắng Đen", price: 1650000, stock: 1, unit: "CHIEC", quantity_per_lot: 1 }
        ]
      }
    ]
  };

  class TsportStore {
    constructor() {
      this.data = this.load();
    }

    load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Lỗi đọc localStorage:", e);
      }
      return JSON.parse(JSON.stringify(initialData));
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn("Lỗi lưu localStorage:", e);
      }
    }

    reset() {
      this.data = JSON.parse(JSON.stringify(initialData));
      this.save();
      return this.data;
    }

    // --- QUẢN LÝ MÔN THỂ THAO ---
    getSports() {
      return this.data.sports;
    }

    getSportById(id) {
      return this.data.sports.find((s) => s.id === Number(id));
    }

    saveSport(sport) {
      if (sport.id) {
        const idx = this.data.sports.findIndex((s) => s.id === Number(sport.id));
        if (idx !== -1) {
          this.data.sports[idx] = { ...this.data.sports[idx], ...sport, id: Number(sport.id) };
        }
      } else {
        const newId = this.data.sports.length ? Math.max(...this.data.sports.map((s) => s.id)) + 1 : 1;
        this.data.sports.push({ ...sport, id: newId, status: sport.status || "ACTIVE" });
      }
      this.save();
    }

    deleteSport(id) {
      const sportId = Number(id);
      // RÀNG BUỘC SRS: Kiểm tra còn sản phẩm tham chiếu
      const productCount = this.data.products.filter((p) => p.sport_id === sportId).length;
      if (productCount > 0) {
        const sport = this.getSportById(sportId);
        throw new Error(`Không thể xóa môn thể thao "${sport ? sport.name : sportId}" vì đang có ${productCount} sản phẩm thuộc môn này! Vui lòng chuyển hoặc xóa sản phẩm trước, hoặc chuyển trạng thái sang INACTIVE.`);
      }
      this.data.sports = this.data.sports.filter((s) => s.id !== sportId);
      this.save();
    }

    // --- QUẢN LÝ DANH MỤC (CÂY CHA - CON) ---
    getCategories() {
      return this.data.categories;
    }

    getCategoryById(id) {
      return this.data.categories.find((c) => c.id === Number(id));
    }

    // Lấy cây phân cấp danh mục
    getCategoryTree() {
      const all = this.data.categories;
      const roots = all.filter((c) => !c.parent_id);
      return roots.map((root) => {
        const children = all.filter((c) => c.parent_id === root.id);
        return {
          ...root,
          children
        };
      });
    }

    saveCategory(cat) {
      const parentId = cat.parent_id ? Number(cat.parent_id) : null;
      if (cat.id) {
        const catId = Number(cat.id);
        if (parentId === catId) throw new Error("Danh mục không thể làm cha của chính nó!");
        const idx = this.data.categories.findIndex((c) => c.id === catId);
        if (idx !== -1) {
          this.data.categories[idx] = { ...this.data.categories[idx], ...cat, id: catId, parent_id: parentId };
        }
      } else {
        const newId = this.data.categories.length ? Math.max(...this.data.categories.map((c) => c.id)) + 1 : 1;
        this.data.categories.push({ ...cat, id: newId, parent_id: parentId, status: cat.status || "ACTIVE" });
      }
      this.save();
    }

    deleteCategory(id) {
      const catId = Number(id);
      const cat = this.getCategoryById(catId);
      // RÀNG BUỘC 1: Còn danh mục con
      const children = this.data.categories.filter((c) => c.parent_id === catId);
      if (children.length > 0) {
        throw new Error(`Không thể xóa danh mục "${cat ? cat.name : catId}" vì đang chứa ${children.length} danh mục con (${children.map(c => c.name).join(', ')})! Vui lòng xóa hoặc di chuyển danh mục con trước.`);
      }
      // RÀNG BUỘC 2: Còn sản phẩm tham chiếu
      const productCount = this.data.products.filter((p) => p.category_id === catId).length;
      if (productCount > 0) {
        throw new Error(`Không thể xóa danh mục "${cat ? cat.name : catId}" vì đang có ${productCount} sản phẩm thuộc danh mục này! Vui lòng chuyển sản phẩm hoặc đặt trạng thái INACTIVE.`);
      }
      this.data.categories = this.data.categories.filter((c) => c.id !== catId);
      this.save();
    }

    // --- QUẢN LÝ THƯƠNG HIỆU ---
    getBrands() {
      return this.data.brands;
    }

    getBrandById(id) {
      return this.data.brands.find((b) => b.id === Number(id));
    }

    saveBrand(brand) {
      if (brand.id) {
        const idx = this.data.brands.findIndex((b) => b.id === Number(brand.id));
        if (idx !== -1) {
          this.data.brands[idx] = { ...this.data.brands[idx], ...brand, id: Number(brand.id) };
        }
      } else {
        const newId = this.data.brands.length ? Math.max(...this.data.brands.map((b) => b.id)) + 1 : 1;
        this.data.brands.push({ ...brand, id: newId, status: brand.status || "ACTIVE" });
      }
      this.save();
    }

    deleteBrand(id) {
      const brandId = Number(id);
      // RÀNG BUỘC: Còn sản phẩm tham chiếu
      const productCount = this.data.products.filter((p) => p.brand_id === brandId).length;
      if (productCount > 0) {
        const brand = this.getBrandById(brandId);
        throw new Error(`Không thể xóa thương hiệu "${brand ? brand.name : brandId}" vì đang có ${productCount} sản phẩm thuộc hãng này! Vui lòng chuyển sản phẩm sang hãng khác hoặc đổi sang INACTIVE.`);
      }
      this.data.brands = this.data.brands.filter((b) => b.id !== brandId);
      this.save();
    }

    // --- QUẢN LÝ SẢN PHẨM & SKU ---
    getProducts(filters = {}) {
      let list = [...this.data.products];
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.skus.some((s) => s.sku_code.toLowerCase().includes(q) || (s.size && s.size.toLowerCase().includes(q)) || (s.color && s.color.toLowerCase().includes(q)))
        );
      }
      if (filters.sport_id && filters.sport_id !== "ALL") {
        list = list.filter((p) => p.sport_id === Number(filters.sport_id));
      }
      if (filters.category_id && filters.category_id !== "ALL") {
        list = list.filter((p) => p.category_id === Number(filters.category_id));
      }
      if (filters.brand_id && filters.brand_id !== "ALL") {
        list = list.filter((p) => p.brand_id === Number(filters.brand_id));
      }
      if (filters.condition_type && filters.condition_type !== "ALL") {
        list = list.filter((p) => p.condition_type === filters.condition_type);
      }
      return list;
    }

    getProductById(id) {
      return this.data.products.find((p) => p.id === Number(id));
    }

    saveProduct(prod) {
      // Validate theo chuẩn SRS
      if (!prod.name || !prod.name.trim()) throw new Error("Tên sản phẩm không được để trống!");
      if (!prod.sport_id) throw new Error("Vui lòng chọn môn thể thao!");
      if (!prod.category_id) throw new Error("Vui lòng chọn danh mục!");
      if (!prod.brand_id) throw new Error("Vui lòng chọn thương hiệu!");
      if (prod.condition_type === "CU" && (!prod.wear_description || !prod.wear_description.trim())) {
        throw new Error("Hàng CŨ bắt buộc phải có mô tả hao mòn thực tế theo chuẩn SRS!");
      }
      if (!prod.skus || prod.skus.length === 0) {
        throw new Error("Sản phẩm phải có ít nhất 1 dòng biến thể SKU!");
      }
      // Kiểm tra trùng bộ thuộc tính SKU
      const skuSet = new Set();
      for (const s of prod.skus) {
        const key = `${(s.size || '').trim().toLowerCase()}_${(s.color || '').trim().toLowerCase()}_${s.unit}_${s.quantity_per_lot}`;
        if (skuSet.has(key)) {
          throw new Error(`Trùng lặp biến thể SKU: Size "${s.size || '-'}", Màu "${s.color || '-'}", Đơn vị "${s.unit}"!`);
        }
        skuSet.add(key);
      }
      // Kiểm tra ảnh chính
      if (prod.images && prod.images.length > 0) {
        const primaryCount = prod.images.filter((img) => img.is_primary).length;
        if (primaryCount > 1) throw new Error("Mỗi sản phẩm chỉ được có duy nhất 1 ảnh chính!");
        if (primaryCount === 0 && prod.images.length > 0) {
          prod.images[0].is_primary = true;
        }
      }

      if (prod.id) {
        const prodId = Number(prod.id);
        const idx = this.data.products.findIndex((p) => p.id === prodId);
        if (idx !== -1) {
          this.data.products[idx] = { ...this.data.products[idx], ...prod, id: prodId };
        }
      } else {
        const newId = this.data.products.length ? Math.max(...this.data.products.map((p) => p.id)) + 1 : 1;
        this.data.products.unshift({ ...prod, id: newId, status: prod.status || "ACTIVE" });
      }
      this.save();
      return prod;
    }

    deleteProduct(id) {
      const prodId = Number(id);
      this.data.products = this.data.products.filter((p) => p.id !== prodId);
      this.save();
    }

    toggleProductStatus(id) {
      const p = this.getProductById(id);
      if (p) {
        p.status = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        this.save();
        return p.status;
      }
      return null;
    }
  }

  window.tsportStore = new TsportStore();
})();
