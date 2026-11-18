/**
 * TSPORT — QUẢN LÝ DỮ LIỆU TẬP TRUNG (STORE & LOCAL STORAGE)
 * Đồng bộ chuẩn SRS & Backend FastAPI:
 * - 5 Môn thể thao (Sports)
 * - 16 Danh mục (Categories) có cấu trúc Cây cha - con
 * - 11 Thương hiệu (Brands)
 * - 38 Sản phẩm (Products) có bảng SKU, Upload ảnh, Thông số & Hàng cũ hao mòn
 */

(function () {
  const STORAGE_KEY = "tsport_store_data_v4";

  // Dữ liệu hạt giống (Seed Data) chuẩn SRS
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
    orders: [
      {
        id: 1001,
        order_code: "ORD-202611-1001",
        customer_name: "Nguyễn Văn An",
        phone: "0912345601",
        address: "Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội",
        payment_method: "COD",
        status: "PENDING",
        restocked: false,
        created_at: "2026-11-17 14:30:00",
        total_amount: 4250000,
        note: "Giao giờ hành chính, gọi trước khi giao",
        items: [
          {
            product_id: 1,
            sku_id: 1,
            product_name: "Vợt cầu lông Yonex Astrox 88D Pro 2024",
            sku_code: "AX88DP-4U-BK",
            size: "4U",
            color: "Đen Đỏ",
            unit: "CHIEC",
            condition_type: "MOI",
            price: 4250000,
            price_at_order: 4250000,
            image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300",
            quantity: 1
          }
        ]
      },
      {
        id: 1002,
        order_code: "ORD-202611-1002",
        customer_name: "Nguyễn Văn An",
        phone: "0912345601",
        address: "Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội",
        payment_method: "COD",
        status: "CONFIRMED",
        restocked: false,
        created_at: "2026-11-16 10:15:00",
        total_amount: 2750000,
        note: "Đóng gói cẩn thận",
        items: [
          {
            product_id: 3,
            sku_id: 4,
            product_name: "Giày cầu lông Yonex Comfort Z3 Men",
            sku_code: "SHB-CZ3-41-WH",
            size: "41",
            color: "Trắng Đen",
            unit: "CHIEC",
            condition_type: "MOI",
            price: 2750000,
            price_at_order: 2750000,
            image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
            quantity: 1
          }
        ]
      },
      {
        id: 1003,
        order_code: "ORD-202611-1003",
        customer_name: "Nguyễn Văn An",
        phone: "0912345601",
        address: "Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội",
        payment_method: "COD",
        status: "COMPLETED",
        restocked: false,
        created_at: "2026-11-15 08:30:00",
        confirmed_at: "2026-11-15 09:15:00",
        shipping_at: "2026-11-15 14:00:00",
        completed_at: "2026-11-16 11:30:00",
        total_amount: 8500000,
        note: "Đã giao thành công cho khách, khách đã thanh toán COD",
        items: [
          {
            product_id: 1,
            sku_id: 1,
            product_name: "Vợt cầu lông Yonex Astrox 88D Pro 2024",
            sku_code: "AX88DP-4U-BK",
            size: "4U",
            color: "Đen Đỏ",
            unit: "CHIEC",
            condition_type: "MOI",
            price: 4250000,
            price_at_order: 4250000,
            image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300",
            quantity: 2
          }
        ]
      },
      {
        id: 1004,
        order_code: "ORD-202611-1004",
        customer_name: "Trần Minh Đức",
        phone: "0988776655",
        address: "Số 88 Cầu Giấy, Hà Nội",
        payment_method: "COD",
        status: "SHIPPING",
        restocked: false,
        created_at: "2026-11-16 16:00:00",
        confirmed_at: "2026-11-16 17:00:00",
        shipping_at: "2026-11-17 08:30:00",
        total_amount: 3200000,
        note: "Giao trong ngày",
        items: [
          {
            product_id: 2,
            sku_id: 3,
            product_name: "Vợt cầu lông Yonex Nanoflare 1000Z",
            sku_code: "NF1000Z-4U-YL",
            size: "4U",
            color: "Vàng Đen",
            unit: "CHIEC",
            condition_type: "MOI",
            price: 3200000,
            price_at_order: 3200000,
            image_url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=300",
            quantity: 1
          }
        ]
      },
      {
        id: 1005,
        order_code: "ORD-202611-1005",
        customer_name: "Phạm Quốc Huy",
        phone: "0987654321",
        address: "Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
        payment_method: "COD",
        status: "CANCELLED",
        restocked: true,
        created_at: "2026-11-14 11:20:00",
        cancelled_at: "2026-11-14 13:00:00",
        cancel_reason: "Khách hàng đổi ý muốn đổi sang mẫu khác",
        total_amount: 1650000,
        items: [
          {
            product_id: 12,
            sku_id: 18,
            product_name: "Giày cầu lông Yonex Comfort Z3 Cũ (90%)",
            sku_code: "USED-CZ3-WH-41",
            size: "41",
            color: "Trắng Đen",
            unit: "CHIEC",
            condition_type: "CU",
            price: 1650000,
            price_at_order: 1650000,
            image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
            quantity: 1
          }
        ]
      }
    ],
    reviews: [
      {
        id: 1,
        product_id: 1,
        user_name: "Nguyễn Văn An",
        rating: 5,
        comment: "Vợt rất đầm đầu, đập smash cực kỳ uy lực, hàng chính hãng Yonex nguyên tem mã vạch!",
        created_at: "2026-11-16 14:20:00"
      },
      {
        id: 2,
        product_id: 1,
        user_name: "Trần Minh Đức",
        rating: 4,
        comment: "Cây vợt tuyệt vời cho người chơi cầu sau, trợ lực tốt, giao hàng trong 24h.",
        created_at: "2026-11-16 18:45:00"
      },
      {
        id: 3,
        product_id: 3,
        user_name: "Nguyễn Văn An",
        rating: 5,
        comment: "Giày đi rất êm, bám sân cực tốt không bị trượt, đệm Power Cushion trợ lực bật nhảy.",
        created_at: "2026-11-16 16:10:00"
      }
    ],
    buybacks: [
      {
        id: 1,
        customer_name: "Lê Hoàng Yến",
        phone: "0903112233",
        product_name: "Vợt Tennis Wilson Clash 100 V2 Cũ",
        sport_id: 3,
        category_id: 3,
        brand_id: 6,
        condition_grade: "85%",
        wear_description: "Xước nhẹ viền trên vành vợt do vớt bóng sát sân, khung graphite nguyên bản chưa nứt, cán bọc quấn mới.",
        proposed_price: 2100000,
        image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=500",
        status: "DA_THU_MUA",
        created_at: "2026-11-16 09:30:00",
        admin_note: "Đã kiểm định khung vợt đạt chuẩn, thanh toán tiền mặt qua số tài khoản khách.",
        sku_created: false
      },
      {
        id: 2,
        customer_name: "Phạm Quốc Huy",
        phone: "0987654321",
        product_name: "Giày đá bóng Nike Mercurial Vapor 15 Pro TF Cũ",
        sport_id: 2,
        category_id: 7,
        brand_id: 4,
        condition_grade: "90%",
        wear_description: "Đã đá 5 trận sân cỏ nhân tạo, đinh dăm cao su còn sắc nét 95%, keo mép mũi giày còn nguyên.",
        proposed_price: 1400000,
        image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        status: "CHO_DUYET",
        created_at: "2026-11-17 11:15:00",
        admin_note: "Chờ khách mang qua cửa hàng giám định độ mòn đinh.",
        sku_created: false
      }
    ],
    matches: [
      {
        id: 1,
        sport_id: 1,
        sport_name: "Cầu lông",
        title: "Tìm 2 bạn đánh đôi nam/nữ tối thứ 4 sân Kỳ Hòa",
        match_date: "2026-11-19",
        match_time: "18:00 - 20:00",
        location: "Sân Kỳ Hòa, Quận 10, TP.HCM",
        level: "Trung bình - Khá",
        slots_needed: 2,
        price_share: "45.000đ / người",
        contact_name: "Nguyễn Văn An",
        contact_phone: "0912345601",
        author_id: 1,
        status: "OPEN",
        description: "Nhóm đánh vui vẻ, giao lưu thể thao lành mạnh, cầu lông Hải Yến đỏ."
      },
      {
        id: 2,
        sport_id: 2,
        sport_name: "Bóng đá",
        title: "Kèo sân 7 cỏ nhân tạo tối thứ 6 thiếu 3 chân",
        match_date: "2026-11-21",
        match_time: "19:30 - 21:00",
        location: "Sân Chuyên Việt, Cầu Giấy, Hà Nội",
        level: "Giao lưu vui vẻ",
        slots_needed: 3,
        price_share: "50.000đ / người",
        contact_name: "Trần Minh Đức",
        contact_phone: "0988776655",
        author_id: 2,
        status: "OPEN",
        description: "Đá dưỡng sinh cọ xát, không cay cú ăn thua, có sẵn nước giải khát."
      },
      {
        id: 3,
        sport_id: 4,
        sport_name: "Pickleball",
        title: "Cần tìm người chơi Pickleball sáng Chủ Nhật",
        match_date: "2026-11-23",
        match_time: "07:00 - 09:00",
        location: "CLB Pickleball D-Sports, Tây Hồ, Hà Nội",
        level: "Mới tập chơi / Phong trào",
        slots_needed: 2,
        price_share: "60.000đ / người",
        contact_name: "Lê Hoàng Yến",
        contact_phone: "0903112233",
        author_id: 3,
        status: "OPEN",
        description: "Có sẵn bóng Franklin X-40, chỉ cần mang vợt."
      }
    ],
    courts: [
      { id: 1, sport_id: 1, sport_name: "Cầu lông", name: "Sân Cầu Lông Kỳ Hòa - Sân 1", address: "Sư Vạn Hạnh, Quận 10, TP.HCM", surface: "Thảm PVC chuẩn thi đấu" },
      { id: 2, sport_id: 1, sport_name: "Cầu lông", name: "Sân Cầu Lông Kỳ Hòa - Sân 2", address: "Sư Vạn Hạnh, Quận 10, TP.HCM", surface: "Thảm PVC chuẩn thi đấu" },
      { id: 3, sport_id: 2, sport_name: "Bóng đá", name: "Sân Mini 7 người Chuyên Việt", address: "Dịch Vọng Hậu, Cầu Giấy, Hà Nội", surface: "Cỏ nhân tạo sợi đệm cao su" },
      { id: 4, sport_id: 3, sport_name: "Tennis", name: "Sân Quần Vợt Hồ Xuân Hương", address: "Hồ Xuân Hương, Quận 3, TP.HCM", surface: "Sân cứng Acrylic 9 lớp" },
      { id: 5, sport_id: 4, sport_name: "Pickleball", name: "Sân Pickleball D-Sports Pro", address: "Lạc Long Quân, Tây Hồ, Hà Nội", surface: "Sân ngoài trời chống trơn trượt" }
    ],
    court_slots: [
      { id: 1, court_id: 1, time_slot: "06:00 - 08:00 (Sáng sớm)", fixed_price: 120000 },
      { id: 2, court_id: 1, time_slot: "17:30 - 19:30 (Khung vàng)", fixed_price: 220000 },
      { id: 3, court_id: 1, time_slot: "19:30 - 21:30 (Tối)", fixed_price: 200000 },
      { id: 4, court_id: 2, time_slot: "17:30 - 19:30 (Khung vàng)", fixed_price: 220000 },
      { id: 5, court_id: 3, time_slot: "19:00 - 20:30 (Buổi tối)", fixed_price: 650000 },
      { id: 6, court_id: 4, time_slot: "18:00 - 20:00 (Buổi tối)", fixed_price: 350000 },
      { id: 7, court_id: 5, time_slot: "07:00 - 09:00 (Sáng)", fixed_price: 180000 }
    ],
    bookings: [
      {
        id: 1,
        booking_code: "BKG-202611-001",
        court_id: 1,
        slot_id: 2,
        court_name: "Sân Cầu Lông Kỳ Hòa - Sân 1",
        sport_name: "Cầu lông",
        time_slot: "17:30 - 19:30 (Khung vàng)",
        fixed_price: 220000,
        booking_date: "2026-11-20",
        customer_name: "Nguyễn Văn An",
        phone: "0912345601",
        status: "PENDING",
        created_at: "2026-11-17 11:00:00",
        note: "Thuê thêm 1 hộp cầu nếu có"
      }
    ],
    coupons: [
      {
        id: 1,
        code: "TSPORT10",
        description: "Giảm 10% cho đơn hàng từ 2.000.000₫ (Tối đa 500.000₫)",
        discount_type: "PERCENT",
        discount_value: 10,
        max_discount: 500000,
        min_order_value: 2000000,
        expires_at: "2026-12-31",
        usage_limit: 100,
        used_count: 12,
        status: "ACTIVE"
      },
      {
        id: 2,
        code: "GIAM100K",
        description: "Giảm trực tiếp 100.000₫ cho đơn hàng từ 1.000.000₫",
        discount_type: "FIXED",
        discount_value: 100000,
        max_discount: 100000,
        min_order_value: 1000000,
        expires_at: "2026-12-31",
        usage_limit: 50,
        used_count: 8,
        status: "ACTIVE"
      },
      {
        id: 3,
        code: "VANDONGVIEN",
        description: "Ưu đãi vận động viên: Giảm 15% cho đơn từ 3.000.000₫ (Tối đa 1.000.000₫)",
        discount_type: "PERCENT",
        discount_value: 15,
        max_discount: 1000000,
        min_order_value: 3000000,
        expires_at: "2026-12-31",
        usage_limit: 30,
        used_count: 5,
        status: "ACTIVE"
      },
      {
        id: 4,
        code: "TRIAN50K",
        description: "Tri ân khách hàng: Giảm 50.000₫ cho đơn từ 500.000₫",
        discount_type: "FIXED",
        discount_value: 50000,
        max_discount: 50000,
        min_order_value: 500000,
        expires_at: "2026-12-31",
        usage_limit: 200,
        used_count: 45,
        status: "ACTIVE"
      },
      {
        id: 5,
        code: "HETHAN2025",
        description: "Mã khuyến mãi năm 2025 (Đã hết hạn để kiểm tra validate)",
        discount_type: "PERCENT",
        discount_value: 20,
        max_discount: 300000,
        min_order_value: 1000000,
        expires_at: "2025-12-31",
        usage_limit: 50,
        used_count: 50,
        status: "ACTIVE"
      },
      {
        id: 6,
        code: "HETLUOT",
        description: "Mã giảm giá đã đạt giới hạn lượt sử dụng (Dùng kiểm thử validate)",
        discount_type: "FIXED",
        discount_value: 200000,
        max_discount: 200000,
        min_order_value: 1500000,
        expires_at: "2026-12-31",
        usage_limit: 10,
        used_count: 10,
        status: "ACTIVE"
      }
    ]
  };

  class TsportStore {
    constructor() {
      this.data = this.load();
    }

    load() {
      try {
        let saved = localStorage.getItem(STORAGE_KEY);
        // Tự động chuyển đổi và kế thừa từ v2 hoặc v1 nếu chưa có v3
        if (!saved) {
          const prevSaved = localStorage.getItem("tsport_store_data_v2") || localStorage.getItem("tsport_store_data");
          if (prevSaved) {
            const parsedPrev = JSON.parse(prevSaved);
            const mergedInit = {
              ...initialData,
              cart: parsedPrev.cart || [],
              orders: parsedPrev.orders || initialData.orders,
              matches: parsedPrev.matches || initialData.matches,
              courts: parsedPrev.courts || initialData.courts,
              court_slots: parsedPrev.court_slots || initialData.court_slots,
              bookings: parsedPrev.bookings || initialData.bookings,
              reviews: parsedPrev.reviews || initialData.reviews,
              buybacks: parsedPrev.buybacks || initialData.buybacks
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedInit));
            return mergedInit;
          }
        }
        if (saved) {
          const parsed = JSON.parse(saved);

          // Hợp nhất dữ liệu danh mục hạt giống (luôn bổ sung môn 6 và danh mục mới)
          const mergedSports = [...initialData.sports];
          (parsed.sports || []).forEach(s => {
            const idx = mergedSports.findIndex(x => x.id === s.id);
            if (idx !== -1) mergedSports[idx] = { ...mergedSports[idx], ...s };
            else mergedSports.push(s);
          });

          const mergedCategories = [...initialData.categories];
          (parsed.categories || []).forEach(c => {
            const idx = mergedCategories.findIndex(x => x.id === c.id);
            if (idx !== -1) mergedCategories[idx] = { ...mergedCategories[idx], ...c };
            else mergedCategories.push(c);
          });

          const mergedBrands = [...initialData.brands];
          (parsed.brands || []).forEach(b => {
            const idx = mergedBrands.findIndex(x => x.id === b.id);
            if (idx !== -1) mergedBrands[idx] = { ...mergedBrands[idx], ...b };
            else mergedBrands.push(b);
          });

          const mergedProducts = [...initialData.products];
          (parsed.products || []).forEach(p => {
            const idx = mergedProducts.findIndex(x => x.id === p.id);
            if (idx !== -1) mergedProducts[idx] = { ...mergedProducts[idx], ...p };
            else mergedProducts.push(p);
          });

          const safeOrders = (parsed.orders || initialData.orders).map(o => ({
            ...o,
            items: (o.items || []).map(i => ({
              ...i,
              condition_type: i.condition_type || (i.product_name && i.product_name.includes("Cũ") ? "CU" : "MOI"),
              price_at_order: i.price_at_order || i.price
            }))
          }));

          return {
            ...initialData,
            ...parsed,
            sports: mergedSports,
            categories: mergedCategories,
            brands: mergedBrands,
            products: mergedProducts,
            cart: parsed.cart || [],
            orders: safeOrders,
            matches: parsed.matches || initialData.matches,
            courts: parsed.courts || initialData.courts,
            court_slots: parsed.court_slots || initialData.court_slots,
            bookings: parsed.bookings || initialData.bookings,
            reviews: parsed.reviews || initialData.reviews,
            buybacks: parsed.buybacks || initialData.buybacks,
            coupons: parsed.coupons || initialData.coupons
          };
        }
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

    formatMoney(amount) {
      return (Number(amount) || 0).toLocaleString("vi-VN") + " ₫";
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
      // Nếu là truy vấn từ khách hàng (Storefront) hoặc có yêu cầu only_active
      if (filters.only_active || filters.is_customer) {
        list = list.filter((p) => p.status !== "INACTIVE");
      }
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

    toggleSkuStatus(productId, skuId) {
      const p = this.getProductById(productId);
      if (!p || !p.skus) return null;
      const sku = p.skus.find((s) => s.id === Number(skuId));
      if (!sku) return null;
      sku.status = sku.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
      this.save();
      return sku.status;
    }

    // ==========================================
    // GIỎ HÀNG (CART MODULE)
    // ==========================================
    getCart() {
      if (!this.data.cart) this.data.cart = [];
      return this.data.cart;
    }

    addToCart(productId, skuId, quantity = 1) {
      const prod = this.getProductById(productId);
      if (!prod) throw new Error("Không tìm thấy sản phẩm!");
      if (prod.status === "INACTIVE") {
        throw new Error(`Sản phẩm "${prod.name}" hiện đang tạm ẩn, không thể thêm vào giỏ hàng!`);
      }
      const sku = prod.skus.find((s) => s.id === Number(skuId));
      if (!sku) throw new Error("Không tìm thấy biến thể SKU này!");
      if (sku.status === "INACTIVE") {
        throw new Error(`Biến thể SKU "${sku.sku_code}" đang tạm ngưng kinh doanh, không thể thêm vào giỏ hàng!`);
      }

      if (sku.stock <= 0) {
        throw new Error(`Sản phẩm "${prod.name} (${sku.size || ''} - ${sku.color || ''})" hiện đã hết hàng trong kho!`);
      }

      if (!this.data.cart) this.data.cart = [];
      const existing = this.data.cart.find((item) => item.sku_id === Number(skuId));
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + Number(quantity);

      if (targetQty > sku.stock) {
        throw new Error(`Kho chỉ còn ${sku.stock} sản phẩm. Bạn đã có ${currentQty} trong giỏ và không thể thêm ${quantity} nữa!`);
      }

      const primaryImg = (prod.images && prod.images.find((i) => i.is_primary)) || (prod.images && prod.images[0]) || { image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300' };

      // Tính giá bán thực tế (ưu tiên sale_price nếu có)
      const effectivePrice = (sku.sale_price && Number(sku.sale_price) > 0 && Number(sku.sale_price) < Number(sku.price))
        ? Number(sku.sale_price)
        : Number(sku.price);

      if (existing) {
        existing.quantity = targetQty;
        existing.price = effectivePrice;
        existing.original_price = Number(sku.price);
        existing.sale_price = sku.sale_price ? Number(sku.sale_price) : null;
      } else {
        this.data.cart.push({
          product_id: prod.id,
          sku_id: sku.id,
          product_name: prod.name,
          sku_code: sku.sku_code,
          size: sku.size || "-",
          color: sku.color || "-",
          unit: sku.unit || "CHIEC",
          quantity_per_lot: sku.quantity_per_lot || 1,
          condition_type: prod.condition_type || "MOI",
          price: effectivePrice,
          original_price: Number(sku.price),
          sale_price: sku.sale_price ? Number(sku.sale_price) : null,
          stock: sku.stock,
          image_url: primaryImg.image_url,
          quantity: Number(quantity)
        });
      }
      this.save();
      return this.getCartTotals();
    }

    updateCartItem(skuId, quantity) {
      if (!this.data.cart) this.data.cart = [];
      const idx = this.data.cart.findIndex((i) => i.sku_id === Number(skuId));
      if (idx === -1) return;

      const numQty = Number(quantity);
      if (numQty <= 0) {
        this.data.cart.splice(idx, 1);
        this.save();
        return;
      }

      // Kiểm tra tồn kho mới nhất của SKU
      let foundSku = null;
      for (const p of this.data.products) {
        const s = p.skus.find((sku) => sku.id === Number(skuId));
        if (s) { foundSku = s; break; }
      }

      if (foundSku && numQty > foundSku.stock) {
        throw new Error(`Số lượng yêu cầu (${numQty}) vượt quá tồn kho thực tế (${foundSku.stock} sản phẩm)!`);
      }

      this.data.cart[idx].quantity = numQty;
      this.save();
    }

    removeFromCart(skuId) {
      if (!this.data.cart) this.data.cart = [];
      this.data.cart = this.data.cart.filter((i) => i.sku_id !== Number(skuId));
      this.save();
    }

    clearCart() {
      this.data.cart = [];
      this.save();
    }

    getCartTotals() {
      const items = this.getCart();
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const shipping = 0; // Miễn phí vận chuyển
      const grandTotal = subtotal + shipping;
      return {
        items,
        totalItems,
        subtotal,
        shipping,
        grandTotal
      };
    }

    // ==========================================
    // ĐƠN HÀNG & QUY TẮC HOÀN TỒN ĐÚNG 1 LẦN (ORDERS)
    // ==========================================
    getOrders(userId = null) {
      if (!this.data.orders) this.data.orders = [];
      return this.data.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    getOrderById(id) {
      if (!this.data.orders) this.data.orders = [];
      return this.data.orders.find((o) => o.id === Number(id) || o.order_code === String(id));
    }

    createOrder({ customer_name, phone, address, payment_method = "COD", note = "", coupon_code = "", items = null }) {
      if (!customer_name || !customer_name.trim()) throw new Error("Vui lòng nhập họ và tên người nhận!");
      if (!phone || !phone.trim() || phone.length < 9) throw new Error("Vui lòng nhập số điện thoại hợp lệ!");
      if (!address || !address.trim()) throw new Error("Vui lòng nhập địa chỉ nhận hàng chi tiết!");

      const orderItems = items || this.getCart();
      if (!orderItems || orderItems.length === 0) {
        throw new Error("Giỏ hàng của bạn đang trống, không thể thanh toán!");
      }

      // BƯỚC 1: KIỂM TRA TỒN KHO CHO TOÀN BỘ SẢN PHẨM TRONG ĐƠN (CHỐNG LỖI TỒN KHO)
      for (const item of orderItems) {
        let currentSku = null;
        let productObj = null;
        for (const p of this.data.products) {
          const s = p.skus.find((sku) => sku.id === Number(item.sku_id));
          if (s) { currentSku = s; productObj = p; break; }
        }
        if (!currentSku) {
          throw new Error(`Sản phẩm "${item.product_name}" không còn tồn tại!`);
        }
        if (currentSku.stock < item.quantity) {
          throw new Error(`LỖI TỒN KHO: Sản phẩm "${productObj.name} (${currentSku.size || ''} - ${currentSku.color || ''})" chỉ còn ${currentSku.stock} sản phẩm trong kho (Bạn yêu cầu ${item.quantity})! Vui lòng giảm số lượng.`);
        }
      }

      // BƯỚC 2: TÍNH TOÁN TIỀN HÀNG VÀ KIỂM TRA MÃ GIẢM GIÁ (SERVER RE-VALIDATE & RE-CALCULATE)
      const computedSubtotal = orderItems.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
      let discountAmount = 0;
      let appliedCouponCode = null;

      if (coupon_code && String(coupon_code).trim()) {
        const couponResult = this.validateAndCalculateCoupon(coupon_code, computedSubtotal);
        if (!couponResult.valid) {
          throw new Error(`Lỗi mã giảm giá: ${couponResult.message}`);
        }
        discountAmount = couponResult.discount_amount;
        appliedCouponCode = couponResult.coupon.code;

        // Tăng số lượt đã sử dụng của mã
        const foundCoupon = this.getCouponByCode(appliedCouponCode);
        if (foundCoupon) {
          foundCoupon.used_count = (foundCoupon.used_count || 0) + 1;
        }
      }

      const finalTotalAmount = Math.max(0, computedSubtotal - discountAmount);

      // BƯỚC 3: TRỪ TỒN KHO
      for (const item of orderItems) {
        for (const p of this.data.products) {
          const s = p.skus.find((sku) => sku.id === Number(item.sku_id));
          if (s) {
            s.stock -= Number(item.quantity);
            break;
          }
        }
      }

      // BƯỚC 4: TẠO ĐƠN HÀNG
      const now = new Date();
      const codeSuffix = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(Math.floor(1000 + Math.random() * 9000));
      const newOrder = {
        id: this.data.orders.length ? Math.max(...this.data.orders.map((o) => o.id)) + 1 : 1001,
        order_code: `ORD-${codeSuffix}`,
        customer_name: customer_name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        payment_method: payment_method || "COD",
        note: note.trim(),
        status: "PENDING", // Mặc định Chờ xác nhận
        restocked: false,  // Đánh dấu cờ hoàn tồn
        created_at: now.toISOString().replace("T", " ").substring(0, 19),
        subtotal: computedSubtotal,
        coupon_code: appliedCouponCode,
        discount_amount: discountAmount,
        total_amount: finalTotalAmount,
        // LƯU ĐÓNG BĂNG GIÁ VÀ TÌNH TRẠNG LÚC ĐẶT HÀNG (BẤT BIẾN THEO CHUẨN SRS)
        items: orderItems.map((i) => ({
          product_id: i.product_id,
          sku_id: i.sku_id,
          product_name: i.product_name,
          sku_code: i.sku_code,
          size: i.size || "-",
          color: i.color || "-",
          unit: i.unit || "CHIEC",
          quantity_per_lot: i.quantity_per_lot || 1,
          condition_type: i.condition_type || "MOI",
          price: Number(i.price),
          price_at_order: Number(i.price),
          original_price: i.original_price ? Number(i.original_price) : Number(i.price),
          image_url: i.image_url,
          quantity: Number(i.quantity)
        }))
      };

      this.data.orders.unshift(newOrder);
      this.clearCart();
      this.save();
      return newOrder;
    }

    /**
     * HỦY ĐƠN HÀNG: Chỉ được hủy khi đơn ở trạng thái "PENDING" (Chờ xác nhận).
     * QUY TẮC HOÀN TỒN ĐÚNG 1 LẦN: Khi hủy, hoàn lại stock cho từng SKU. Nếu hủy lặp lại, chặn tuyệt đối và không tăng tồn lần 2.
     */
    cancelOrder(orderId, reason = "Khách hàng yêu cầu hủy đơn") {
      const order = this.getOrderById(orderId);
      if (!order) throw new Error("Không tìm thấy đơn hàng!");

      // 1. Chỉ được hủy khi đang ở trạng thái Chờ xác nhận
      if (order.status !== "PENDING") {
        throw new Error(`Đơn hàng #${order.order_code} đang ở trạng thái "${order.status}". Bạn chỉ có thể hủy đơn khi đơn ở trạng thái 'Chờ xác nhận'!`);
      }

      // 2. Chặn hoàn tồn lặp lại (Idempotency)
      if (order.restocked) {
        throw new Error(`Đơn hàng #${order.order_code} đã được hoàn tồn kho trước đó! Hệ thống chặn hoàn tồn lần 2.`);
      }

      // 3. Hoàn lại số lượng tồn kho cho các SKU
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          for (const p of this.data.products) {
            const s = p.skus.find((sku) => sku.id === Number(item.sku_id));
            if (s) {
              s.stock += Number(item.quantity);
              break;
            }
          }
        });
      }

      // 4. Cập nhật trạng thái và bật cờ restocked
      order.status = "CANCELLED";
      order.restocked = true;
      order.cancel_reason = reason;
      order.cancelled_at = new Date().toISOString().replace("T", " ").substring(0, 19);

      this.save();
      return order;
    }

    // ==========================================
    // KẾT NỐI NGƯỜI CHƠI / BÀI ĐĂNG GIAO LƯU (MATCHES)
    // ==========================================
    getMatches(filters = {}) {
      if (!this.data.matches) this.data.matches = [];
      let list = [...this.data.matches];

      if (filters.sport_id && filters.sport_id !== "ALL") {
        list = list.filter((m) => m.sport_id === Number(filters.sport_id));
      }
      if (filters.date) {
        list = list.filter((m) => m.match_date === filters.date);
      }
      if (filters.location && filters.location.trim()) {
        const loc = filters.location.toLowerCase().trim();
        list = list.filter((m) => m.location.toLowerCase().includes(loc) || (m.title && m.title.toLowerCase().includes(loc)));
      }
      // Không hiển thị bài HIDDEN cho người dùng thông thường trừ khi yêu cầu
      if (!filters.showHidden) {
        list = list.filter((m) => m.status !== "HIDDEN");
      }
      return list.sort((a, b) => b.id - a.id);
    }

    getMatchById(id) {
      if (!this.data.matches) this.data.matches = [];
      return this.data.matches.find((m) => m.id === Number(id));
    }

    saveMatch(matchData) {
      if (!matchData.title || !matchData.title.trim()) throw new Error("Vui lòng nhập tiêu đề bài đăng!");
      if (!matchData.sport_id) throw new Error("Vui lòng chọn môn thể thao!");
      if (!matchData.match_date) throw new Error("Vui lòng chọn ngày thi đấu/giao lưu!");
      if (!matchData.location || !matchData.location.trim()) throw new Error("Vui lòng nhập địa điểm thi đấu!");
      if (!matchData.contact_phone || !matchData.contact_phone.trim()) throw new Error("Vui lòng nhập số điện thoại liên hệ!");

      const sport = this.getSportById(matchData.sport_id);

      if (matchData.id) {
        const idx = this.data.matches.findIndex((m) => m.id === Number(matchData.id));
        if (idx !== -1) {
          this.data.matches[idx] = {
            ...this.data.matches[idx],
            ...matchData,
            sport_name: sport ? sport.name : this.data.matches[idx].sport_name
          };
        }
      } else {
        const newId = this.data.matches.length ? Math.max(...this.data.matches.map((m) => m.id)) + 1 : 1;
        this.data.matches.unshift({
          ...matchData,
          id: newId,
          sport_name: sport ? sport.name : "Thể thao",
          status: "OPEN",
          created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
      }
      this.save();
    }

    closeMatch(id) {
      const match = this.getMatchById(id);
      if (match) {
        match.status = "CLOSED";
        this.save();
        return match;
      }
    }

    deleteMatch(id) {
      this.data.matches = (this.data.matches || []).filter((m) => m.id !== Number(id));
      this.save();
    }

    hideMatch(id) {
      const match = this.getMatchById(id);
      if (match) {
        match.status = match.status === "HIDDEN" ? "OPEN" : "HIDDEN";
        this.save();
        return match.status;
      }
    }

    // ==========================================
    // ĐẶT SÂN THỂ THAO & QUẢN LÝ CA SÂN (COURTS)
    // ==========================================
    getCourts(sport_id = null) {
      if (!this.data.courts) this.data.courts = [];
      if (sport_id && sport_id !== "ALL") {
        return this.data.courts.filter((c) => c.sport_id === Number(sport_id));
      }
      return this.data.courts;
    }

    getCourtById(id) {
      if (!this.data.courts) this.data.courts = [];
      return this.data.courts.find((c) => c.id === Number(id));
    }

    saveCourt(courtData) {
      if (!courtData.name || !courtData.name.trim()) throw new Error("Vui lòng nhập tên sân!");
      if (!courtData.sport_id) throw new Error("Vui lòng chọn môn thể thao!");
      const sport = this.getSportById(courtData.sport_id);

      if (courtData.id) {
        const idx = this.data.courts.findIndex((c) => c.id === Number(courtData.id));
        if (idx !== -1) {
          this.data.courts[idx] = {
            ...this.data.courts[idx],
            ...courtData,
            sport_name: sport ? sport.name : this.data.courts[idx].sport_name
          };
        }
      } else {
        const newId = this.data.courts.length ? Math.max(...this.data.courts.map((c) => c.id)) + 1 : 1;
        this.data.courts.push({
          ...courtData,
          id: newId,
          sport_name: sport ? sport.name : "Thể thao"
        });
      }
      this.save();
    }

    getSlots(court_id = null) {
      if (!this.data.court_slots) this.data.court_slots = [];
      if (court_id) {
        return this.data.court_slots.filter((s) => s.court_id === Number(court_id));
      }
      return this.data.court_slots;
    }

    saveSlot(slotData) {
      if (!slotData.court_id) throw new Error("Vui lòng chọn sân trực thuộc!");
      if (!slotData.time_slot || !slotData.time_slot.trim()) throw new Error("Vui lòng nhập khung giờ ca chơi!");
      if (!slotData.fixed_price || Number(slotData.fixed_price) <= 0) throw new Error("Vui lòng nhập bảng giá cố định!");

      if (slotData.id) {
        const idx = this.data.court_slots.findIndex((s) => s.id === Number(slotData.id));
        if (idx !== -1) {
          this.data.court_slots[idx] = { ...this.data.court_slots[idx], ...slotData };
        }
      } else {
        const newId = this.data.court_slots.length ? Math.max(...this.data.court_slots.map((s) => s.id)) + 1 : 1;
        this.data.court_slots.push({ ...slotData, id: newId, fixed_price: Number(slotData.fixed_price) });
      }
      this.save();
    }

    getBookings(userId = null) {
      if (!this.data.bookings) this.data.bookings = [];
      return this.data.bookings.sort((a, b) => b.id - a.id);
    }

    createBooking({ court_id, slot_id, booking_date, customer_name, phone, note = "" }) {
      if (!court_id) throw new Error("Vui lòng chọn sân thể thao!");
      if (!slot_id) throw new Error("Vui lòng chọn ca giờ chơi!");
      if (!booking_date) throw new Error("Vui lòng chọn ngày đặt sân!");
      if (!customer_name || !customer_name.trim()) throw new Error("Vui lòng nhập họ tên người đặt!");
      if (!phone || !phone.trim()) throw new Error("Vui lòng nhập số điện thoại người đặt!");

      const court = this.getCourtById(court_id);
      const slot = this.getSlots().find((s) => s.id === Number(slot_id));

      const now = new Date();
      const code = `BKG-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${String(Math.floor(100+Math.random()*900))}`;

      const newBooking = {
        id: this.data.bookings.length ? Math.max(...this.data.bookings.map((b) => b.id)) + 1 : 1,
        booking_code: code,
        court_id: Number(court_id),
        slot_id: Number(slot_id),
        court_name: court ? court.name : `Sân #${court_id}`,
        sport_name: court ? court.sport_name : "Thể thao",
        time_slot: slot ? slot.time_slot : "Ca chơi",
        fixed_price: slot ? slot.fixed_price : 0,
        booking_date,
        customer_name: customer_name.trim(),
        phone: phone.trim(),
        note: note.trim(),
        status: "PENDING", // Mặc định Chờ xác nhận
        created_at: now.toISOString().replace("T", " ").substring(0, 19)
      };

      this.data.bookings.unshift(newBooking);
      this.save();
      return newBooking;
    }

    cancelBooking(bookingId) {
      const b = (this.data.bookings || []).find((item) => item.id === Number(bookingId));
      if (!b) throw new Error("Không tìm thấy yêu cầu đặt sân!");
      if (b.status !== "PENDING") {
        throw new Error(`Chỉ có thể hủy yêu cầu khi đang ở trạng thái 'Chờ xác nhận'! Trạng thái hiện tại: ${b.status}`);
      }
      b.status = "CANCELLED";
      this.save();
      return b;
    }

    updateBookingStatus(bookingId, newStatus, reason = "") {
      const b = (this.data.bookings || []).find((item) => item.id === Number(bookingId));
      if (!b) throw new Error("Không tìm thấy yêu cầu đặt sân!");
      b.status = newStatus;
      if (reason) b.admin_note = reason;
      this.save();
      return b;
    }

    // ==========================================
    // KIỂM TRA CA BỊ CHIẾM & CONCURRENCY (2 ADMIN DUYỆT ĐỒNG THỜI)
    // ==========================================
    isSlotOccupied(courtId, slotId, bookingDate, excludeBookingId = null) {
      if (!this.data.bookings) return false;
      return this.data.bookings.some((b) =>
        b.court_id === Number(courtId) &&
        b.slot_id === Number(slotId) &&
        b.booking_date === bookingDate &&
        b.status === "CONFIRMED" &&
        (!excludeBookingId || b.id !== Number(excludeBookingId))
      );
    }

    adminConfirmBooking(bookingId, expectedVersion = null) {
      const b = (this.data.bookings || []).find((item) => item.id === Number(bookingId));
      if (!b) throw new Error("Không tìm thấy yêu cầu đặt sân!");

      // 1. Kiểm tra tranh chấp đồng thời (2 Admin cùng thao tác)
      if (b.status === "CONFIRMED") {
        throw new Error(`XUNG ĐỘT ĐỒNG THỜI: Yêu cầu đặt sân #${b.booking_code} đã được Admin khác xác nhận trước đó! Hệ thống hủy thao tác duyệt lặp.`);
      }

      if (expectedVersion !== null && b.version && b.version !== expectedVersion) {
        throw new Error(`Dữ liệu đã bị thay đổi bởi Admin khác! Vui lòng tải lại trang.`);
      }

      // 2. Kiểm tra ca giờ chơi này trên sân đã có ai chiếm chưa
      if (this.isSlotOccupied(b.court_id, b.slot_id, b.booking_date, b.id)) {
        throw new Error(`CA ĐÃ BỊ CHIẾM: Khung giờ ${b.time_slot} ngày ${b.booking_date} tại sân này đã có đơn đặt sân khác được duyệt trước đó! Không thể duyệt trùng ca.`);
      }

      b.status = "CONFIRMED";
      b.version = (b.version || 1) + 1;
      b.confirmed_at = new Date().toISOString().replace("T", " ").substring(0, 19);
      this.save();
      return b;
    }

    adminReleaseSlot(bookingId, reason = "Admin hủy và giải phóng ca") {
      const b = (this.data.bookings || []).find((item) => item.id === Number(bookingId));
      if (!b) throw new Error("Không tìm thấy yêu cầu đặt sân!");
      b.status = "CANCELLED";
      b.admin_note = reason;
      b.released_at = new Date().toISOString().replace("T", " ").substring(0, 19);
      b.version = (b.version || 1) + 1;
      this.save();
      return b;
    }

    // ==========================================
    // CHUYỂN TRẠNG THÁI ĐƠN HÀNG ADMIN THEO LUỒNG & TIMELINE
    // ==========================================
    updateOrderStatus(orderId, newStatus, adminNote = "") {
      const order = this.getOrderById(orderId);
      if (!order) throw new Error("Không tìm thấy đơn hàng!");

      const oldStatus = order.status;
      const allowedTransitions = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["SHIPPING", "CANCELLED"],
        SHIPPING: ["COMPLETED"],
        COMPLETED: [],
        CANCELLED: []
      };

      if (!allowedTransitions[oldStatus] || !allowedTransitions[oldStatus].includes(newStatus)) {
        throw new Error(`Chuyển trạng thái không hợp lệ: Không thể chuyển từ "${oldStatus}" sang "${newStatus}"!`);
      }

      const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

      if (newStatus === "CONFIRMED") {
        order.confirmed_at = nowStr;
      } else if (newStatus === "SHIPPING") {
        order.shipping_at = nowStr;
      } else if (newStatus === "COMPLETED") {
        order.completed_at = nowStr;
      } else if (newStatus === "CANCELLED") {
        // Hoàn tồn an toàn đúng 1 lần
        if (!order.restocked) {
          if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
              for (const p of this.data.products) {
                const s = p.skus.find((sku) => sku.id === Number(item.sku_id));
                if (s) {
                  s.stock += Number(item.quantity);
                  break;
                }
              }
            });
          }
          order.restocked = true;
        }
        order.cancelled_at = nowStr;
        order.cancel_reason = adminNote || "Admin cập nhật trạng thái hủy đơn";
      }

      order.status = newStatus;
      if (adminNote) order.admin_note = adminNote;
      this.save();
      return order;
    }

    getOrderTimeline(order) {
      if (!order) return [];
      const steps = [
        { label: "Đặt hàng", time: order.created_at, done: true, key: "PENDING" },
        { label: "Đã xác nhận", time: order.confirmed_at || null, done: ["CONFIRMED", "SHIPPING", "COMPLETED"].includes(order.status), key: "CONFIRMED" },
        { label: "Đang giao hàng", time: order.shipping_at || null, done: ["SHIPPING", "COMPLETED"].includes(order.status), key: "SHIPPING" },
        { label: "Hoàn tất đơn", time: order.completed_at || null, done: order.status === "COMPLETED", key: "COMPLETED" }
      ];
      if (order.status === "CANCELLED") {
        steps.push({ label: "Đã hủy đơn", time: order.cancelled_at || null, done: true, key: "CANCELLED", isDanger: true });
      }
      return steps;
    }

    // ==========================================
    // ĐÁNH GIÁ & CHẤM SAO SẢN PHẨM (REVIEWS)
    // ==========================================
    getReviews(productId = null) {
      if (!this.data.reviews) this.data.reviews = [];
      if (productId) {
        return this.data.reviews.filter((r) => r.product_id === Number(productId)).sort((a, b) => b.id - a.id);
      }
      return this.data.reviews.sort((a, b) => b.id - a.id);
    }

    getProductRating(productId) {
      const list = this.getReviews(productId);
      if (list.length === 0) {
        return { average: 5.0, avgRating: 5.0, total: 0, count: 0, isDefault: true };
      }
      const sum = list.reduce((s, r) => s + Number(r.rating || 5), 0);
      const avg = Number((sum / list.length).toFixed(1));
      return { average: avg, avgRating: avg, total: list.length, count: list.length, isDefault: false };
    }

    canUserReviewProduct(arg1, arg2) {
      // Hỗ trợ cả 2 thứ tự tham số: (productId, user) hoặc (user, productId)
      let productId = null;
      let userIdentifier = null;

      if (typeof arg1 === "number" || (!isNaN(arg1) && typeof arg2 === "string" && isNaN(arg2))) {
        productId = Number(arg1);
        userIdentifier = arg2;
      } else if (typeof arg2 === "number" || (!isNaN(arg2) && typeof arg1 === "string" && isNaN(arg1))) {
        productId = Number(arg2);
        userIdentifier = arg1;
      } else {
        const isP1 = (this.data.products || []).some(p => p.id === Number(arg1));
        if (isP1) {
          productId = Number(arg1);
          userIdentifier = arg2;
        } else {
          userIdentifier = arg1;
          productId = Number(arg2);
        }
      }

      if (!productId) return false;

      let userName = "";
      let userPhone = "";
      if (typeof userIdentifier === "object" && userIdentifier !== null) {
        userName = userIdentifier.full_name || userIdentifier.name || userIdentifier.username || "";
        userPhone = userIdentifier.phone || "";
      } else if (typeof userIdentifier === "string") {
        userName = userIdentifier.trim();
      }

      if (!userName) {
        try {
          const u = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
          if (u) {
            userName = u.full_name || "";
            userPhone = u.phone || "";
          }
        } catch (e) {}
      }

      const cleanName = (userName || "").toLowerCase().trim();
      const cleanPhone = (userPhone || "").trim();

      // Khách phải có đơn hàng ở trạng thái COMPLETED chứa sản phẩm đó
      const completedOrders = (this.data.orders || []).filter((o) => {
        if (o.status !== "COMPLETED") return false;
        const oName = (o.customer_name || "").toLowerCase().trim();
        const oPhone = (o.phone || "").trim();
        if (cleanPhone && oPhone && cleanPhone === oPhone) return true;
        if (cleanName && oName && (oName === cleanName || cleanName.includes(oName) || oName.includes(cleanName))) return true;
        return false;
      });

      return completedOrders.some((o) => (o.items || []).some((item) => Number(item.product_id) === Number(productId)));
    }

    addReview({ product_id, user_name, user_id = null, rating = 5, comment = "" }) {
      if (!product_id) throw new Error("Thiếu mã sản phẩm!");
      if (!comment || !comment.trim()) throw new Error("Vui lòng nhập nội dung nhận xét!");

      let effectiveName = user_name;
      if (!effectiveName || !effectiveName.trim()) {
        try {
          const u = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
          if (u && u.full_name) effectiveName = u.full_name;
        } catch (e) {}
      }
      if (!effectiveName || !effectiveName.trim()) {
        effectiveName = "Nguyễn Văn An";
      }

      // RÀNG BUỘC CHẶT CHẼ: Chỉ khách có đơn hàng COMPLETED chứa sản phẩm mới được đánh giá
      if (!this.canUserReviewProduct(product_id, effectiveName)) {
        throw new Error(`Bạn chỉ có thể đánh giá và nhận xét khi ĐÃ CÓ ĐƠN HÀNG HOÀN THÀNH (COMPLETED) chứa sản phẩm này!`);
      }

      if (!this.data.reviews) this.data.reviews = [];
      const newReview = {
        id: this.data.reviews.length ? Math.max(...this.data.reviews.map(r => r.id)) + 1 : 1,
        product_id: Number(product_id),
        user_name: effectiveName.trim(),
        rating: Math.max(1, Math.min(5, Number(rating))),
        comment: comment.trim(),
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      this.data.reviews.unshift(newReview);
      this.save();
      return newReview;
    }

    // ==========================================
    // THU MUA ĐỒ CŨ & TỰ ĐỘNG TẠO SKU HÀNG CŨ (BUYBACK)
    // ==========================================
    getBuybacks(status = null) {
      if (!this.data.buybacks) this.data.buybacks = [];
      if (status && status !== "ALL") {
        return this.data.buybacks.filter((b) => b.status === status).sort((a, b) => b.id - a.id);
      }
      return this.data.buybacks.sort((a, b) => b.id - a.id);
    }

    getBuybackById(id) {
      if (!this.data.buybacks) this.data.buybacks = [];
      return this.data.buybacks.find((b) => b.id === Number(id));
    }

    saveBuyback(data) {
      if (!this.data.buybacks) this.data.buybacks = [];
      const newId = this.data.buybacks.length ? Math.max(...this.data.buybacks.map(b => b.id)) + 1 : 1;
      const row = {
        ...data,
        id: newId,
        status: data.status || "CHO_DUYET",
        sku_created: false,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };
      this.data.buybacks.unshift(row);
      this.save();
      return row;
    }

    updateBuybackStatus(id, newStatus, adminNote = "") {
      const b = this.getBuybackById(id);
      if (!b) throw new Error("Không tìm thấy yêu cầu thu mua!");
      b.status = newStatus;
      if (adminNote) b.admin_note = adminNote;
      this.save();
      return b;
    }

    createSkuFromBuyback(buybackId, { price, stock = 1, size = "Tiêu chuẩn", color = "Nguyên bản", wear_description = "", unit = "CHIEC", quantity_per_lot = 1 }) {
      const b = this.getBuybackById(buybackId);
      if (!b) throw new Error("Không tìm thấy yêu cầu thu mua!");
      if (b.status !== "DA_THU_MUA") {
        throw new Error("Chỉ có thể tạo SKU hàng cũ khi yêu cầu ở trạng thái 'Đã thu mua'!");
      }
      if (b.sku_created) {
        throw new Error("Yêu cầu này đã được tạo SKU hàng cũ vào kho trước đó!");
      }

      const generatedSkuCode = `USED-BB${b.id}-${Date.now().toString().slice(-4)}`;
      const finalWearDesc = wear_description || b.wear_description || `Độ mới ${b.condition_grade || '85%'}. Đã qua kiểm định thu mua.`;
      const finalUnit = (unit || "CHIEC").toUpperCase();
      const finalQtyPerLot = finalUnit === "LO" ? (Number(quantity_per_lot) || 12) : 1;

      // Tạo sản phẩm đồ cũ mới đưa vào kho
      const newProduct = {
        name: b.product_name.includes("Cũ") ? b.product_name : `${b.product_name} (Hàng Cũ ${b.condition_grade || ''})`,
        sport_id: b.sport_id || 1,
        category_id: b.category_id || 2,
        brand_id: b.brand_id || 1,
        description: `Sản phẩm thu mua chính hãng đã qua kiểm định kỹ thuật bởi Tsport. ${finalWearDesc}`,
        condition_type: "CU",
        wear_description: finalWearDesc,
        status: "ACTIVE",
        specifications: {
          condition_grade: b.condition_grade || "85%",
          tested_by: "Tsport Inspection Team",
          origin: "Thu mua từ khách hàng",
          lot_info: finalUnit === "LO" ? `Đóng gói lô ${finalQtyPerLot} sản phẩm` : "Đơn chiếc"
        },
        images: [
          {
            id: Date.now(),
            image_url: b.image_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
            is_primary: true,
            sort_order: 1
          }
        ],
        skus: [
          {
            id: Date.now(),
            sku_code: generatedSkuCode,
            size: size || "Tiêu chuẩn",
            color: color || "Nguyên bản",
            price: Number(price) || Number(b.proposed_price) || 1500000,
            stock: Number(stock) || 1,
            unit: finalUnit,
            quantity_per_lot: finalQtyPerLot,
            status: "ACTIVE"
          }
        ]
      };

      this.saveProduct(newProduct);
      b.sku_created = true;
      b.created_sku_code = generatedSkuCode;
      this.save();
      return { product: newProduct, skuCode: generatedSkuCode };
    }

    // ==========================================
    // NHẬP FILE CSV SẢN PHẨM + SKU VÀ KIỂM TRA TỪNG DÒNG
    // ==========================================
    validateAndImportProductsCSV(csvText) {
      if (!csvText || !csvText.trim()) {
        throw new Error("Nội dung file CSV trống!");
      }

      const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("File CSV cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu!");
      }

      // Format chuẩn: name,sport_id,category_id,brand_id,condition_type,wear_description,sku_code,size,color,price,stock,unit,quantity_per_lot
      const errors = [];
      const validRows = [];

      for (let i = 1; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i];
        const cols = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));

        if (cols.length < 11) {
          errors.push({
            line: lineNum,
            field: "Tổng quát",
            raw: line,
            message: `Thiếu cột dữ liệu (Yêu cầu ít nhất 11 cột, hiện có ${cols.length} cột)`
          });
          continue;
        }

        const [name, sportIdRaw, catIdRaw, brandIdRaw, condition, wearDesc, skuCode, size, color, priceRaw, stockRaw, unitRaw, qtyLotRaw] = cols;

        // 1. Kiểm tra Tên sản phẩm
        if (!name) {
          errors.push({ line: lineNum, field: "name", raw: name, message: "Tên sản phẩm không được để trống" });
        }

        // 2. Kiểm tra Môn thể thao
        const sportId = Number(sportIdRaw);
        if (!sportId || !this.getSportById(sportId)) {
          errors.push({ line: lineNum, field: "sport_id", raw: sportIdRaw, message: `Mã môn thể thao "${sportIdRaw}" không tồn tại trong hệ thống` });
        }

        // 3. Kiểm tra Danh mục
        const catId = Number(catIdRaw);
        if (!catId || !this.getCategoryById(catId)) {
          errors.push({ line: lineNum, field: "category_id", raw: catIdRaw, message: `Mã danh mục "${catIdRaw}" không tồn tại` });
        }

        // 4. Kiểm tra Thương hiệu
        const brandId = Number(brandIdRaw);
        if (!brandId || !this.getBrandById(brandId)) {
          errors.push({ line: lineNum, field: "brand_id", raw: brandIdRaw, message: `Mã thương hiệu "${brandIdRaw}" không tồn tại` });
        }

        // 5. Kiểm tra Tình trạng Mới/Cũ & Mô tả hao mòn
        const cond = (condition || "").toUpperCase();
        if (cond !== "MOI" && cond !== "CU") {
          errors.push({ line: lineNum, field: "condition_type", raw: condition, message: `Tình trạng phải là 'MOI' hoặc 'CU' (Giá trị hiện tại: '${condition}')` });
        } else if (cond === "CU" && (!wearDesc || !wearDesc.trim())) {
          errors.push({ line: lineNum, field: "wear_description", raw: wearDesc, message: "Hàng cũ (CU) bắt buộc phải có mô tả hao mòn thực tế theo chuẩn SRS!" });
        }

        // 6. Kiểm tra SKU code, Giá và Tồn kho
        if (!skuCode) {
          errors.push({ line: lineNum, field: "sku_code", raw: skuCode, message: "Mã biến thể SKU không được để trống" });
        }

        const price = Number(priceRaw);
        if (isNaN(price) || price <= 0) {
          errors.push({ line: lineNum, field: "price", raw: priceRaw, message: "Giá bán phải là số dương lớn hơn 0" });
        }

        const stock = Number(stockRaw);
        if (isNaN(stock) || stock < 0) {
          errors.push({ line: lineNum, field: "stock", raw: stockRaw, message: "Tồn kho phải là số nguyên không âm" });
        }

        const unit = (unitRaw || "CHIEC").toUpperCase();
        const qtyPerLot = Number(qtyLotRaw) || 1;
        if (unit === "LO" && qtyPerLot <= 1) {
          errors.push({ line: lineNum, field: "quantity_per_lot", raw: qtyLotRaw, message: "Đơn vị LO (lô) bắt buộc phải có số lượng/lô lớn hơn 1!" });
        }

        // Nếu dòng không có lỗi nào
        const rowErrors = errors.filter(e => e.line === lineNum);
        if (rowErrors.length === 0) {
          validRows.push({
            name,
            sport_id: sportId,
            category_id: catId,
            brand_id: brandId,
            condition_type: cond,
            wear_description: cond === "CU" ? wearDesc : null,
            status: "ACTIVE",
            images: [
              { id: Date.now() + i, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true, sort_order: 1 }
            ],
            skus: [
              {
                id: Date.now() + i,
                sku_code: skuCode,
                size: size || "-",
                color: color || "-",
                price,
                stock,
                unit,
                quantity_per_lot: qtyPerLot
              }
            ]
          });
        }
      }

      return {
        totalLines: lines.length - 1,
        validCount: validRows.length,
        errorCount: errors.length,
        errors,
        validRows
      };
    }

    commitImportedProducts(validRows) {
      if (!validRows || validRows.length === 0) return 0;
      validRows.forEach(row => this.saveProduct(row));
      return validRows.length;
    }

    // ==========================================
    // DỮ LIỆU THỐNG KÊ & DASHBOARD (CHART.JS)
    // ==========================================
    getAnalytics(period = "7days") {
      const orders = this.getOrders();
      const bookings = this.getBookings();
      const products = this.getProducts();

      // Doanh thu từ đơn hàng COMPLETED
      const completedOrders = orders.filter(o => o.status === "COMPLETED");
      const totalRevenue = completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

      // Đếm đơn theo từng trạng thái
      const ordersByStatus = {
        PENDING: orders.filter(o => o.status === "PENDING").length,
        CONFIRMED: orders.filter(o => o.status === "CONFIRMED").length,
        SHIPPING: orders.filter(o => o.status === "SHIPPING").length,
        COMPLETED: completedOrders.length,
        CANCELLED: orders.filter(o => o.status === "CANCELLED").length
      };

      // Sinh mốc ngày gần đây
      const daysCount = period === "today" ? 1 : period === "30days" ? 30 : 7;
      const dateLabels = [];
      const revenueData = [];
      const bookingData = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const displayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
        dateLabels.push(displayLabel);

        // Doanh thu ngày này
        const dayRev = orders
          .filter(o => o.status !== "CANCELLED" && o.created_at && o.created_at.startsWith(dateStr))
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);
        revenueData.push(dayRev || (i === 0 ? 8500000 : Math.floor((Math.random() * 4 + 2)) * 1000000));

        // Số booking sân ngày này
        const dayBookings = bookings.filter(b => b.booking_date === dateStr).length;
        bookingData.push(dayBookings || (i % 2 === 0 ? Math.floor(Math.random() * 5 + 3) : Math.floor(Math.random() * 3 + 1)));
      }

      // Top sản phẩm bán chạy
      const salesMap = {};
      completedOrders.forEach(o => {
        (o.items || []).forEach(item => {
          if (!salesMap[item.product_id]) {
            salesMap[item.product_id] = {
              product_id: item.product_id,
              name: item.product_name,
              sku_code: item.sku_code,
              image_url: item.image_url,
              quantity_sold: 0,
              total_revenue: 0
            };
          }
          salesMap[item.product_id].quantity_sold += item.quantity;
          salesMap[item.product_id].total_revenue += item.price * item.quantity;
        });
      });

      // Bổ sung các sản phẩm hạt giống nếu chưa có nhiều đơn
      const topProducts = Object.values(salesMap);
      if (topProducts.length < 3) {
        products.slice(0, 4).forEach((p, idx) => {
          if (!topProducts.some(tp => tp.product_id === p.id)) {
            topProducts.push({
              product_id: p.id,
              name: p.name,
              sku_code: p.skus[0]?.sku_code || `SKU-${p.id}`,
              image_url: p.images[0]?.image_url || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300",
              quantity_sold: 14 - idx * 3,
              total_revenue: (p.skus[0]?.price || 2000000) * (14 - idx * 3)
            });
          }
        });
      }

      return {
        totalRevenue,
        totalOrders: orders.length,
        totalBookings: bookings.length,
        ordersByStatus,
        dateLabels,
        revenueData,
        bookingData,
        topProducts: topProducts.sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 5)
      };
    }
  
    // ==========================================
    // QUẢN LÝ MÃ GIẢM GIÁ (COUPONS)
    // ==========================================
    getCoupons(filter = null) {
      if (!this.data.coupons) this.data.coupons = [];
      let list = [...this.data.coupons];
      if (filter && filter.status) {
        list = list.filter(c => c.status === filter.status);
      }
      return list.sort((a, b) => b.id - a.id);
    }

    getCouponById(id) {
      if (!this.data.coupons) this.data.coupons = [];
      return this.data.coupons.find(c => c.id === Number(id));
    }

    getCouponByCode(code) {
      if (!code) return null;
      if (!this.data.coupons) this.data.coupons = [];
      const clean = String(code).trim().toUpperCase();
      return this.data.coupons.find(c => c.code.toUpperCase() === clean);
    }

    saveCoupon(coupon) {
      if (!coupon.code || !coupon.code.trim()) throw new Error("Vui lòng nhập mã giảm giá (Code)!");
      const cleanCode = coupon.code.trim().toUpperCase().replace(/\s+/g, "");

      if (!this.data.coupons) this.data.coupons = [];

      // Kiểm tra trùng mã
      const existing = this.data.coupons.find(c => c.code.toUpperCase() === cleanCode && c.id !== Number(coupon.id));
      if (existing) {
        throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại trên hệ thống! Vui lòng chọn mã khác.`);
      }

      const discountVal = Number(coupon.discount_value);
      if (isNaN(discountVal) || discountVal <= 0) {
        throw new Error("Giá trị giảm giá phải lớn hơn 0!");
      }
      if (coupon.discount_type === "PERCENT" && (discountVal < 1 || discountVal > 100)) {
        throw new Error("Phần trăm giảm giá phải nằm trong khoảng từ 1% đến 100%!");
      }

      const minOrder = Number(coupon.min_order_value) || 0;
      if (minOrder < 0) {
        throw new Error("Đơn tối thiểu không thể là số âm!");
      }

      if (coupon.id) {
        const idx = this.data.coupons.findIndex(c => c.id === Number(coupon.id));
        if (idx !== -1) {
          this.data.coupons[idx] = {
            ...this.data.coupons[idx],
            code: cleanCode,
            description: coupon.description ? coupon.description.trim() : "",
            discount_type: coupon.discount_type || "PERCENT",
            discount_value: discountVal,
            max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
            min_order_value: minOrder,
            expires_at: coupon.expires_at || null,
            usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : null,
            status: coupon.status || "ACTIVE",
            updated_at: new Date().toISOString().replace("T", " ").substring(0, 19)
          };
          this.save();
          return this.data.coupons[idx];
        }
      }

      const newId = this.data.coupons.length ? Math.max(...this.data.coupons.map(c => c.id)) + 1 : 1;
      const newCoupon = {
        id: newId,
        code: cleanCode,
        description: coupon.description ? coupon.description.trim() : "",
        discount_type: coupon.discount_type || "PERCENT",
        discount_value: discountVal,
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
        min_order_value: minOrder,
        expires_at: coupon.expires_at || null,
        usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : null,
        used_count: 0,
        status: coupon.status || "ACTIVE",
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      this.data.coupons.unshift(newCoupon);
      this.save();
      return newCoupon;
    }

    deleteCoupon(id) {
      const couponId = Number(id);
      const coupon = this.getCouponById(couponId);
      if (!coupon) throw new Error("Không tìm thấy mã giảm giá!");
      this.data.coupons = this.data.coupons.filter(c => c.id !== couponId);
      this.save();
      return true;
    }

    toggleCouponStatus(id) {
      const coupon = this.getCouponById(id);
      if (!coupon) throw new Error("Không tìm thấy mã giảm giá!");
      coupon.status = coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      this.save();
      return coupon;
    }

    validateAndCalculateCoupon(code, subtotal) {
      const amount = Number(subtotal) || 0;
      if (!code || !String(code).trim()) {
        return { valid: false, message: "Vui lòng nhập mã giảm giá!" };
      }

      const coupon = this.getCouponByCode(code);
      if (!coupon) {
        return { valid: false, message: `Mã giảm giá "${String(code).trim().toUpperCase()}" không tồn tại!` };
      }

      if (coupon.status !== "ACTIVE") {
        return { valid: false, message: `Mã giảm giá "${coupon.code}" đang tạm khóa hoặc ngưng áp dụng!` };
      }

      // 1. Kiểm tra hạn dùng
      if (coupon.expires_at) {
        const today = new Date().toISOString().split("T")[0];
        if (coupon.expires_at < today) {
          return { valid: false, message: `Mã giảm giá "${coupon.code}" đã hết hạn vào ngày ${coupon.expires_at}!` };
        }
      }

      // 2. Kiểm tra số lượt sử dụng
      if (coupon.usage_limit && coupon.usage_limit > 0) {
        const used = Number(coupon.used_count) || 0;
        if (used >= coupon.usage_limit) {
          return { valid: false, message: `Mã giảm giá "${coupon.code}" đã hết số lượt sử dụng (${used}/${coupon.usage_limit})!` };
        }
      }

      // 3. Kiểm tra đơn hàng tối thiểu
      if (coupon.min_order_value && coupon.min_order_value > 0) {
        if (amount < coupon.min_order_value) {
          return {
            valid: false,
            message: `Đơn hàng tối thiểu phải từ ${this.formatMoney(coupon.min_order_value)} để áp dụng mã "${coupon.code}" (Hiện tại: ${this.formatMoney(amount)})!`
          };
        }
      }

      // 4. Tính toán số tiền giảm
      let discount = 0;
      if (coupon.discount_type === "PERCENT") {
        discount = Math.round((amount * Number(coupon.discount_value)) / 100);
        if (coupon.max_discount && coupon.max_discount > 0 && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else if (coupon.discount_type === "FIXED") {
        discount = Math.min(Number(coupon.discount_value), amount);
      }

      const finalTotal = Math.max(0, amount - discount);
      return {
        valid: true,
        coupon,
        discount_amount: discount,
        subtotal: amount,
        final_total: finalTotal,
        message: `Áp dụng thành công mã "${coupon.code}": Giảm ${this.formatMoney(discount)}!`
      };
    }
}

  window.tsportStore = new TsportStore();
})();
