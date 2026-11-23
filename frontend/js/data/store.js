/**
 * TSPORT — QUẢN LÝ DỮ LIỆU TẬP TRUNG (STORE & LOCAL STORAGE)
 * Đồng bộ chuẩn SRS & Backend FastAPI:
 * - Môn thể thao (Sports)
 * - Danh mục (Categories) có cấu trúc Cây cha - con
 * - Thương hiệu (Brands)
 * - Sản phẩm (Products) có bảng SKU, Upload ảnh, Thông số & Hàng cũ hao mòn
 * - Thu mua đồ cũ (Buybacks)
 */

(function () {
  const STORAGE_KEY = "tsport_store_data_v4";

  const initialBuybacks = [
    {
      id: 1,
      product_name: "Yonex Astrox 88D Pro 4U",
      brand: "Yonex",
      model: "Astrox 88D Pro",
      condition_grade: "90%",
      wear_description: "Vợt còn 90%, xước nhẹ 1 điểm viền, khung cacbon không nứt.",
      desired_price: 2200000,
      proposed_price: 2200000,
      offered_price: null,
      image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600",
      customer_name: "Nguyễn Văn An",
      phone: "0912345601",
      contact_info: "0912345601",
      status: "CHO_DUYET",
      note: "",
      sku_created: false,
      created_sku_code: "",
      created_at: "2026-11-20 10:00:00"
    },
    {
      id: 2,
      product_name: "Lining Axforce 90 Max 3U",
      brand: "Lining",
      model: "Axforce 90 Max",
      condition_grade: "88%",
      wear_description: "Xước dăm nhẹ đầu vợt, cán zin còn đẹp.",
      desired_price: 2000000,
      proposed_price: 2000000,
      offered_price: 1850000,
      image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600",
      customer_name: "Trần Minh Quân",
      phone: "0987654321",
      contact_info: "0987654321",
      status: "DANG_DINH_GIA",
      note: "Đang kiểm tra độ lún khung",
      sku_created: false,
      created_sku_code: "",
      created_at: "2026-11-20 11:15:00"
    }
  ];

  const initialData = {
    sports: [
      { id: 1, name: "Cầu lông", slug: "cau-long", description: "Môn thể thao dùng vợt đánh cầu lông phong trào và chuyên nghiệp", status: "ACTIVE" },
      { id: 2, name: "Bóng đá", slug: "bong-da", description: "Môn thể thao vua với giày đinh sân cỏ nhân tạo và bóng thi đấu", status: "ACTIVE" },
      { id: 3, name: "Tennis", slug: "tennis", description: "Quần vợt chuyên nghiệp với vợt trợ lực và bóng thi đấu nỉ cao cấp", status: "ACTIVE" },
      { id: 4, name: "Pickleball", slug: "pickleball", description: "Môn thể thao xu hướng kết hợp bóng bàn, tennis và cầu lông", status: "ACTIVE" },
      { id: 5, name: "Bóng rổ", slug: "bong-ro", description: "Môn thể thao bóng rổ trong nhà sàn gỗ và ngoài trời bê tông", status: "ACTIVE" },
      { id: 6, name: "Bóng bàn", slug: "bong-ban", description: "Môn bóng bàn phong trào và thi đấu chuyên nghiệp với cốt vợt, mặt vợt và bóng 3 sao chuẩn ITTF", status: "ACTIVE" }
    ],
    categories: [
      { id: 1, parent_id: null, sport_id: 1, name: "Vợt thể thao", slug: "vot-the-thao", status: "ACTIVE" },
      { id: 2, parent_id: 1, sport_id: 1, name: "Vợt cầu lông", slug: "vot-cau-long", status: "ACTIVE" },
      { id: 3, parent_id: 1, sport_id: 3, name: "Vợt Tennis", slug: "vot-tennis", status: "ACTIVE" },
      { id: 4, parent_id: 1, sport_id: 4, name: "Vợt Pickleball", slug: "vot-pickleball", status: "ACTIVE" },
      { id: 17, parent_id: 1, sport_id: 6, name: "Vợt & Cốt vợt bóng bàn", slug: "vot-cot-vot-bong-ban", status: "ACTIVE" },
      { id: 18, parent_id: 1, sport_id: 6, name: "Mặt vợt bóng bàn", slug: "mat-vot-bong-ban", status: "ACTIVE" },
      { id: 5, parent_id: null, sport_id: 2, name: "Giày thể thao", slug: "giay-the-thao", status: "ACTIVE" },
      { id: 6, parent_id: 5, sport_id: 1, name: "Giày cầu lông", slug: "giay-cau-long", status: "ACTIVE" },
      { id: 7, parent_id: 5, sport_id: 2, name: "Giày bóng đá", slug: "giay-bong-da", status: "ACTIVE" },
      { id: 8, parent_id: 5, sport_id: 3, name: "Giày Tennis & Pickleball", slug: "giay-tennis-pickleball", status: "ACTIVE" },
      { id: 19, parent_id: 5, sport_id: 6, name: "Giày bóng bàn & Đa năng", slug: "giay-bong-ban", status: "ACTIVE" },
      { id: 9, parent_id: null, sport_id: 1, name: "Bóng & Quả thi đấu", slug: "bong-va-qua-thi-dau", status: "ACTIVE" },
      { id: 10, parent_id: 9, sport_id: 1, name: "Quả cầu lông", slug: "qua-cau-long", status: "ACTIVE" },
      { id: 11, parent_id: 9, sport_id: 2, name: "Quả bóng đá", slug: "qua-bong-da", status: "ACTIVE" },
      { id: 12, parent_id: 9, sport_id: 3, name: "Bóng Tennis", slug: "bong-tennis", status: "ACTIVE" },
      { id: 13, parent_id: 9, sport_id: 4, name: "Bóng Pickleball", slug: "bong-pickleball", status: "ACTIVE" },
      { id: 20, parent_id: 9, sport_id: 6, name: "Hộp bóng bàn 3 sao ITTF", slug: "hop-bong-ban-3-sao", status: "ACTIVE" },
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
      { id: 11, name: "Kamito", slug: "kamito", logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120", status: "ACTIVE" },
      { id: 12, name: "Butterfly", slug: "butterfly", logo_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120", status: "ACTIVE" },
      { id: 13, name: "DHS", slug: "dhs", logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120", status: "ACTIVE" }
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
          { id: 1, sku_code: "AX88DP-4U-BK", size: "4U", color: "Đen Đỏ", price: 4250000, sale_price: 3890000, stock: 15, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 2, sku_code: "AX88DP-3U-BK", size: "3U", color: "Đen Đỏ", price: 4250000, sale_price: 3890000, stock: 10, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
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
          { id: 12, sku_code: "JOOLA-PERSEUS-16MM", size: "16mm", color: "Đen Bạc Nhám", price: 6200000, sale_price: 5490000, stock: 20, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
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
          { id: 18, sku_code: "USED-CZ3-WH-41", size: "41", color: "Trắng Đen", price: 1650000, stock: 1, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 13,
        sport_id: 6,
        category_id: 17,
        brand_id: 12,
        name: "Cốt vợt bóng bàn Butterfly Viscaria ALC",
        description: "Huyền thoại cốt vợt tấn công số 1 thế giới với sợi Arylate Carbon cân bằng hoàn hảo giữa tốc độ và cảm giác bóng.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { structure: "5 lớp gỗ + 2 lớp ALC", speed: "Mid-Fast", reaction: "11.8", vibration: "10.3", origin: "Nhật Bản (Made in Japan)" },
        images: [
          { id: 19, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 19, sku_code: "VISCARIA-ALC-FL", size: "FL (Chuôi Loe)", color: "Cán Gỗ Xanh", price: 3850000, sale_price: 3450000, stock: 15, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 20, sku_code: "VISCARIA-ALC-ST", size: "ST (Chuôi Thẳng)", color: "Cán Gỗ Xanh", price: 3850000, stock: 8, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 14,
        sport_id: 6,
        category_id: 18,
        brand_id: 13,
        name: "Mặt vợt bóng bàn DHS Hurricane 3 Neo Bản Tỉnh (Lót Cam)",
        description: "Mặt mút Tàu bám dính cực đỉnh tạo độ xoáy giật bóng ma thuật, lựa chọn số 1 của các tay vợt ĐTQG Trung Quốc.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { sponge_thickness: "2.15mm", hardness: "39 - 40 độ", surface: "Tacky (Dính xoáy)", origin: "Trung Quốc (Chính hãng DHS)" },
        images: [
          { id: 20, image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 21, sku_code: "HUR3-NEO-BK-39", size: "2.15mm / 39 độ", color: "Đen Lót Cam", price: 680000, stock: 40, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 22, sku_code: "HUR3-NEO-RD-40", size: "2.15mm / 40 độ", color: "Đỏ Lót Cam", price: 680000, stock: 35, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 15,
        sport_id: 6,
        category_id: 20,
        brand_id: 13,
        name: "Hộp 6 quả bóng bàn DHS D40+ 3 sao ITTF (Lô 6 quả)",
        description: "Bóng thi đấu chính thức tại giải Vô địch Thế giới và Olympic, độ tròn hoàn hảo, quỹ đạo chuẩn xác.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { material: "Nhựa ABS Cell-Free", standard: "Đạt chuẩn ITTF Approved", pack: "6 quả / hộp" },
        images: [
          { id: 21, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 23, sku_code: "DHS-D40-3STAR-6PK", size: "Hộp 6 quả", color: "Trắng Thi Đấu", price: 150000, stock: 120, unit: "LO", quantity_per_lot: 6, status: "ACTIVE" }
        ]
      },
      {
        id: 16,
        sport_id: 6,
        category_id: 19,
        brand_id: 10,
        name: "Giày bóng bàn chuyên dụng Mizuno Wave Drive 9",
        description: "Trọng lượng siêu nhẹ, đế cao su non bám sàn cực tốt cho bước di chuyển đảo chân linh hoạt cự ly gần.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { sole: "Đế cao su XG Rubber bám sàn", cushion: "Mizuno Wave chống sốc", weight: "245g" },
        images: [
          { id: 22, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 24, sku_code: "MZN-WD9-WH-40", size: "40", color: "Trắng Viền Xanh", price: 2350000, stock: 15, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 25, sku_code: "MZN-WD9-WH-41", size: "41", color: "Trắng Viền Xanh", price: 2350000, stock: 20, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 26, sku_code: "MZN-WD9-WH-42", size: "42", color: "Trắng Viền Xanh", price: 2350000, stock: 18, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 17,
        sport_id: 1,
        category_id: 15,
        brand_id: 1,
        name: "Áo thi đấu thể thao Yonex Tournament Dry-Fit 2026",
        description: "Chất liệu mè co giãn 4 chiều kháng khuẩn, thoát mồ hôi siêu tốc Very Cool làm mát cơ thể 3 độ C.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { tech: "Very Cool + Antistatic", material: "100% Polyester", gender: "Unisex" },
        images: [
          { id: 23, image_url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 27, sku_code: "YNX-SHIRT-M-BL", size: "M", color: "Xanh Navy", price: 420000, sale_price: 360000, stock: 30, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 28, sku_code: "YNX-SHIRT-L-BL", size: "L", color: "Xanh Navy", price: 420000, sale_price: 360000, stock: 45, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 29, sku_code: "YNX-SHIRT-XL-BL", size: "XL", color: "Xanh Navy", price: 420000, sale_price: 360000, stock: 25, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" },
          { id: 30, sku_code: "YNX-SHIRT-L-RD", size: "L", color: "Đỏ Ruby", price: 420000, sale_price: 360000, stock: 35, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 18,
        sport_id: 1,
        category_id: 16,
        brand_id: 1,
        name: "Balo cầu lông & thể thao Yonex Pro Tour 6 ngăn",
        description: "Balo cao cấp có ngăn giữ nhiệt chống ẩm bảo vệ vợt, ngăn riêng đựng giày thông thoáng khử mùi.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { capacity: "Đựng được 4-6 cây vợt + 1 đôi giày", thermal_guard: "Có ngăn tráng bạc giữ nhiệt" },
        images: [
          { id: 24, image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 31, sku_code: "YNX-BAG-PRO-BK", size: "Tiêu chuẩn 6 ngăn", color: "Đen Cam Phối Xám", price: 1450000, stock: 25, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 19,
        sport_id: 4,
        category_id: 4,
        brand_id: 8,
        name: "Vợt Pickleball Selkirk Vanguard Power Air Invikta",
        description: "Đỉnh cao khí động học với thiết kế hốc gió Air Dynamic Throat giúp vung vợt chớp nhoáng và tạo xoáy ProSpin.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { face: "QuadFlex 4 Lớp Hybrid", core: "SuperCore Polymer", shape: "Invikta Dài Trợ Lực", weight: "7.9 oz" },
        images: [
          { id: 25, image_url: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 32, sku_code: "SLK-AIR-INVIKTA", size: "Form Dài 16.5 inch", color: "Đỏ Đen Carbon", price: 5600000, stock: 16, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 20,
        sport_id: 4,
        category_id: 16,
        brand_id: 8,
        name: "Túi đựng vợt Pickleball chuyên dụng Selkirk Tour Bag",
        description: "Túi xách cao cấp chống nước chuẩn IPX4 với khoang chứa vợt đệm xốp êm ái.",
        condition_type: "MOI",
        wear_description: null,
        status: "ACTIVE",
        specifications: { material: "Polyurethane tráng chống nước", capacity: "Chứa 3-4 vợt Pickleball + bóng" },
        images: [
          { id: 26, image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 33, sku_code: "SLK-TOUR-BAG-BL", size: "Tiêu chuẩn", color: "Xanh Biển Selkirk", price: 1850000, stock: 15, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 21,
        sport_id: 6,
        category_id: 17,
        brand_id: 12,
        name: "Cốt vợt bóng bàn Butterfly Timo Boll ALC (Đã qua sử dụng 85%)",
        description: "Cốt vợt danh tiếng của huyền thoại Timo Boll, dán sẵn 2 mặt mút bám xoáy Rozena và Tenergy.",
        condition_type: "CU",
        wear_description: "Cốt vợt có 1 vết cấn nhỏ 1mm viền góc 11h đã được xử lý keo bóng mịn phẳng, 2 mặt mút dán còn độ dính bám xoáy 80%, chuôi cầm sạch không nứt.",
        status: "ACTIVE",
        specifications: { handle: "FL", rubbers: "Mặt đỏ Tenergy 05 + Mặt đen Rozena", condition_grade: "85%" },
        images: [
          { id: 27, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 34, sku_code: "USED-TIMO-BOLL-85", size: "FL Dán sẵn mút", color: "Gỗ Koto Xanh", price: 2650000, stock: 1, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 22,
        sport_id: 4,
        category_id: 4,
        brand_id: 8,
        name: "Vợt Pickleball Selkirk Vanguard 2.0 Mach6 (Đã qua sử dụng 88%)",
        description: "Form vợt dài trợ lực với lõi tổ ong giảm chấn êm ái, thích hợp cả đánh đơn và đôi.",
        condition_type: "CU",
        wear_description: "Mặt vợt hơi xước dăm nhẹ do cứu bóng thấp sát sàn, lõi carbon đanh nảy chuẩn, viền bảo vệ cao su nguyên vẹn, đã cuốn cán mới 100%.",
        status: "ACTIVE",
        specifications: { shape: "Mach6 Elongated", face: "QuadCarbon Face", condition_grade: "88%" },
        images: [
          { id: 28, image_url: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 35, sku_code: "USED-SLK-MACH6-88", size: "16.5 inch", color: "Đỏ Đen", price: 2850000, stock: 1, unit: "CHIEC", quantity_per_lot: 1, status: "ACTIVE" }
        ]
      },
      {
        id: 23,
        sport_id: 1,
        category_id: 10,
        brand_id: 3,
        name: "Lô 12 quả cầu lông tập luyện Victor Larus Cũ (Lô 12 quả)",
        description: "Quả cầu lông lông vịt đã qua 1-2 séc đấu còn nguyên lông 85%, đầu bần chắc chắn nảy chuẩn.",
        condition_type: "CU",
        wear_description: "Lông cầu nguyên vẹn 85%, không gãy sống lông chính, đầu bần không móp méo, đã phân loại tuyển chọn đồng đều cho bài tập phản tạt và smash.",
        status: "ACTIVE",
        specifications: { speed: "Speed 77", feather_grade: "85%", pack: "12 quả / ống" },
        images: [
          { id: 29, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 36, sku_code: "USED-VIC-LARUS-12PK", size: "Ống 12 quả", color: "Trắng", price: 140000, stock: 20, unit: "LO", quantity_per_lot: 12, status: "ACTIVE" }
        ]
      },
      {
        id: 24,
        sport_id: 4,
        category_id: 13,
        brand_id: 9,
        name: "Lô 6 quả bóng Pickleball Franklin X-40 Ngoài trời Cũ (Lô 6 quả)",
        description: "Bóng Pickleball ngoài trời 40 lỗ tiêu chuẩn USAPA đã qua 2 set giao lưu, bóng tròn đều chuẩn độ nảy.",
        condition_type: "CU",
        wear_description: "Bề mặt bóng còn độ ma sát tốt 90%, không nứt vỡ hay biến dạng elip, màu vàng optic còn tươi sáng dễ quan sát dưới ánh nắng.",
        status: "ACTIVE",
        specifications: { holes: "40 lỗ khoan máy CNC", type: "Outdoor", condition_grade: "90%", pack: "6 quả / túi" },
        images: [
          { id: 30, image_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600", is_primary: true, sort_order: 1 }
        ],
        skus: [
          { id: 37, sku_code: "USED-FRK-X40-6PK", size: "Túi 6 quả", color: "Vàng Optic Neon", price: 190000, stock: 18, unit: "LO", quantity_per_lot: 6, status: "ACTIVE" }
        ]
      }
    ],
    cart: [],
    orders: [],
    buybacks: initialBuybacks
  };

  function getStoreData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.buybacks)) {
        parsed.buybacks = [...initialBuybacks];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    const seeded = Object.assign({}, initialData, { buybacks: [...initialBuybacks] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function saveStoreData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const storeApi = {
    getAll: () => getStoreData(),
    reset: () => {
      const seeded = Object.assign({}, initialData, { buybacks: [...initialBuybacks] });
      saveStoreData(seeded);
      return seeded;
    },
    getBuybacks(statusFilter = "ALL") {
      const data = getStoreData();
      const list = data.buybacks || [];
      if (!statusFilter || statusFilter === "ALL") return list;
      return list.filter((item) => item.status === statusFilter);
    },
    getBuybackById(id) {
      const data = getStoreData();
      return (data.buybacks || []).find((item) => Number(item.id) === Number(id)) || null;
    },
    createBuyback(payload) {
      const data = getStoreData();
      data.buybacks = data.buybacks || [];
      const maxId = data.buybacks.reduce((max, b) => Math.max(max, Number(b.id) || 0), 0);

      const brand = (payload.brand || "").trim();
      const model = (payload.model || "").trim();
      const productName = (payload.product_name || [brand, model].filter(Boolean).join(" ")).trim();
      const desiredPrice = Number(payload.desired_price ?? payload.proposed_price ?? 0);

      const newItem = {
        id: maxId + 1,
        product_name: productName,
        brand,
        model,
        condition_grade: (payload.condition_grade || "85%").trim(),
        wear_description: (payload.wear_description || "").trim(),
        desired_price: desiredPrice,
        proposed_price: desiredPrice,
        offered_price: null,
        image_url:
          (payload.image_url || "").trim() ||
          "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600",
        customer_name: (payload.customer_name || "").trim(),
        phone: (payload.phone || "").trim(),
        contact_info: (payload.contact_info || payload.phone || "").trim(),
        status: "CHO_DUYET",
        note: "",
        sku_created: false,
        created_sku_code: "",
        created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      data.buybacks.unshift(newItem);
      saveStoreData(data);
      return newItem;
    },
    cancelBuyback(id) {
      const data = getStoreData();
      const item = (data.buybacks || []).find((b) => Number(b.id) === Number(id));
      if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");
      if (item.status !== "CHO_DUYET") {
        throw new Error("Chỉ có thể hủy yêu cầu khi đang ở trạng thái Chờ duyệt");
      }
      item.status = "DA_HUY";
      saveStoreData(data);
      return item;
    },
    setBuybackPricing(id, offeredPrice, note = "") {
      const data = getStoreData();
      const item = (data.buybacks || []).find((b) => Number(b.id) === Number(id));
      if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");

      const priceNum = Number(offeredPrice);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        throw new Error("Giá đề nghị phải lớn hơn 0");
      }

      item.offered_price = priceNum;
      item.proposed_price = priceNum;
      if (note) item.note = note;
      if (item.status === "CHO_DUYET" || item.status === "DANG_DINH_GIA") {
        item.status = "DANG_DINH_GIA";
      }
      saveStoreData(data);
      return item;
    },
    updateBuybackStatus(id, nextStatus, noteOrReason = "", offeredPrice = null) {
      const data = getStoreData();
      const item = (data.buybacks || []).find((b) => Number(b.id) === Number(id));
      if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");

      const allowedTransitions = {
        CHO_DUYET: ["DANG_DINH_GIA", "TU_CHOI"],
        DANG_DINH_GIA: ["DA_THU_MUA", "TU_CHOI"],
        DA_THU_MUA: [],
        TU_CHOI: [],
        DA_HUY: []
      };

      const allowed = allowedTransitions[item.status] || [];
      if (!allowed.includes(nextStatus)) {
        throw new Error(`Không thể chuyển trạng thái từ ${item.status} sang ${nextStatus}`);
      }

      if (offeredPrice !== null && offeredPrice !== undefined && offeredPrice !== "") {
        const priceNum = Number(offeredPrice);
        if (Number.isFinite(priceNum) && priceNum > 0) {
          item.offered_price = priceNum;
          item.proposed_price = priceNum;
        }
      }

      item.status = nextStatus;
      item.note = noteOrReason || item.note || "";
      saveStoreData(data);
      return item;
    },
    createSkuFromBuyback(buybackId, skuPayload = {}) {
      const data = getStoreData();
      const item = (data.buybacks || []).find((b) => Number(b.id) === Number(buybackId));
      if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");
      if (item.status !== "DA_THU_MUA") {
        throw new Error("Chỉ tạo SKU khi yêu cầu đã ở trạng thái Đã thu mua");
      }

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const skuCode = `USED-BBX-${randomCode}`;
      data.products = data.products || [];
      const maxProductId = data.products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);

      const newProduct = {
        id: maxProductId + 1,
        sport_id: 1,
        category_id: 2,
        brand_id: 1,
        name: `${item.product_name} (Hàng cũ thu mua)`,
        description: skuPayload.wear_description || item.wear_description || "",
        condition_type: "CU",
        wear_description: skuPayload.wear_description || item.wear_description || "",
        status: "ACTIVE",
        specifications: {
          condition_grade: item.condition_grade || "85%",
          buyback_id: item.id
        },
        images: [
          {
            id: Date.now(),
            image_url: item.image_url,
            is_primary: true,
            sort_order: 1
          }
        ],
        skus: [
          {
            id: Date.now() + 1,
            sku_code: skuCode,
            size: skuPayload.size || "Tiêu chuẩn",
            color: skuPayload.color || "Nguyên bản",
            price: Number(skuPayload.price) || Number(item.offered_price) || 1500000,
            stock: Number(skuPayload.stock) || 1,
            unit: skuPayload.unit || "CHIEC",
            quantity_per_lot: Number(skuPayload.quantity_per_lot) || 1,
            status: "ACTIVE"
          }
        ]
      };

      data.products.push(newProduct);
      item.sku_created = true;
      item.created_sku_code = skuCode;
      saveStoreData(data);

      return { skuCode, product: newProduct, buyback: item };
    }
  };

  window.tsportStore = Object.assign(window.tsportStore || {}, storeApi);
})();