/**
 * TSPORT — QUẢN LÝ DỮ LIỆU TẬP TRUNG (STORE & LOCAL STORAGE)
 * Đồng bộ chuẩn SRS & Backend FastAPI:
 * - 5 Môn thể thao (Sports)
 * - 16 Danh mục (Categories) có cấu trúc Cây cha - con
 * - 11 Thương hiệu (Brands)
 * - 160 Sản phẩm (Products — 16 danh mục con x 10 sản phẩm đúng hãng) kèm ảnh thật xác thực
 */

(function () {
  const STORAGE_KEY = "tsport_store_data_v5";

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
        "id": 1,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 1,
        "name": "Vợt cầu lông Yonex Astrox 88D Pro 2024",
        "description": "Dòng vợt tấn công đỉnh cao thế hệ 3 dành cho người chơi cầu sau, trợ lực đập smash cực uy lực.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "28 lbs",
          "balance": "Head Heavy",
          "material": "HM Graphite + 2G-Namd Flex Force"
        },
        "images": [
          {
            "id": 1,
            "image_url": "/frontend/assets/products/catalog/p001.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 1,
            "sku_code": "TS-C02-P001-A",
            "size": "4U/G5",
            "color": "Đen Bạc",
            "price": 4250000,
            "sale_price": 3890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 2,
            "sku_code": "TS-C02-P001-B",
            "size": "3U/G5",
            "color": "Đen Bạc",
            "price": 4250000,
            "sale_price": 3890000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 2,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 1,
        "name": "Vợt cầu lông Yonex Nanoflare 1000Z",
        "description": "Siêu phẩm tốc độ với hệ thống Sonic Flare System giúp vung vợt chớp nhoáng và phản tạt cực nhanh.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "28 lbs",
          "balance": "Head Light",
          "material": "HM Graphite + NANOMETRIC DR"
        },
        "images": [
          {
            "id": 2,
            "image_url": "/frontend/assets/products/catalog/p002.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 3,
            "sku_code": "TS-C02-P002-A",
            "size": "4U/G5",
            "color": "Vàng Đen",
            "price": 4350000,
            "sale_price": 3950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 4,
            "sku_code": "TS-C02-P002-B",
            "size": "3U/G5",
            "color": "Vàng Đen",
            "price": 4350000,
            "sale_price": 3950000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 3,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 1,
        "name": "Vợt cầu lông Yonex Astrox 100ZZ Kurenai",
        "description": "Cây vợt huyền thoại đồng hành cùng Viktor Axelsen với đũa vợt siêu mảnh, đập cầu cắm sân mạnh mẽ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "28 lbs",
          "balance": "Head Heavy",
          "material": "Hyper Slim Shaft + Namd"
        },
        "images": [
          {
            "id": 3,
            "image_url": "/frontend/assets/products/catalog/p003.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 5,
            "sku_code": "TS-C02-P003-A",
            "size": "4U/G5",
            "color": "Đỏ Kurenai",
            "price": 4650000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 6,
            "sku_code": "TS-C02-P003-B",
            "size": "3U/G5",
            "color": "Đỏ Kurenai",
            "price": 4650000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 4,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 1,
        "name": "Vợt cầu lông Yonex Arcsaber 11 Pro",
        "description": "Vợt công thủ toàn diện kiểm soát cầu tuyệt đối, giữ cầu trên mặt vợt lâu hơn để điều cầu chuẩn xác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "27 lbs",
          "balance": "Even Balance",
          "material": "HM Graphite + POCKETING BOOSTER"
        },
        "images": [
          {
            "id": 4,
            "image_url": "/frontend/assets/products/catalog/p004.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 7,
            "sku_code": "TS-C02-P004-A",
            "size": "4U/G5",
            "color": "Xám Đỏ",
            "price": 4150000,
            "sale_price": 3790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 8,
            "sku_code": "TS-C02-P004-B",
            "size": "3U/G5",
            "color": "Xám Đỏ",
            "price": 4150000,
            "sale_price": 3790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 5,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 2,
        "name": "Vợt cầu lông Lining Axforce 90 Max Tiger",
        "description": "Vợt tấn công uy lực mạnh mẽ với thiết kế họa tiết hổ vằn sắc sảo, thân vợt đàn hồi cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "30 lbs",
          "balance": "Head Heavy",
          "material": "TB Nano + M50 Super Carbon"
        },
        "images": [
          {
            "id": 5,
            "image_url": "/frontend/assets/products/catalog/p005.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 9,
            "sku_code": "TS-C02-P005-A",
            "size": "4U/G5",
            "color": "Đỏ Hổ",
            "price": 3950000,
            "sale_price": 3590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 10,
            "sku_code": "TS-C02-P005-B",
            "size": "3U/G5",
            "color": "Đỏ Hổ",
            "price": 3950000,
            "sale_price": 3590000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 6,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 2,
        "name": "Vợt cầu lông Lining Halbertec 8000",
        "description": "Phối màu bất đối xứng nổi bật, tối ưu khả năng kiểm soát và điều cầu toàn diện trên sân.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "29 lbs",
          "balance": "Even Balance",
          "material": "T1100 + ACC-RIF TECH"
        },
        "images": [
          {
            "id": 6,
            "image_url": "/frontend/assets/products/catalog/p006.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 11,
            "sku_code": "TS-C02-P006-A",
            "size": "4U/G5",
            "color": "Xanh Hồng",
            "price": 3800000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 12,
            "sku_code": "TS-C02-P006-B",
            "size": "3U/G5",
            "color": "Xanh Hồng",
            "price": 3800000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 7,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 2,
        "name": "Vợt cầu lông Lining Bladex 900 Moon Max",
        "description": "Dòng vợt tốc độ cao dành cho đánh đôi chuyên nghiệp, vung vợt thoát gió cực nhanh.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G6",
          "tension": "30 lbs",
          "balance": "Head Light",
          "material": "M46 + ULTRA Carbon"
        },
        "images": [
          {
            "id": 7,
            "image_url": "/frontend/assets/products/catalog/p007.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 13,
            "sku_code": "TS-C02-P007-A",
            "size": "4U/G6",
            "color": "Xanh Dương",
            "price": 4100000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 14,
            "sku_code": "TS-C02-P007-B",
            "size": "3U/G5",
            "color": "Xanh Dương",
            "price": 4100000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 8,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 3,
        "name": "Vợt cầu lông Victor Thruster Ryuga II Pro",
        "description": "Cây vợt rồng lửa đồng hành cùng Lee Zii Jia, công nghệ WES 2.0 tạo cú smash bộc phá.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G5",
          "tension": "31 lbs",
          "balance": "Head Heavy",
          "material": "High Resilience Modulus Graphite + PYROFIL"
        },
        "images": [
          {
            "id": 8,
            "image_url": "/frontend/assets/products/catalog/p008.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 15,
            "sku_code": "TS-C02-P008-A",
            "size": "4U/G5",
            "color": "Tím Đen",
            "price": 3750000,
            "sale_price": 3450000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 16,
            "sku_code": "TS-C02-P008-B",
            "size": "3U/G5",
            "color": "Tím Đen",
            "price": 3750000,
            "sale_price": 3450000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 9,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 10,
        "name": "Vợt cầu lông Mizuno Fortius 11 Quick",
        "description": "Sản xuất tại Nhật Bản với công nghệ Torque Technology T5 truyền lực tối đa trong từng pha cầu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "4U",
          "grip": "G6",
          "tension": "29 lbs",
          "balance": "Head Heavy",
          "material": "High Elasticity Graphite + MFUSION"
        },
        "images": [
          {
            "id": 9,
            "image_url": "/frontend/assets/products/catalog/p009.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 17,
            "sku_code": "TS-C02-P009-A",
            "size": "4U/G6",
            "color": "Đen Vàng",
            "price": 3850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 18,
            "sku_code": "TS-C02-P009-B",
            "size": "3U/G5",
            "color": "Đen Vàng",
            "price": 3850000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 10,
        "sport_id": 1,
        "category_id": 2,
        "brand_id": 3,
        "name": "Vợt cầu lông Victor Auraspeed 90K II (Cũ 95%)",
        "description": "Vợt tốc độ phản tạt đôi nam cực thoát tay, đã qua kiểm định kỹ thuật tại Tsport.",
        "condition_type": "CU",
        "wear_description": "Ngoại hình như mới 95%, chỉ xước dăm li ti ở nắp chụp cán vợt, khung carbon nguyên bản chưa từng va chạm.",
        "status": "ACTIVE",
        "specifications": {
          "weight": "3U",
          "grip": "G5",
          "tension": "27 lbs",
          "balance": "Even Balance",
          "condition_grade": "95%"
        },
        "images": [
          {
            "id": 10,
            "image_url": "/frontend/assets/products/victor-auraspeed-90k-ii.png",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 19,
            "sku_code": "TS-C02-P010-A",
            "size": "3U/G5",
            "color": "Đen Xanh",
            "price": 2450000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 11,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 6,
        "name": "Vợt Tennis Wilson Pro Staff 97 V14",
        "description": "Cây vợt huyền thoại chuẩn kiểm soát với công nghệ Paradigm Bending cho cảm giác bóng chân thực.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "97 sq in",
          "weight": "315g",
          "string_pattern": "16x19",
          "balance": "31cm"
        },
        "images": [
          {
            "id": 11,
            "image_url": "/frontend/assets/products/catalog/p011.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 20,
            "sku_code": "TS-C03-P011-A",
            "size": "Grip 2",
            "color": "Đồng Đen",
            "price": 5600000,
            "sale_price": 5190000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 12,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 6,
        "name": "Vợt Tennis Wilson Blade 98 16x19 V9",
        "description": "Dòng vợt được ưa chuộng nhất trên ATP/WTA Tour với độ ổn định và cảm giác kết nối bóng vượt trội.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "98 sq in",
          "weight": "305g",
          "string_pattern": "16x19",
          "tech": "StableFeel"
        },
        "images": [
          {
            "id": 12,
            "image_url": "/frontend/assets/products/catalog/p012.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 21,
            "sku_code": "TS-C03-P012-A",
            "size": "Grip 2",
            "color": "Xanh Ngọc Lục Bảo",
            "price": 5450000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 13,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 6,
        "name": "Vợt Tennis Wilson Clash 100 V2",
        "description": "Cây vợt thân thiện bậc nhất cho cánh tay nhờ độ uốn dẻo linh hoạt và điểm ngọt mở rộng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "100 sq in",
          "weight": "295g",
          "string_pattern": "16x19",
          "tech": "FORTYFIVE"
        },
        "images": [
          {
            "id": 13,
            "image_url": "/frontend/assets/products/catalog/p013.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 22,
            "sku_code": "TS-C03-P013-A",
            "size": "Grip 2",
            "color": "Đỏ Đen",
            "price": 4950000,
            "sale_price": 4590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 14,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 6,
        "name": "Vợt Tennis Wilson Shift 99 V1",
        "description": "Thiết kế uốn ngang độc quyền tạo độ xoáy topspin hiện đại cùng độ kiểm soát cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "99 sq in",
          "weight": "300g",
          "string_pattern": "16x20",
          "tech": "ARC 3D"
        },
        "images": [
          {
            "id": 14,
            "image_url": "/frontend/assets/products/catalog/p014.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 23,
            "sku_code": "TS-C03-P014-A",
            "size": "Grip 2",
            "color": "Trắng Bạc",
            "price": 5250000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 15,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 7,
        "name": "Vợt Tennis Babolat Pure Aero 2023",
        "description": "Cỗ máy tạo xoáy topspin cực đại đồng hành cùng Carlos Alcaraz và Rafael Nadal.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "100 sq in",
          "weight": "300g",
          "string_pattern": "16x19",
          "tech": "NF2-Tech"
        },
        "images": [
          {
            "id": 15,
            "image_url": "/frontend/assets/products/catalog/p015.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 24,
            "sku_code": "TS-C03-P015-A",
            "size": "Grip 2",
            "color": "Vàng Đen",
            "price": 5200000,
            "sale_price": 4850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 16,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 7,
        "name": "Vợt Tennis Babolat Pure Drive 2021",
        "description": "Biểu tượng sức mạnh bùng nổ và dễ chơi cho cả người chơi phong trào lẫn bán chuyên.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "100 sq in",
          "weight": "300g",
          "string_pattern": "16x19",
          "tech": "HTR System"
        },
        "images": [
          {
            "id": 16,
            "image_url": "/frontend/assets/products/catalog/p016.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 25,
            "sku_code": "TS-C03-P016-A",
            "size": "Grip 2",
            "color": "Xanh Navy",
            "price": 4890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 17,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 7,
        "name": "Vợt Tennis Babolat Pure Strike 100 16x19",
        "description": "Kết hợp hoàn hảo giữa kiểm soát sắc bén và lực đánh linh hoạt cho lối chơi tấn công sớm.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "100 sq in",
          "weight": "300g",
          "string_pattern": "16x19",
          "tech": "Control Frame"
        },
        "images": [
          {
            "id": 17,
            "image_url": "/frontend/assets/products/catalog/p017.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 26,
            "sku_code": "TS-C03-P017-A",
            "size": "Grip 2",
            "color": "Trắng Đỏ Cam",
            "price": 5100000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 18,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 1,
        "name": "Vợt Tennis Yonex EZONE 100 2022",
        "description": "Khung đầu vợt ISOMETRIC mở rộng vùng điểm ngọt 7%, trợ lực êm ái sản xuất tại Nhật Bản.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "100 sq in",
          "weight": "300g",
          "string_pattern": "16x19",
          "tech": "ISOMETRIC + 2G-Namd Speed"
        },
        "images": [
          {
            "id": 18,
            "image_url": "/frontend/assets/products/catalog/p018.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 27,
            "sku_code": "TS-C03-P018-A",
            "size": "Grip 2",
            "color": "Xanh Biển",
            "price": 4990000,
            "sale_price": 4650000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 19,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 1,
        "name": "Vợt Tennis Yonex VCORE 98 2023",
        "description": "Dòng vợt xoáy đỉnh cao của Yonex giúp dây cước bật nảy nhanh và tạo quỹ đạo bóng khó chịu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "head_size": "98 sq in",
          "weight": "305g",
          "string_pattern": "16x19",
          "tech": "Silicone Oil Infused Grommet"
        },
        "images": [
          {
            "id": 19,
            "image_url": "/frontend/assets/products/catalog/p019.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 28,
            "sku_code": "TS-C03-P019-A",
            "size": "Grip 2",
            "color": "Đỏ Tươi",
            "price": 5150000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 20,
        "sport_id": 3,
        "category_id": 3,
        "brand_id": 6,
        "name": "Vợt Tennis Wilson Ultra 100 V4 (Cũ 90%)",
        "description": "Dòng vợt trợ lực mạnh mẽ với thiết kế khung FORTYFIVE bóng bẩy đổi màu theo góc nhìn.",
        "condition_type": "CU",
        "wear_description": "Vành bảo vệ đầu vợt có vài vết xước nhẹ khi cứu bóng, thân khung đẹp nguyên bản không rạn nứt.",
        "status": "ACTIVE",
        "specifications": {
          "head_size": "100 sq in",
          "weight": "300g",
          "string_pattern": "16x19",
          "condition_grade": "90%"
        },
        "images": [
          {
            "id": 20,
            "image_url": "/frontend/assets/products/catalog/p020.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 29,
            "sku_code": "TS-C03-P020-A",
            "size": "Grip 2",
            "color": "Xanh Ánh Tím",
            "price": 2950000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 21,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 9,
        "name": "Vợt Pickleball Joola Ben Johns Perseus 3S 16mm",
        "description": "Vợt thi đấu chuyên nghiệp của tay vợt số 1 thế giới Ben Johns, tối ưu cả lực đập lẫn độ xoáy.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "Propulsion Core 16mm",
          "face": "Charged Carbon Surface",
          "weight": "8.0 oz",
          "length": "16.5 in"
        },
        "images": [
          {
            "id": 21,
            "image_url": "/frontend/assets/products/catalog/p021.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 30,
            "sku_code": "TS-C04-P021-A",
            "size": "16mm",
            "color": "Đen Xanh",
            "price": 6490000,
            "sale_price": 5990000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 22,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 9,
        "name": "Vợt Pickleball Joola Collin Johns Scorpeus 16mm",
        "description": "Mặt vợt bản rộng tối ưu điểm ngọt cho lối chơi phòng thủ chắc chắn và bỏ nhỏ dink chuẩn xác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "Reactive Honeycomb 16mm",
          "face": "Charged Carbon Surface",
          "weight": "8.0 oz"
        },
        "images": [
          {
            "id": 22,
            "image_url": "/frontend/assets/products/catalog/p022.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 31,
            "sku_code": "TS-C04-P022-A",
            "size": "16mm",
            "color": "Đen Xanh Dương",
            "price": 5800000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 23,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 9,
        "name": "Vợt Pickleball Joola Anna Bright Scorpeus 14mm",
        "description": "Phiên bản 14mm phản hồi bóng nhanh, linh hoạt tuyệt đối trong các pha đôi công trên lưới.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "Reactive Honeycomb 14mm",
          "face": "Charged Carbon",
          "weight": "7.8 oz"
        },
        "images": [
          {
            "id": 23,
            "image_url": "/frontend/assets/products/catalog/p023.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 32,
            "sku_code": "TS-C04-P023-A",
            "size": "14mm",
            "color": "Đen Đỏ",
            "price": 5750000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 24,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 9,
        "name": "Vợt Pickleball Joola Ben Johns Hyperion CFS 16",
        "description": "Đầu vợt khí động học Aero-Curve giảm sức cản gió, tạo cú drive sâu và xoáy mạnh.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "Reactive Honeycomb 16mm",
          "face": "Carbon Friction Surface",
          "weight": "8.4 oz"
        },
        "images": [
          {
            "id": 24,
            "image_url": "/frontend/assets/products/catalog/p024.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 33,
            "sku_code": "TS-C04-P024-A",
            "size": "16mm",
            "color": "Đen Viền Xám",
            "price": 5490000,
            "sale_price": 4990000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 25,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 8,
        "name": "Vợt Pickleball Selkirk Vanguard Power Air Invikta",
        "description": "Vợt không viền khí động học có lỗ thoát gió Air Dynamic Throat cho tốc độ vung vợt cực cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "SuperCore Polymer 13mm",
          "face": "QuadFlex 4 Layer Hybrid",
          "weight": "7.9 oz"
        },
        "images": [
          {
            "id": 25,
            "image_url": "/frontend/assets/products/catalog/p025.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 34,
            "sku_code": "TS-C04-P025-A",
            "size": "13mm",
            "color": "Đỏ Đen",
            "price": 5900000,
            "sale_price": 5490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 26,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 8,
        "name": "Vợt Pickleball Selkirk Luxx Control Air Invikta",
        "description": "Độ dày lõi 20mm mang lại cảm giác kiểm soát mềm mại hàng đầu thế giới cho người chơi kỹ thuật.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "X7 Thikset Honeycomb 20mm",
          "face": "Florek Carbon Fiber",
          "weight": "7.9 oz"
        },
        "images": [
          {
            "id": 26,
            "image_url": "/frontend/assets/products/catalog/p026.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 35,
            "sku_code": "TS-C04-P026-A",
            "size": "20mm",
            "color": "Xanh Dương Trắng",
            "price": 6150000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 27,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 8,
        "name": "Vợt Pickleball Selkirk SLK Halo Control XL",
        "description": "Mặt sợi carbon thô T700 bám bóng tốt, mức giá hợp lý cho người chơi từ phong trào đến nâng cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "Rev-Core Control 16mm",
          "face": "T700 Raw Carbon Fiber",
          "weight": "7.8 oz"
        },
        "images": [
          {
            "id": 27,
            "image_url": "/frontend/assets/products/catalog/p027.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 36,
            "sku_code": "TS-C04-P027-A",
            "size": "16mm",
            "color": "Đen Vàng",
            "price": 3490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 28,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 8,
        "name": "Vợt Pickleball Selkirk SLK Latitude Max",
        "description": "Lựa chọn lý tưởng cho người mới bắt đầu với mặt vợt rộng dễ làm quen và kiểm soát.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "SX4 Polymer Core",
          "face": "GraphiFlex",
          "weight": "7.7 oz"
        },
        "images": [
          {
            "id": 28,
            "image_url": "/frontend/assets/products/catalog/p028.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 37,
            "sku_code": "TS-C04-P028-A",
            "size": "13mm",
            "color": "Xanh Trắng",
            "price": 2150000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 29,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 11,
        "name": "Vợt Pickleball Kamito Alpha Pro 16mm",
        "description": "Thiết kế dành riêng cho người chơi Việt Nam, mặt carbon nhám T700 cân bằng công thủ tốt.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "PP Honeycomb 16mm",
          "face": "Toray T700 Carbon",
          "weight": "8.0 oz"
        },
        "images": [
          {
            "id": 29,
            "image_url": "/frontend/assets/products/catalog/p029.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 38,
            "sku_code": "TS-C04-P029-A",
            "size": "16mm",
            "color": "Đen Cam",
            "price": 2490000,
            "sale_price": 2190000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 30,
        "sport_id": 4,
        "category_id": 4,
        "brand_id": 8,
        "name": "Vợt Pickleball Selkirk SLK Halo Power Max (Cũ 90%)",
        "description": "Vợt kiểm định chính hãng, mặt carbon còn độ nhám tốt cho các cú đánh xoáy.",
        "condition_type": "CU",
        "wear_description": "Viền bảo vệ có xước dăm nhẹ khi cứu bóng thấp, mặt T700 nguyên vẹn không lún lõi.",
        "status": "ACTIVE",
        "specifications": {
          "core": "Rev-Core Power 13mm",
          "face": "T700 Raw Carbon",
          "weight": "8.0 oz",
          "condition_grade": "90%"
        },
        "images": [
          {
            "id": 30,
            "image_url": "/frontend/assets/products/catalog/p030.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 39,
            "sku_code": "TS-C04-P030-A",
            "size": "13mm",
            "color": "Đen Đỏ",
            "price": 2050000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 31,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 12,
        "name": "Cốt vợt bóng bàn Butterfly Viscaria FL",
        "description": "Cốt vợt huyền thoại số 1 thế giới với cấu trúc ALC cân bằng hoàn hảo giữa tốc độ và cảm giác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Arylate-Carbon",
          "weight": "87g",
          "thickness": "5.8mm",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 31,
            "image_url": "/frontend/assets/products/catalog/p031.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 40,
            "sku_code": "TS-C17-P031-A",
            "size": "FL",
            "color": "Gỗ / Xanh",
            "price": 4150000,
            "sale_price": 3890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 32,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 12,
        "name": "Cốt vợt bóng bàn Butterfly Timo Boll ALC",
        "description": "Mẫu cốt vợt gắn liền với huyền thoại Timo Boll, lý tưởng cho lối đánh giật xoáy hai càng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Arylate-Carbon",
          "weight": "86g",
          "thickness": "5.8mm",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 32,
            "image_url": "/frontend/assets/products/catalog/p032.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 41,
            "sku_code": "TS-C17-P032-A",
            "size": "FL",
            "color": "Gỗ / Xanh Tím",
            "price": 3950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 33,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 12,
        "name": "Cốt vợt bóng bàn Butterfly Fan Zhendong ALC",
        "description": "Phiên bản đặc biệt của nhà vô địch Olympic Fan Zhendong, tốc độ bùng nổ và kiểm soát ổn định.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Arylate-Carbon",
          "weight": "87g",
          "thickness": "5.8mm",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 33,
            "image_url": "/frontend/assets/products/catalog/p033.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 42,
            "sku_code": "TS-C17-P033-A",
            "size": "FL",
            "color": "Gỗ / Xanh Đen",
            "price": 4250000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 34,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 12,
        "name": "Cốt vợt bóng bàn Butterfly Harimoto Innerforce ALC",
        "description": "Cấu trúc sợi carbon đặt sát lõi gỗ giúp giữ bóng lâu hơn, cực kỳ dễ điều khiển bóng ngắn.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Inner ALC",
          "weight": "88g",
          "thickness": "6.0mm",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 34,
            "image_url": "/frontend/assets/products/catalog/p034.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 43,
            "sku_code": "TS-C17-P034-A",
            "size": "FL",
            "color": "Gỗ / Đen Vàng",
            "price": 4100000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 35,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 12,
        "name": "Cốt vợt bóng bàn Butterfly Sardius TAMCA 5000",
        "description": "Siêu tốc độ bạt bóng đầy uy lực với lớp gỗ Hinoki dày đặc trưng của dòng tấn công cổ điển.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "3 Gỗ Hinoki + 2 Carbon T5000",
          "weight": "92g",
          "thickness": "7.0mm",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 35,
            "image_url": "/frontend/assets/products/catalog/p035.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 44,
            "sku_code": "TS-C17-P035-A",
            "size": "FL",
            "color": "Gỗ Hinoki",
            "price": 3850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 36,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 13,
        "name": "Cốt vợt bóng bàn DHS Hurricane Long 5",
        "description": "Cốt vợt của nhà vô địch Grand Slam Ma Long, nổi tiếng với cú giật thuận tay cực mạnh.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Arylate-Carbon",
          "weight": "89g",
          "thickness": "5.9mm",
          "origin": "Trung Quốc"
        },
        "images": [
          {
            "id": 36,
            "image_url": "/frontend/assets/products/catalog/p036.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 45,
            "sku_code": "TS-C17-P036-A",
            "size": "FL",
            "color": "Gỗ / Vàng Đỏ",
            "price": 4350000,
            "sale_price": 3990000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 37,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 13,
        "name": "Cốt vợt bóng bàn DHS Hurricane 301",
        "description": "Cốt vợt quốc dân hiệu năng vượt tầm giá với lớp mặt Koto sắc bén và cảm giác bóng rõ nét.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Inner ALC",
          "weight": "88g",
          "thickness": "5.8mm"
        },
        "images": [
          {
            "id": 37,
            "image_url": "/frontend/assets/products/catalog/p037.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 46,
            "sku_code": "TS-C17-P037-A",
            "size": "FL",
            "color": "Gỗ / Xanh Đỏ",
            "price": 1950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 38,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 13,
        "name": "Cốt vợt bóng bàn DHS Fang Bo B2X",
        "description": "Phiên bản nâng cấp lõi dày hỗ trợ lực đánh mạnh mẽ khi chơi bóng nhựa 40+.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 Gỗ + 2 Arylate-Carbon",
          "weight": "88g",
          "thickness": "5.9mm"
        },
        "images": [
          {
            "id": 38,
            "image_url": "/frontend/assets/products/catalog/p038.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 47,
            "sku_code": "TS-C17-P038-A",
            "size": "FL",
            "color": "Gỗ / Xanh Dương",
            "price": 1650000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 39,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 13,
        "name": "Vợt bóng bàn dán sẵn DHS 4002",
        "description": "Vợt dán sẵn chính hãng DHS sử dụng mặt Hurricane bám xoáy, tặng kèm bao đựng tiện lợi.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "rubbers": "Hurricane 3 + Tin Arc",
          "weight": "178g",
          "level": "Phong trào / Bán chuyên"
        },
        "images": [
          {
            "id": 39,
            "image_url": "/frontend/assets/products/catalog/p039.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 48,
            "sku_code": "TS-C17-P039-A",
            "size": "FL",
            "color": "Đỏ Đen",
            "price": 650000,
            "sale_price": 550000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 40,
        "sport_id": 6,
        "category_id": 17,
        "brand_id": 12,
        "name": "Cốt vợt bóng bàn Butterfly Primorac OFF- (Cũ 92%)",
        "description": "Cốt vợt 5 lớp gỗ thuần kinh điển dành cho người tập kỹ thuật cơ bản và kiểm soát bóng.",
        "condition_type": "CU",
        "wear_description": "Cán vợt hơi sẫm màu mồ hôi tay, cạnh gỗ nguyên vẹn không sứt mẻ, mặt vợt phẳng đẹp.",
        "status": "ACTIVE",
        "specifications": {
          "plies": "5 lớp gỗ thuần",
          "weight": "85g",
          "thickness": "5.5mm",
          "condition_grade": "92%"
        },
        "images": [
          {
            "id": 40,
            "image_url": "/frontend/assets/products/catalog/p040.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 49,
            "sku_code": "TS-C17-P040-A",
            "size": "FL",
            "color": "Gỗ Tự Nhiên",
            "price": 1250000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 41,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 12,
        "name": "Mặt vợt bóng bàn Butterfly Tenergy 05",
        "description": "Mặt vợt bán chạy nhất mọi thời đại với công nghệ High Tension cho khả năng giật xoáy vượt trội.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Spring Sponge 36°",
          "speed": "13.0",
          "spin": "11.5",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 41,
            "image_url": "/frontend/assets/products/catalog/p041.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 50,
            "sku_code": "TS-C18-P041-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 1650000,
            "sale_price": 1550000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 42,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 12,
        "name": "Mặt vợt bóng bàn Butterfly Dignics 09C",
        "description": "Siêu phẩm mặt vợt lai Tàu - Nhật độ bám xoáy cực đại, kiểm soát giao bóng và cắt bóng sắc lẹm.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Spring Sponge X 44°",
          "surface": "Tacky (Hơi dính)",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 42,
            "image_url": "/frontend/assets/products/catalog/p042.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 51,
            "sku_code": "TS-C18-P042-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 2150000,
            "sale_price": 1990000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 43,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 12,
        "name": "Mặt vợt bóng bàn Butterfly Dignics 05",
        "description": "Nâng cấp toàn diện từ Tenergy 05 với độ đàn hồi Spring Sponge X tạo vòng cung bóng uy lực.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Spring Sponge X 40°",
          "speed": "13.5",
          "spin": "12.0",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 43,
            "image_url": "/frontend/assets/products/catalog/p043.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 52,
            "sku_code": "TS-C18-P043-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 2100000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 44,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 12,
        "name": "Mặt vợt bóng bàn Butterfly Rozena",
        "description": "Mặt vợt thân thiện dễ kiểm soát, hỗ trợ sửa lỗi góc vợt cực tốt cho người chơi phong trào.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Spring Sponge 35°",
          "level": "Trung cấp - Nâng cao",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 44,
            "image_url": "/frontend/assets/products/catalog/p044.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 53,
            "sku_code": "TS-C18-P044-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 980000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 45,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 12,
        "name": "Mặt vợt bóng bàn Butterfly Tenergy 64",
        "description": "Tốc độ nhanh nhất dòng Tenergy, cực kỳ thích hợp đánh trái tay hoặc giật xa bàn.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Spring Sponge 36°",
          "speed": "13.5",
          "spin": "10.5",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 45,
            "image_url": "/frontend/assets/products/catalog/p045.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 54,
            "sku_code": "TS-C18-P045-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 1650000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 46,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 12,
        "name": "Mặt vợt bóng bàn Butterfly Glayzer",
        "description": "Trang bị lót Spring Sponge X cao cấp với mức giá mềm hơn dòng Dignics.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Spring Sponge X 38°",
          "origin": "Nhật Bản"
        },
        "images": [
          {
            "id": 46,
            "image_url": "/frontend/assets/products/catalog/p046.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 55,
            "sku_code": "TS-C18-P046-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 1050000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 47,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 13,
        "name": "Mặt vợt bóng bàn DHS Hurricane 3 Neo",
        "description": "Mặt vợt huyền thoại của tuyển Trung Quốc với độ dính cao tạo quỹ đạo giật bóng cắm và xoáy sâu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Neo Orange Sponge 39°",
          "surface": "Tacky Dính",
          "origin": "Trung Quốc"
        },
        "images": [
          {
            "id": 47,
            "image_url": "/frontend/assets/products/catalog/p047.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 56,
            "sku_code": "TS-C18-P047-A",
            "size": "2.15mm",
            "color": "Đen 39°",
            "price": 680000,
            "sale_price": 620000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 48,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 13,
        "name": "Mặt vợt bóng bàn DHS Hurricane 3 National Blue Sponge",
        "description": "Phiên bản lót xanh cấp độ đội tuyển quốc gia cho độ nén và lực bật vượt trội.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Blue Sponge 40°",
          "grade": "National Tuyển Quốc Gia"
        },
        "images": [
          {
            "id": 48,
            "image_url": "/frontend/assets/products/catalog/p048.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 57,
            "sku_code": "TS-C18-P048-A",
            "size": "2.15mm",
            "color": "Đen Lót Xanh",
            "price": 1950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 49,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 13,
        "name": "Mặt vợt bóng bàn DHS Hurricane 8-80",
        "description": "Lót đàn hồi mềm hơn giúp dễ phát lực đánh trái tay mà vẫn giữ độ xoáy đặc trưng dòng Hurricane.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "Elastic 80# Sponge 37°",
          "use": "Trái tay / Thuận tay"
        },
        "images": [
          {
            "id": 49,
            "image_url": "/frontend/assets/products/catalog/p049.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 58,
            "sku_code": "TS-C18-P049-A",
            "size": "2.1mm",
            "color": "Đỏ 37°",
            "price": 790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 50,
        "sport_id": 6,
        "category_id": 18,
        "brand_id": 13,
        "name": "Mặt vợt bóng bàn DHS Gold Arc 8",
        "description": "Mặt vợt công nghệ bọt khí Đức hợp tác cùng DHS, phát tiếng nổ giòn và tốc độ cực cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "sponge": "German Tensor 47.5°",
          "origin": "Sản xuất tại Đức"
        },
        "images": [
          {
            "id": 50,
            "image_url": "/frontend/assets/products/catalog/p050.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 59,
            "sku_code": "TS-C18-P050-A",
            "size": "2.1mm",
            "color": "Đỏ / Đen",
            "price": 890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 51,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 1,
        "name": "Giày cầu lông Yonex Power Cushion 65Z3",
        "description": "Đôi giày quốc dân êm ái toàn diện, bám sân cực tốt và giảm chấn gót chân hiệu quả.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "outsole": "Radial Blade Sole",
          "midsole": "Power Cushion+",
          "weight": "310g"
        },
        "images": [
          {
            "id": 51,
            "image_url": "/frontend/assets/products/catalog/p051.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 60,
            "sku_code": "TS-C06-P051-A",
            "size": "41",
            "color": "Trắng Đỏ",
            "price": 2650000,
            "sale_price": 2390000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 61,
            "sku_code": "TS-C06-P051-B",
            "size": "42",
            "color": "Trắng Đỏ",
            "price": 2650000,
            "sale_price": 2390000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 52,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 1,
        "name": "Giày cầu lông Yonex Power Cushion Aerus Z2",
        "description": "Dòng giày siêu nhẹ chỉ 240g giúp tăng tốc độ di chuyển và bật nhảy thanh thoát trên sân.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "240g (Siêu nhẹ)",
          "midsole": "Feather Light X",
          "upper": "Double Raschel Mesh"
        },
        "images": [
          {
            "id": 52,
            "image_url": "/frontend/assets/products/catalog/p052.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 62,
            "sku_code": "TS-C06-P052-A",
            "size": "41",
            "color": "Xanh Mint",
            "price": 2950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 63,
            "sku_code": "TS-C06-P052-B",
            "size": "42",
            "color": "Xanh Mint",
            "price": 2950000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 53,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 1,
        "name": "Giày cầu lông Yonex Power Cushion Eclipsion Z3",
        "description": "Tối ưu sự ổn định tối đa cho các bước di chuyển ngang gắt và tiếp đất sau cú đập nhảy.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "stability": "3D Power Graphite",
          "midsole": "Power Cushion+",
          "fit": "Ôm cổ chân chống lật"
        },
        "images": [
          {
            "id": 53,
            "image_url": "/frontend/assets/products/catalog/p053.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 64,
            "sku_code": "TS-C06-P053-A",
            "size": "42",
            "color": "Trắng Vàng",
            "price": 2850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 65,
            "sku_code": "TS-C06-P053-B",
            "size": "40",
            "color": "Trắng Vàng",
            "price": 2850000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 54,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 1,
        "name": "Giày cầu lông Yonex Power Cushion Comfort Z3",
        "description": "Đệm khí Power Cushion+ trải dài toàn bàn chân giúp bảo vệ đầu gối tối ưu khi chơi cường độ cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "cushion": "Full-length Power Cushion+",
          "fit": "Wide 4E"
        },
        "images": [
          {
            "id": 54,
            "image_url": "/frontend/assets/products/catalog/p054.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 66,
            "sku_code": "TS-C06-P054-A",
            "size": "41",
            "color": "Đen Đỏ",
            "price": 2790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 67,
            "sku_code": "TS-C06-P054-B",
            "size": "42",
            "color": "Đen Đỏ",
            "price": 2790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 55,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 2,
        "name": "Giày cầu lông Lining Blade Pro",
        "description": "Trang bị đế BOOM siêu đàn hồi kết hợp tấm carbon chống xoắn giữa bàn chân.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "BOOM Technology",
          "plate": "Carbon Fiber Plate"
        },
        "images": [
          {
            "id": 55,
            "image_url": "/frontend/assets/products/catalog/p055.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 68,
            "sku_code": "TS-C06-P055-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 2450000,
            "sale_price": 2190000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 69,
            "sku_code": "TS-C06-P055-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 2450000,
            "sale_price": 2190000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 56,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 2,
        "name": "Giày cầu lông Lining Saga II Pro",
        "description": "Form giày vững chãi bảo vệ cổ chân tốt, thiết kế thể thao hiện đại.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "Light Foam + BOOM",
          "upper": "Mesh thoáng khí + TPU"
        },
        "images": [
          {
            "id": 56,
            "image_url": "/frontend/assets/products/catalog/p056.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 70,
            "sku_code": "TS-C06-P056-A",
            "size": "41",
            "color": "Trắng Đen",
            "price": 2350000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 71,
            "sku_code": "TS-C06-P056-B",
            "size": "42",
            "color": "Trắng Đen",
            "price": 2350000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 57,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 3,
        "name": "Giày cầu lông Victor P9200III",
        "description": "Dòng giày bảo vệ mắt cá chân trứ danh của Victor với độ bền đế vượt trội.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "NEO DUPLEX + HYPEREVA",
          "stability": "LS-S chống lật cổ chân"
        },
        "images": [
          {
            "id": 57,
            "image_url": "/frontend/assets/products/catalog/p057.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 72,
            "sku_code": "TS-C06-P057-A",
            "size": "41",
            "color": "Trắng Xanh Navy",
            "price": 2590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 73,
            "sku_code": "TS-C06-P057-B",
            "size": "42",
            "color": "Trắng Xanh Navy",
            "price": 2590000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 58,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 3,
        "name": "Giày cầu lông Victor A970NitroLite",
        "description": "Công nghệ bọt khí NitroLite siêu nhẹ đàn hồi giúp khởi phát bước chạy bùng nổ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "NitroLite Foam",
          "upper": "Microfiber PU Leather"
        },
        "images": [
          {
            "id": 58,
            "image_url": "/frontend/assets/products/catalog/p058.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 74,
            "sku_code": "TS-C06-P058-A",
            "size": "42",
            "color": "Trắng Tím",
            "price": 2890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 75,
            "sku_code": "TS-C06-P058-B",
            "size": "40",
            "color": "Trắng Tím",
            "price": 2890000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 59,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 10,
        "name": "Giày cầu lông Mizuno Wave Claw 3",
        "description": "Form giày cực kỳ vừa vặn cho bàn chân bè người Việt, đệm Wave êm ái ổn định.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "MIZUNO ENERZY + Wave",
          "fit": "Chân bè châu Á"
        },
        "images": [
          {
            "id": 59,
            "image_url": "/frontend/assets/products/catalog/p059.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 76,
            "sku_code": "TS-C06-P059-A",
            "size": "41",
            "color": "Trắng Xanh Dương",
            "price": 2550000,
            "sale_price": 2290000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 77,
            "sku_code": "TS-C06-P059-B",
            "size": "42",
            "color": "Trắng Xanh Dương",
            "price": 2550000,
            "sale_price": 2290000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 60,
        "sport_id": 1,
        "category_id": 6,
        "brand_id": 10,
        "name": "Giày cầu lông Mizuno Wave Fang 2 (Cũ 90%)",
        "description": "Dòng giày bền bỉ chắc chắn với đế cao su XG bám sàn cực tốt.",
        "condition_type": "CU",
        "wear_description": "Đế cao su mòn nhẹ khoảng 10% ở gót ngoài, da mũi giày nguyên vẹn, lót trong sạch đẹp.",
        "status": "ACTIVE",
        "specifications": {
          "outsole": "XG Rubber",
          "midsole": "Mizuno Wave",
          "condition_grade": "90%"
        },
        "images": [
          {
            "id": 60,
            "image_url": "/frontend/assets/products/catalog/p060.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 78,
            "sku_code": "TS-C06-P060-A",
            "size": "41",
            "color": "Trắng Đỏ",
            "price": 1390000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 61,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 4,
        "name": "Giày bóng đá Nike Zoom Mercurial Vapor 15 Pro TF",
        "description": "Siêu phẩm tốc độ sân cỏ nhân tạo với túi khí Air Zoom hoàn trả năng lượng cực nhạy.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "cushion": "Air Zoom",
          "upper": "NikeSkin"
        },
        "images": [
          {
            "id": 61,
            "image_url": "/frontend/assets/products/catalog/p061.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 79,
            "sku_code": "TS-C07-P061-A",
            "size": "41",
            "color": "Đỏ Cam",
            "price": 2850000,
            "sale_price": 2490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 80,
            "sku_code": "TS-C07-P061-B",
            "size": "42",
            "color": "Đỏ Cam",
            "price": 2850000,
            "sale_price": 2490000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 62,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 4,
        "name": "Giày bóng đá Nike Tiempo Legend 10 Pro TF",
        "description": "Cảm giác chạm bóng êm ái thật chân nhất phân khúc với chất liệu da tổng hợp FlyTouch Pro.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "FlyTouch Pro siêu mềm"
        },
        "images": [
          {
            "id": 62,
            "image_url": "/frontend/assets/products/catalog/p062.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 81,
            "sku_code": "TS-C07-P062-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 2790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 82,
            "sku_code": "TS-C07-P062-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 2790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 63,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 4,
        "name": "Giày bóng đá Nike Phantom GX 2 Pro TF",
        "description": "Bề mặt vân nổi Gripknit hỗ trợ kiểm soát bóng dính chân và chuyền sút chuẩn xác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "Flyknit + Gripknit"
        },
        "images": [
          {
            "id": 63,
            "image_url": "/frontend/assets/products/catalog/p063.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 83,
            "sku_code": "TS-C07-P063-A",
            "size": "41",
            "color": "Đen Trắng",
            "price": 2890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 84,
            "sku_code": "TS-C07-P063-B",
            "size": "42",
            "color": "Đen Trắng",
            "price": 2890000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 64,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 5,
        "name": "Giày bóng đá Adidas Predator Elite TF",
        "description": "Dòng giày sút xoáy huyền thoại trang bị vây cao su Strikeskin tăng độ bám bóng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "HybridTouch 2.0 + Strikeskin",
          "cushion": "Lightstrike"
        },
        "images": [
          {
            "id": 64,
            "image_url": "/frontend/assets/products/catalog/p064.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 85,
            "sku_code": "TS-C07-P064-A",
            "size": "41",
            "color": "Đen Đỏ Trắng",
            "price": 3100000,
            "sale_price": 2790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 86,
            "sku_code": "TS-C07-P064-B",
            "size": "42",
            "color": "Đen Đỏ Trắng",
            "price": 3100000,
            "sale_price": 2790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 65,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 5,
        "name": "Giày bóng đá Adidas F50 Pro TF",
        "description": "Sự trở lại của huyền thoại tốc độ F50 với trọng lượng nhẹ và bộ đế bám sân sắc bén.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "Fibertouch",
          "cushion": "Lightstrike"
        },
        "images": [
          {
            "id": 65,
            "image_url": "/frontend/assets/products/catalog/p065.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 87,
            "sku_code": "TS-C07-P065-A",
            "size": "41",
            "color": "Trắng Đỏ Xanh",
            "price": 2950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 88,
            "sku_code": "TS-C07-P065-B",
            "size": "42",
            "color": "Trắng Đỏ Xanh",
            "price": 2950000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 66,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 5,
        "name": "Giày bóng đá Adidas Copa Pure 2 Pro TF",
        "description": "Mũi giày da bò thật mềm mại cho cảm giác khống chế bóng cổ điển đầy tinh tế.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "Fusionskin Da Bò"
        },
        "images": [
          {
            "id": 66,
            "image_url": "/frontend/assets/products/catalog/p066.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 89,
            "sku_code": "TS-C07-P066-A",
            "size": "41",
            "color": "Trắng Xanh Navy",
            "price": 2690000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 90,
            "sku_code": "TS-C07-P066-B",
            "size": "42",
            "color": "Trắng Xanh Navy",
            "price": 2690000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 67,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 10,
        "name": "Giày bóng đá Mizuno Morelia Neo IV Pro AS TF",
        "description": "Da Kangaroo mềm như bơ ôm gọn chân bè, đinh chữ L siêu bám sân cỏ nhân tạo.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "Da Kangaroo thật",
          "weight": "235g"
        },
        "images": [
          {
            "id": 67,
            "image_url": "/frontend/assets/products/catalog/p067.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 91,
            "sku_code": "TS-C07-P067-A",
            "size": "41",
            "color": "Trắng Đỏ",
            "price": 2990000,
            "sale_price": 2690000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 92,
            "sku_code": "TS-C07-P067-B",
            "size": "42",
            "color": "Trắng Đỏ",
            "price": 2990000,
            "sale_price": 2690000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 68,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 10,
        "name": "Giày bóng đá Mizuno Alpha Pro AS TF",
        "description": "Mẫu giày tốc độ nhẹ nhất lịch sử Mizuno, cực êm gót với lớp đệm Enerzy Foam.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "cushion": "MIZUNO ENERZY",
          "weight": "225g"
        },
        "images": [
          {
            "id": 68,
            "image_url": "/frontend/assets/products/catalog/p068.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 93,
            "sku_code": "TS-C07-P068-A",
            "size": "41",
            "color": "Trắng Vàng",
            "price": 2850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 94,
            "sku_code": "TS-C07-P068-B",
            "size": "42",
            "color": "Trắng Vàng",
            "price": 2850000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 69,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 11,
        "name": "Giày bóng đá Kamito TA11 Pro TF",
        "description": "Đồng sáng tạo cùng tuyển thủ Nguyễn Tuấn Anh, form giày êm chân bền bỉ cực hợp sân 7.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "upper": "KA-FIBER",
          "fit": "Form chân bè Việt Nam"
        },
        "images": [
          {
            "id": 69,
            "image_url": "/frontend/assets/products/catalog/p069.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 95,
            "sku_code": "TS-C07-P069-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 850000,
            "sale_price": 790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 96,
            "sku_code": "TS-C07-P069-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 850000,
            "sale_price": 790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 70,
        "sport_id": 2,
        "category_id": 7,
        "brand_id": 4,
        "name": "Giày bóng đá Nike Phantom GX Pro TF (Cũ 88%)",
        "description": "Hàng chính hãng đã qua sử dụng khoảng 10 trận sân 7, đinh còn rất sắc.",
        "condition_type": "CU",
        "wear_description": "Đinh dăm mòn nhẹ ~12%, mũi giày có vết xước nhỏ do sút bóng, keo đế nguyên zin chưa hở.",
        "status": "ACTIVE",
        "specifications": {
          "surface": "Sân cỏ nhân tạo TF",
          "condition_grade": "88%"
        },
        "images": [
          {
            "id": 70,
            "image_url": "/frontend/assets/products/catalog/p070.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 97,
            "sku_code": "TS-C07-P070-A",
            "size": "41",
            "color": "Xanh Hồng",
            "price": 1350000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 71,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 4,
        "name": "Giày Tennis Nike Court Air Zoom Vapor 11",
        "description": "Thiết kế thấp sát mặt sân giúp chuyển hướng gắt và bứt tốc cực nhanh trên sân cứng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court",
          "cushion": "Forefoot Air Zoom",
          "profile": "Low-to-court"
        },
        "images": [
          {
            "id": 71,
            "image_url": "/frontend/assets/products/catalog/p071.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 98,
            "sku_code": "TS-C08-P071-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 3650000,
            "sale_price": 3290000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 99,
            "sku_code": "TS-C08-P071-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 3650000,
            "sale_price": 3290000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 72,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 4,
        "name": "Giày Tennis Nike Court Air Zoom GP Challenge Pro",
        "description": "Khung đế rộng vững chãi chống lật cổ chân tuyệt vời cho cả Tennis lẫn Pickleball.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court / Pickleball",
          "stability": "Midfoot Plastic Plate"
        },
        "images": [
          {
            "id": 72,
            "image_url": "/frontend/assets/products/catalog/p072.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 100,
            "sku_code": "TS-C08-P072-A",
            "size": "41",
            "color": "Trắng Cam",
            "price": 3200000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 101,
            "sku_code": "TS-C08-P072-B",
            "size": "42",
            "color": "Trắng Cam",
            "price": 3200000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 73,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 4,
        "name": "Giày Tennis Nike Court Vapor Pro 2",
        "description": "Thoáng khí tối đa và bền bỉ cho những trận đấu kéo dài dưới trời nắng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court",
          "upper": "Reinforced Mesh",
          "cushion": "Air Zoom"
        },
        "images": [
          {
            "id": 73,
            "image_url": "/frontend/assets/products/catalog/p073.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 102,
            "sku_code": "TS-C08-P073-A",
            "size": "41",
            "color": "Trắng Đen",
            "price": 3150000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 103,
            "sku_code": "TS-C08-P073-B",
            "size": "42",
            "color": "Trắng Đen",
            "price": 3150000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 74,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 5,
        "name": "Giày Tennis Adidas Barricade 13",
        "description": "Biểu tượng độ bền và sự ổn định hàng đầu thế giới cho những tay vợt trượt cứu bóng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court",
          "midsole": "REPETITOR",
          "outsole": "Adiwear siêu bền"
        },
        "images": [
          {
            "id": 74,
            "image_url": "/frontend/assets/products/catalog/p074.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 104,
            "sku_code": "TS-C08-P074-A",
            "size": "42",
            "color": "Trắng Đen Đỏ",
            "price": 3690000,
            "sale_price": 3350000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 105,
            "sku_code": "TS-C08-P074-B",
            "size": "40",
            "color": "Trắng Đen Đỏ",
            "price": 3690000,
            "sale_price": 3350000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 75,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 5,
        "name": "Giày Tennis Adidas Adizero Ubersonic 4.1",
        "description": "Tối ưu tốc độ di chuyển nhẹ như bay với phần thân dệt ôm chân như tất.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court",
          "midsole": "Lightstrike",
          "weight": "Siêu nhẹ"
        },
        "images": [
          {
            "id": 75,
            "image_url": "/frontend/assets/products/catalog/p075.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 106,
            "sku_code": "TS-C08-P075-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 3490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 107,
            "sku_code": "TS-C08-P075-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 3490000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 76,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 5,
        "name": "Giày Tennis Adidas CourtJam Control 3",
        "description": "Mức giá dễ tiếp cận với đệm Bounce êm ái và khả năng chống xoắn bàn chân tốt.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court",
          "midsole": "Bounce",
          "torsion": "Torsion System"
        },
        "images": [
          {
            "id": 76,
            "image_url": "/frontend/assets/products/catalog/p076.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 108,
            "sku_code": "TS-C08-P076-A",
            "size": "41",
            "color": "Trắng Navy",
            "price": 2350000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 109,
            "sku_code": "TS-C08-P076-B",
            "size": "42",
            "color": "Trắng Navy",
            "price": 2350000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 77,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 7,
        "name": "Giày Tennis Babolat Jet Mach 3 All Court",
        "description": "Đế cao su hợp tác cùng Michelin siêu bám sân kết hợp vải sợi Kevlar siêu nhẹ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "outsole": "Michelin Premium Rubber",
          "upper": "Matryx EVO"
        },
        "images": [
          {
            "id": 77,
            "image_url": "/frontend/assets/products/catalog/p077.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 110,
            "sku_code": "TS-C08-P077-A",
            "size": "41",
            "color": "Xanh Đen",
            "price": 3550000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 111,
            "sku_code": "TS-C08-P077-B",
            "size": "42",
            "color": "Xanh Đen",
            "price": 3550000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 78,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 7,
        "name": "Giày Tennis Babolat Propulse Fury 3",
        "description": "Khóa chặt cổ chân chắc chắn cho lối chơi di chuyển mạnh mẽ và bùng nổ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "outsole": "Michelin",
          "stability": "Power Belt ôm cổ chân"
        },
        "images": [
          {
            "id": 78,
            "image_url": "/frontend/assets/products/catalog/p078.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 112,
            "sku_code": "TS-C08-P078-A",
            "size": "42",
            "color": "Trắng Đỏ",
            "price": 3390000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 113,
            "sku_code": "TS-C08-P078-B",
            "size": "40",
            "color": "Trắng Đỏ",
            "price": 3390000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 79,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 6,
        "name": "Giày Tennis Wilson Rush Pro 4.0",
        "description": "Khung nâng đỡ 4D giảm xoắn bàn chân và tăng lực đẩy khi bật bước đầu tiên.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "chassis": "4D Support Chassis 2.0",
          "cushion": "Energy Cell EVA"
        },
        "images": [
          {
            "id": 79,
            "image_url": "/frontend/assets/products/catalog/p079.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 114,
            "sku_code": "TS-C08-P079-A",
            "size": "41",
            "color": "Trắng Đỏ Đen",
            "price": 3290000,
            "sale_price": 2990000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 115,
            "sku_code": "TS-C08-P079-B",
            "size": "42",
            "color": "Trắng Đỏ Đen",
            "price": 3290000,
            "sale_price": 2990000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 80,
        "sport_id": 3,
        "category_id": 8,
        "brand_id": 6,
        "name": "Giày Pickleball Wilson Viper Court Pro (Cũ 92%)",
        "description": "Form mũi rộng thoải mái, đế cao su Duralast chuyên sân ngoài trời.",
        "condition_type": "CU",
        "wear_description": "Mới đi 4 buổi tập Pickleball, đế còn mới 92%, thân giày sạch đẹp không rách.",
        "status": "ACTIVE",
        "specifications": {
          "surface": "Hard Court / Pickleball",
          "fit": "Wide Toe Box",
          "condition_grade": "92%"
        },
        "images": [
          {
            "id": 80,
            "image_url": "/frontend/assets/products/catalog/p080.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 116,
            "sku_code": "TS-C08-P080-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 1850000,
            "stock": 1,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 81,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 10,
        "name": "Giày bóng bàn Mizuno Wave Drive 9",
        "description": "Mẫu giày bóng bàn huyền thoại được giới vận động viên tin dùng nhờ độ bám sàn gỗ tuyệt đối.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "outsole": "XG Rubber",
          "midsole": "Mizuno Wave",
          "weight": "255g"
        },
        "images": [
          {
            "id": 81,
            "image_url": "/frontend/assets/products/catalog/p081.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 117,
            "sku_code": "TS-C19-P081-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 2490000,
            "sale_price": 2250000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 118,
            "sku_code": "TS-C19-P081-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 2490000,
            "sale_price": 2250000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 82,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 10,
        "name": "Giày bóng bàn Mizuno Wave Medal 7",
        "description": "Cải tiến đệm Enerzy êm ái hơn, hỗ trợ các bước di chuyển ngang tốc độ cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "MIZUNO ENERZY",
          "stability": "Ổn định bước ngang"
        },
        "images": [
          {
            "id": 82,
            "image_url": "/frontend/assets/products/catalog/p082.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 119,
            "sku_code": "TS-C19-P082-A",
            "size": "41",
            "color": "Trắng Đỏ",
            "price": 2590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 120,
            "sku_code": "TS-C19-P082-B",
            "size": "42",
            "color": "Trắng Đỏ",
            "price": 2590000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 83,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 10,
        "name": "Giày bóng bàn Mizuno Wave Drive Neo 3",
        "description": "Cảm giác chân trần nhạy bén nhất trong dòng giày bóng bàn Mizuno cao cấp.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "Siêu nhẹ",
          "fit": "Sock-like Prime Fit"
        },
        "images": [
          {
            "id": 83,
            "image_url": "/frontend/assets/products/catalog/p083.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 121,
            "sku_code": "TS-C19-P083-A",
            "size": "41",
            "color": "Trắng Đen",
            "price": 2790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 122,
            "sku_code": "TS-C19-P083-B",
            "size": "42",
            "color": "Trắng Đen",
            "price": 2790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 84,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 10,
        "name": "Giày bóng bàn Mizuno Crossmatch Sword",
        "description": "Đế phẳng chống trượt bền bỉ, lựa chọn kinh tế cho người chơi bóng bàn thường xuyên.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "outsole": "Non-marking Rubber",
          "level": "Phong trào / Tập luyện"
        },
        "images": [
          {
            "id": 84,
            "image_url": "/frontend/assets/products/catalog/p084.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 123,
            "sku_code": "TS-C19-P084-A",
            "size": "41",
            "color": "Trắng Navy",
            "price": 1650000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 124,
            "sku_code": "TS-C19-P084-B",
            "size": "42",
            "color": "Trắng Navy",
            "price": 1650000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 85,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 12,
        "name": "Giày bóng bàn Butterfly Lezoline Rifones",
        "description": "Flagship của Butterfly trang bị đầy đủ công nghệ giảm chấn và bám sàn thi đấu chuyên nghiệp.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "cushion": "B-Absorber",
          "outsole": "Wingrip",
          "stability": "STB chống xoắn"
        },
        "images": [
          {
            "id": 85,
            "image_url": "/frontend/assets/products/catalog/p085.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 125,
            "sku_code": "TS-C19-P085-A",
            "size": "41",
            "color": "Đen Trắng",
            "price": 2650000,
            "sale_price": 2390000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 126,
            "sku_code": "TS-C19-P085-B",
            "size": "42",
            "color": "Đen Trắng",
            "price": 2650000,
            "sale_price": 2390000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 86,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 12,
        "name": "Giày bóng bàn Butterfly Lezoline Gigu",
        "description": "Đế dày êm hơn giúp giảm áp lực lên đầu gối và cổ chân trong các buổi tập dài.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "cushion": "Thick B-Absorber",
          "outsole": "Wingrip"
        },
        "images": [
          {
            "id": 86,
            "image_url": "/frontend/assets/products/catalog/p086.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 127,
            "sku_code": "TS-C19-P086-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 2350000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 128,
            "sku_code": "TS-C19-P086-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 2350000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 87,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 12,
        "name": "Giày bóng bàn Butterfly Lezoline Vilata",
        "description": "Thiết kế thanh lịch, nhẹ nhàng và cực kỳ thoáng khí cho người chơi câu lạc bộ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "weight": "Nhẹ linh hoạt",
          "upper": "Mesh thoáng khí"
        },
        "images": [
          {
            "id": 87,
            "image_url": "/frontend/assets/products/catalog/p087.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 129,
            "sku_code": "TS-C19-P087-A",
            "size": "41",
            "color": "Trắng Bạc",
            "price": 1790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 130,
            "sku_code": "TS-C19-P087-B",
            "size": "42",
            "color": "Trắng Bạc",
            "price": 1790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 88,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 2,
        "name": "Giày bóng bàn Lining APPU011",
        "description": "Đế cao su sống bám sàn tốt, form ôm gọn hỗ trợ đổi hướng nhanh.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "outsole": "Non-marking Gum",
          "upper": "Mesh + TPU"
        },
        "images": [
          {
            "id": 88,
            "image_url": "/frontend/assets/products/catalog/p088.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 131,
            "sku_code": "TS-C19-P088-A",
            "size": "41",
            "color": "Trắng Đỏ",
            "price": 1590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 132,
            "sku_code": "TS-C19-P088-B",
            "size": "42",
            "color": "Trắng Đỏ",
            "price": 1590000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 89,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 2,
        "name": "Giày bóng bàn Lining APPT001 Pro",
        "description": "Tích hợp thanh chống xoắn vòm bàn chân PROBAR LOC cùng đệm BOUNSE+ đàn hồi.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "BOUNSE+",
          "stability": "PROBAR LOC"
        },
        "images": [
          {
            "id": 89,
            "image_url": "/frontend/assets/products/catalog/p089.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 133,
            "sku_code": "TS-C19-P089-A",
            "size": "41",
            "color": "Trắng Xanh Dương",
            "price": 1950000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 134,
            "sku_code": "TS-C19-P089-B",
            "size": "42",
            "color": "Trắng Xanh Dương",
            "price": 1950000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 90,
        "sport_id": 6,
        "category_id": 19,
        "brand_id": 1,
        "name": "Giày trong nhà đa năng Yonex Strider Flow",
        "description": "Đôi giày đa năng êm ái dùng tốt cho cả bóng bàn, cầu lông và tập luyện trong nhà.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "midsole": "Power Cushion",
          "outsole": "Radial Blade"
        },
        "images": [
          {
            "id": 90,
            "image_url": "/frontend/assets/products/catalog/p090.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 135,
            "sku_code": "TS-C19-P090-A",
            "size": "41",
            "color": "Trắng Xanh",
            "price": 1690000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 136,
            "sku_code": "TS-C19-P090-B",
            "size": "42",
            "color": "Trắng Xanh",
            "price": 1690000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 91,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 1,
        "name": "Ống quả cầu lông Yonex Aerosensa 50 (AS50)",
        "description": "Chuẩn thi đấu Olympic và các giải BWF World Tour, quỹ đạo bay cực kỳ ổn định.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông ngỗng cao cấp",
          "speed": "77",
          "standard": "BWF Approved"
        },
        "images": [
          {
            "id": 91,
            "image_url": "/frontend/assets/products/catalog/p091.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 137,
            "sku_code": "TS-C10-P091-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 890000,
            "sale_price": 840000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 92,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 1,
        "name": "Ống quả cầu lông Yonex Aerosensa 40 (AS40)",
        "description": "Độ bền lông cao, cảm giác cầu đầm tay cho các trận đấu phong trào trình độ khá.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông ngỗng chọn lọc",
          "speed": "77"
        },
        "images": [
          {
            "id": 92,
            "image_url": "/frontend/assets/products/catalog/p092.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 138,
            "sku_code": "TS-C10-P092-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 790000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 93,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 1,
        "name": "Ống quả cầu lông Yonex Aerosensa 30 (AS30)",
        "description": "Lựa chọn bán chạy hàng đầu tại các câu lạc bộ cầu lông chuyên nghiệp.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông ngỗng tự nhiên",
          "speed": "77"
        },
        "images": [
          {
            "id": 93,
            "image_url": "/frontend/assets/products/catalog/p093.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 139,
            "sku_code": "TS-C10-P093-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 720000,
            "sale_price": 680000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 94,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 1,
        "name": "Ống quả cầu lông Yonex Aerosensa 20 (AS20)",
        "description": "Bay đều, ít tưa lông khi đánh đôi cường độ cao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông vũ tự nhiên",
          "speed": "77"
        },
        "images": [
          {
            "id": 94,
            "image_url": "/frontend/assets/products/catalog/p094.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 140,
            "sku_code": "TS-C10-P094-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 650000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 95,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 1,
        "name": "Ống quả cầu lông Yonex Mavis 350 (Cầu nhựa)",
        "description": "Cầu nhựa siêu bền với tốc độ phục hồi tương đương cầu lông vũ, lý tưởng cho tập luyện.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Nylon cao cấp",
          "speed": "Medium (Xanh dương)"
        },
        "images": [
          {
            "id": 95,
            "image_url": "/frontend/assets/products/catalog/p095.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 141,
            "sku_code": "TS-C10-P095-A",
            "size": "Ống 6 quả",
            "color": "Vàng",
            "price": 350000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 6,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 96,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 3,
        "name": "Ống quả cầu lông Victor Master Ace",
        "description": "Dòng cầu cao cấp nhất của Victor dùng tại nhiều giải đấu quốc tế.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông ngỗng loại 1",
          "standard": "BWF Approved"
        },
        "images": [
          {
            "id": 96,
            "image_url": "/frontend/assets/products/catalog/p096.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 142,
            "sku_code": "TS-C10-P096-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 760000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 97,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 3,
        "name": "Ống quả cầu lông Victor Champion No.1",
        "description": "Cân bằng tuyệt vời giữa độ bền và cảm giác cầu, rất phổ biến tại Việt Nam.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông vịt tuyển chọn",
          "speed": "77"
        },
        "images": [
          {
            "id": 97,
            "image_url": "/frontend/assets/products/catalog/p097.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 143,
            "sku_code": "TS-C10-P097-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 560000,
            "sale_price": 520000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 98,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 3,
        "name": "Ống quả cầu lông Victor Lark 5",
        "description": "Đế bần ghép chắc chắn, chịu đập tốt phù hợp cho giao lưu câu lạc bộ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông vịt bền bỉ",
          "speed": "77"
        },
        "images": [
          {
            "id": 98,
            "image_url": "/frontend/assets/products/catalog/p098.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 144,
            "sku_code": "TS-C10-P098-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 460000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 99,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 2,
        "name": "Ống quả cầu lông Lining A+300",
        "description": "Cầu thi đấu cao cấp của Li-Ning với độ ổn định quỹ đạo và độ bền vượt trội.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông ngỗng cao cấp",
          "standard": "BWF Approved"
        },
        "images": [
          {
            "id": 99,
            "image_url": "/frontend/assets/products/catalog/p099.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 145,
            "sku_code": "TS-C10-P099-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 750000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 100,
        "sport_id": 1,
        "category_id": 10,
        "brand_id": 2,
        "name": "Ống quả cầu lông Lining A+90",
        "description": "Đường cầu đầm chắc, thích hợp chơi trong nhà thi đấu có gió nhẹ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Lông vịt chọn lọc",
          "speed": "77"
        },
        "images": [
          {
            "id": 100,
            "image_url": "/frontend/assets/products/catalog/p100.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 146,
            "sku_code": "TS-C10-P100-A",
            "size": "Ống 12 quả",
            "color": "Trắng",
            "price": 590000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 101,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 4,
        "name": "Quả bóng đá Nike Flight Premier League Match Ball",
        "description": "Bóng thi đấu chính thức giải Ngoại Hạng Anh với rãnh khí động học giảm liệng gió 30%.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "tech": "Aerowsculpt",
          "standard": "FIFA Quality Pro"
        },
        "images": [
          {
            "id": 101,
            "image_url": "/frontend/assets/products/catalog/p101.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 147,
            "sku_code": "TS-C11-P101-A",
            "size": "Size 5",
            "color": "Trắng Vàng Tím",
            "price": 3200000,
            "sale_price": 2890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 102,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 4,
        "name": "Quả bóng đá Nike Academy Premier League",
        "description": "Vỏ bóng có rãnh định hướng ổn định cùng ruột cao su giữ hơi cực lâu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "tech": "Nike Aerowsculpt",
          "use": "Tập luyện & Thi đấu"
        },
        "images": [
          {
            "id": 102,
            "image_url": "/frontend/assets/products/catalog/p102.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 148,
            "sku_code": "TS-C11-P102-A",
            "size": "Size 5",
            "color": "Trắng Cam",
            "price": 890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 103,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 4,
        "name": "Quả bóng đá Nike Pitch Training",
        "description": "Thiết kế họa tiết tương phản cao dễ quan sát bóng khi đá buổi tối trên sân nhân tạo.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "construction": "12 miếng khâu máy"
        },
        "images": [
          {
            "id": 103,
            "image_url": "/frontend/assets/products/catalog/p103.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 149,
            "sku_code": "TS-C11-P103-A",
            "size": "Size 5",
            "color": "Trắng Xanh",
            "price": 590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 104,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 5,
        "name": "Quả bóng đá Adidas UCL Pro Match Ball",
        "description": "Bóng thi đấu chính thức UEFA Champions League với hoa văn ngôi sao kinh điển.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "construction": "Ép nhiệt không đường may",
          "standard": "FIFA Quality Pro"
        },
        "images": [
          {
            "id": 104,
            "image_url": "/frontend/assets/products/catalog/p104.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 150,
            "sku_code": "TS-C11-P104-A",
            "size": "Size 5",
            "color": "Trắng Ngôi Sao",
            "price": 3450000,
            "sale_price": 3150000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 105,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 5,
        "name": "Quả bóng đá Adidas Al Rihla Pro World Cup",
        "description": "Cấu trúc 20 miếng ép nhiệt cho quỹ đạo bay cực nhanh và chính xác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "tech": "CRT-CORE + Speedshell",
          "standard": "FIFA Quality Pro"
        },
        "images": [
          {
            "id": 105,
            "image_url": "/frontend/assets/products/catalog/p105.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 151,
            "sku_code": "TS-C11-P105-A",
            "size": "Size 5",
            "color": "Trắng Đa Sắc",
            "price": 3290000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 106,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 5,
        "name": "Quả bóng đá Adidas Fussballliebe Euro 2024 Pro",
        "description": "Bóng thi đấu chính thức Euro 2024 với bề mặt vân nổi tăng độ kiểm soát.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "tech": "PRECISIONSHELL",
          "standard": "FIFA Quality Pro"
        },
        "images": [
          {
            "id": 106,
            "image_url": "/frontend/assets/products/catalog/p106.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 152,
            "sku_code": "TS-C11-P106-A",
            "size": "Size 5",
            "color": "Trắng Đen Đa Sắc",
            "price": 3390000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 107,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 5,
        "name": "Quả bóng đá Adidas Tiro League Thermally Bonded",
        "description": "Bóng ép nhiệt không ngấm nước khi trời mưa, độ nảy cực kỳ chuẩn xác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "construction": "Ép nhiệt chống thấm nước",
          "standard": "IMS Certified"
        },
        "images": [
          {
            "id": 107,
            "image_url": "/frontend/assets/products/catalog/p107.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 153,
            "sku_code": "TS-C11-P107-A",
            "size": "Size 5",
            "color": "Trắng Đen",
            "price": 1050000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 108,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 11,
        "name": "Quả bóng đá Kamito KMB Pro Size 5",
        "description": "Da PU mềm êm chân, chịu mài mòn tốt trên mặt cỏ nhân tạo và sân 7.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "material": "Da PU cao cấp",
          "use": "Sân cỏ nhân tạo"
        },
        "images": [
          {
            "id": 108,
            "image_url": "/frontend/assets/products/catalog/p108.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 154,
            "sku_code": "TS-C11-P108-A",
            "size": "Size 5",
            "color": "Trắng Xanh Đỏ",
            "price": 520000,
            "sale_price": 470000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 109,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 11,
        "name": "Quả bóng đá Kamito Futsal Size 4",
        "description": "Chuyên dụng cho sân 5 và sàn gỗ Futsal với độ nảy đầm dễ xử lý kỹ thuật.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 4 (Futsal)",
          "bounce": "Độ nảy thấp chuẩn Futsal"
        },
        "images": [
          {
            "id": 109,
            "image_url": "/frontend/assets/products/catalog/p109.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 155,
            "sku_code": "TS-C11-P109-A",
            "size": "Size 4",
            "color": "Trắng Cam",
            "price": 490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 110,
        "sport_id": 2,
        "category_id": 11,
        "brand_id": 5,
        "name": "Quả bóng đá Adidas Conext 24 League",
        "description": "Cấu trúc không đường may TSBE giúp chạm bóng mượt và hạn chế thấm nước.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "size": "Size 5",
          "construction": "TSBE Seamless",
          "standard": "FIFA Quality"
        },
        "images": [
          {
            "id": 110,
            "image_url": "/frontend/assets/products/catalog/p110.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 156,
            "sku_code": "TS-C11-P110-A",
            "size": "Size 5",
            "color": "Trắng Đỏ Đen",
            "price": 980000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 111,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 6,
        "name": "Lon bóng Tennis Wilson US Open Extra Duty (3 quả)",
        "description": "Bóng thi đấu chính thức giải Grand Slam US Open, nỉ dày cực bền trên sân cứng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "felt": "Tex/Tech Extra Duty",
          "standard": "ITF & USTA Approved"
        },
        "images": [
          {
            "id": 111,
            "image_url": "/frontend/assets/products/catalog/p111.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 157,
            "sku_code": "TS-C12-P111-A",
            "size": "Lon 3 quả",
            "color": "Vàng Chanh",
            "price": 195000,
            "sale_price": 179000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 112,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 6,
        "name": "Lon bóng Tennis Wilson Roland Garros All Court (4 quả)",
        "description": "Bóng thi đấu giải Pháp Mở Rộng với lõi giữ áp suất cao và độ nảy đồng đều.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "felt": "All Court Felt",
          "standard": "ITF Approved"
        },
        "images": [
          {
            "id": 112,
            "image_url": "/frontend/assets/products/catalog/p112.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 158,
            "sku_code": "TS-C12-P112-A",
            "size": "Lon 4 quả",
            "color": "Vàng Chanh",
            "price": 245000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 113,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 6,
        "name": "Lon bóng Tennis Wilson Championship Extra Duty (3 quả)",
        "description": "Dòng bóng phổ thông bán chạy nhất của Wilson, giữ hơi tốt và giá hợp lý.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "felt": "Dura-Weave Felt",
          "use": "Tập luyện & Thi đấu phong trào"
        },
        "images": [
          {
            "id": 113,
            "image_url": "/frontend/assets/products/catalog/p113.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 159,
            "sku_code": "TS-C12-P113-A",
            "size": "Lon 3 quả",
            "color": "Vàng Chanh",
            "price": 165000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 114,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 6,
        "name": "Lon bóng Tennis Wilson Triniti Pro (4 quả)",
        "description": "Lõi đàn hồi tiên tiến giúp bóng tươi mới lâu gấp 4 lần bóng nén khí thông thường.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "core": "Engage Core (Hộp giấy sinh thái)",
          "durability": "Giữ độ nảy lâu gấp 4 lần"
        },
        "images": [
          {
            "id": 114,
            "image_url": "/frontend/assets/products/catalog/p114.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 160,
            "sku_code": "TS-C12-P114-A",
            "size": "Lon 4 quả",
            "color": "Vàng Chanh",
            "price": 255000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 115,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 7,
        "name": "Lon bóng Tennis Babolat Gold Championship (4 quả)",
        "description": "Cảm giác đánh êm tay, lớp nỉ dệt chặt hạn chế xù lông nhanh.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "All Court",
          "standard": "ITF Approved"
        },
        "images": [
          {
            "id": 115,
            "image_url": "/frontend/assets/products/catalog/p115.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 161,
            "sku_code": "TS-C12-P115-A",
            "size": "Lon 4 quả",
            "color": "Vàng Chanh",
            "price": 220000,
            "sale_price": 199000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 116,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 7,
        "name": "Lon bóng Tennis Babolat Team All Court (4 quả)",
        "description": "Bóng nén áp suất cao kết hợp độ bền ấn tượng cho các trận đánh đơn kéo dài.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "felt": "Extra Feel Felt",
          "standard": "ITF Approved"
        },
        "images": [
          {
            "id": 116,
            "image_url": "/frontend/assets/products/catalog/p116.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 162,
            "sku_code": "TS-C12-P116-A",
            "size": "Lon 4 quả",
            "color": "Vàng Chanh",
            "price": 235000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 117,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 7,
        "name": "Lon bóng Tennis Babolat Gold Academy (3 quả)",
        "description": "Lý tưởng cho huấn luyện viên và học viên tập luyện nhiều giờ liên tục.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "type": "Bóng không áp suất bền bỉ",
          "use": "Luyện tập giỏ bóng"
        },
        "images": [
          {
            "id": 117,
            "image_url": "/frontend/assets/products/catalog/p117.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 163,
            "sku_code": "TS-C12-P117-A",
            "size": "Lon 3 quả",
            "color": "Vàng Chanh",
            "price": 155000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 118,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 1,
        "name": "Lon bóng Tennis Yonex Tour Platinum (4 quả)",
        "description": "Bóng cao cấp nhất của Yonex với nỉ len dệt dày cho cảm giác bóng êm và chính xác.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "felt": "Woven Wool Felt",
          "standard": "ITF Approved"
        },
        "images": [
          {
            "id": 118,
            "image_url": "/frontend/assets/products/catalog/p118.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 164,
            "sku_code": "TS-C12-P118-A",
            "size": "Lon 4 quả",
            "color": "Vàng Chanh",
            "price": 260000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 119,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 1,
        "name": "Lon bóng Tennis Yonex Championship (3 quả)",
        "description": "Độ nảy ổn định, dễ kiểm soát trên nhiều loại mặt sân khác nhau.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "surface": "All Court",
          "standard": "ITF Approved"
        },
        "images": [
          {
            "id": 119,
            "image_url": "/frontend/assets/products/catalog/p119.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 165,
            "sku_code": "TS-C12-P119-A",
            "size": "Lon 3 quả",
            "color": "Vàng Chanh",
            "price": 175000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 120,
        "sport_id": 3,
        "category_id": 12,
        "brand_id": 6,
        "name": "Lon bóng Tennis Wilson Starter Red (3 quả - Trẻ em)",
        "description": "Bóng xốp nhẹ tốc độ chậm giúp trẻ em dễ dàng làm quen kỹ thuật đánh bóng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "speed": "Chậm hơn 75%",
          "use": "Trẻ em & Người mới tập"
        },
        "images": [
          {
            "id": 120,
            "image_url": "/frontend/assets/products/catalog/p120.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 166,
            "sku_code": "TS-C12-P120-A",
            "size": "Lon 3 quả",
            "color": "Đỏ Vàng",
            "price": 160000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 121,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 9,
        "name": "Hộp 3 quả bóng Pickleball Joola Primo Outdoor",
        "description": "Bóng thi đấu ngoài trời 40 lỗ chuẩn xác, bay ổn định trước gió.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "40 lỗ khoan",
          "standard": "USAPA Approved",
          "use": "Ngoài trời"
        },
        "images": [
          {
            "id": 121,
            "image_url": "/frontend/assets/products/catalog/p121.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 167,
            "sku_code": "TS-C13-P121-A",
            "size": "Hộp 3 quả",
            "color": "Vàng Neon",
            "price": 250000,
            "sale_price": 229000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 122,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 9,
        "name": "Hộp 4 quả bóng Pickleball Joola Heleus Outdoor",
        "description": "Công nghệ đúc nguyên khối hạn chế nứt vỡ khi đánh mạnh liên tục.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "40 lỗ đúc nguyên khối",
          "standard": "USAPA Approved"
        },
        "images": [
          {
            "id": 122,
            "image_url": "/frontend/assets/products/catalog/p122.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 168,
            "sku_code": "TS-C13-P122-A",
            "size": "Hộp 4 quả",
            "color": "Vàng Chanh",
            "price": 340000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 123,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 9,
        "name": "Hộp 12 quả bóng Pickleball Joola Primo Pack",
        "description": "Gói tiết kiệm 12 quả chính hãng Joola cho câu lạc bộ và nhóm chơi thường xuyên.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "40 lỗ",
          "quantity": "12 quả / hộp"
        },
        "images": [
          {
            "id": 123,
            "image_url": "/frontend/assets/products/catalog/p123.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 169,
            "sku_code": "TS-C13-P123-A",
            "size": "Hộp 12 quả",
            "color": "Vàng Neon",
            "price": 890000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 124,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 9,
        "name": "Hộp 3 quả bóng Pickleball Joola Indoor 26 lỗ",
        "description": "Thiết kế 26 lỗ lớn hơn giúp kiểm soát bóng tốt trên mặt sàn gỗ/nhựa trong nhà.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "26 lỗ",
          "use": "Sân trong nhà"
        },
        "images": [
          {
            "id": 124,
            "image_url": "/frontend/assets/products/catalog/p124.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 170,
            "sku_code": "TS-C13-P124-A",
            "size": "Hộp 3 quả",
            "color": "Cam Neon",
            "price": 230000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 125,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 8,
        "name": "Hộp 4 quả bóng Pickleball Selkirk Pro S1",
        "description": "Nổi tiếng với độ bền hàng đầu thị trường và quỹ đạo bay nhất quán.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "38 lỗ chuẩn lực",
          "durability": "Chống nứt vượt trội"
        },
        "images": [
          {
            "id": 125,
            "image_url": "/frontend/assets/products/catalog/p125.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 171,
            "sku_code": "TS-C13-P125-A",
            "size": "Hộp 4 quả",
            "color": "Vàng Chanh",
            "price": 350000,
            "sale_price": 319000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 4,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 126,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 8,
        "name": "Hộp 12 quả bóng Pickleball Selkirk Pro S1",
        "description": "Quy cách 12 quả tiết kiệm dành cho các buổi luyện tập và giải đấu phong trào.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "38 lỗ",
          "quantity": "12 quả / hộp"
        },
        "images": [
          {
            "id": 126,
            "image_url": "/frontend/assets/products/catalog/p126.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 172,
            "sku_code": "TS-C13-P126-A",
            "size": "Hộp 12 quả",
            "color": "Vàng Chanh",
            "price": 950000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 127,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 8,
        "name": "Hộp 3 quả bóng Pickleball Selkirk SLK Hybrid+",
        "description": "Dòng bóng đa năng chơi ổn định cả trên sân ngoài trời lẫn nhà thi đấu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "40 lỗ",
          "use": "Trong nhà & Ngoài trời"
        },
        "images": [
          {
            "id": 127,
            "image_url": "/frontend/assets/products/catalog/p127.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 173,
            "sku_code": "TS-C13-P127-A",
            "size": "Hộp 3 quả",
            "color": "Xanh Vàng",
            "price": 240000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 128,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 8,
        "name": "Túi 100 quả bóng Pickleball Selkirk Pro S1 Bucket",
        "description": "Giải pháp tối ưu cho học viện và cụm sân Pickleball chuyên nghiệp.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "38 lỗ",
          "quantity": "100 quả / thùng"
        },
        "images": [
          {
            "id": 128,
            "image_url": "/frontend/assets/products/catalog/p128.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 174,
            "sku_code": "TS-C13-P128-A",
            "size": "Thùng 100 quả",
            "color": "Vàng Chanh",
            "price": 6800000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 100,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 129,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 11,
        "name": "Hộp 3 quả bóng Pickleball Kamito Outdoor 40 lỗ",
        "description": "Đạt chuẩn kích thước và trọng lượng thi đấu với mức giá cực kỳ kinh tế.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "40 lỗ",
          "diameter": "74mm",
          "weight": "26g"
        },
        "images": [
          {
            "id": 129,
            "image_url": "/frontend/assets/products/catalog/p129.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 175,
            "sku_code": "TS-C13-P129-A",
            "size": "Hộp 3 quả",
            "color": "Vàng Neon",
            "price": 180000,
            "sale_price": 159000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 130,
        "sport_id": 4,
        "category_id": 13,
        "brand_id": 11,
        "name": "Hộp 6 quả bóng Pickleball Kamito Pro Training",
        "description": "Nhựa TPE đàn hồi dẻo dai, ít biến dạng khi thi đấu dưới nắng nóng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "holes": "40 lỗ",
          "quantity": "6 quả / hộp"
        },
        "images": [
          {
            "id": 130,
            "image_url": "/frontend/assets/products/catalog/p130.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 176,
            "sku_code": "TS-C13-P130-A",
            "size": "Hộp 6 quả",
            "color": "Vàng Cam",
            "price": 330000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 6,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 131,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 13,
        "name": "Hộp 10 quả bóng bàn DHS D40+ 3 sao ITTF",
        "description": "Bóng thi đấu phổ biến nhất thế giới với độ tròn chuẩn xác và độ nảy đồng nhất.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "grade": "3 Sao ITTF Approved"
        },
        "images": [
          {
            "id": 131,
            "image_url": "/frontend/assets/products/catalog/p131.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 177,
            "sku_code": "TS-C20-P131-A",
            "size": "Hộp 10 quả",
            "color": "Trắng",
            "price": 195000,
            "sale_price": 179000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 10,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 132,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 13,
        "name": "Hộp 6 quả bóng bàn DHS DJ40+ WTT 3 sao",
        "description": "Phiên bản bóng thi đấu chính thức tại các giải World Table Tennis (WTT).",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS cao cấp",
          "standard": "WTT Official Match Ball"
        },
        "images": [
          {
            "id": 132,
            "image_url": "/frontend/assets/products/catalog/p132.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 178,
            "sku_code": "TS-C20-P132-A",
            "size": "Hộp 6 quả",
            "color": "Trắng",
            "price": 240000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 6,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 133,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 13,
        "name": "Hộp 6 quả bóng bàn DHS RS40+ 3 sao",
        "description": "Vỏ bóng dày dặn chống móp méo tốt, âm thanh chạm vợt giòn rõ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "grade": "3 Sao ITTF"
        },
        "images": [
          {
            "id": 133,
            "image_url": "/frontend/assets/products/catalog/p133.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 179,
            "sku_code": "TS-C20-P133-A",
            "size": "Hộp 6 quả",
            "color": "Trắng",
            "price": 165000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 6,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 134,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 13,
        "name": "Hộp 100 quả bóng bàn tập luyện DHS 1 sao 40+",
        "description": "Chuyên dụng cho tập nhiều bóng và máy bắn bóng tại các câu lạc bộ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "quantity": "100 quả / hộp"
        },
        "images": [
          {
            "id": 134,
            "image_url": "/frontend/assets/products/catalog/p134.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 180,
            "sku_code": "TS-C20-P134-A",
            "size": "Hộp 100 quả",
            "color": "Trắng",
            "price": 690000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 100,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 135,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 12,
        "name": "Hộp 3 quả bóng bàn Butterfly R40+ 3 sao ITTF",
        "description": "Độ cân bằng tuyệt hảo và độ nảy ổn định cao chuẩn giải đấu chuyên nghiệp.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "origin": "Trung Quốc (Chuẩn Nhật)",
          "grade": "3 Sao ITTF"
        },
        "images": [
          {
            "id": 135,
            "image_url": "/frontend/assets/products/catalog/p135.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 181,
            "sku_code": "TS-C20-P135-A",
            "size": "Hộp 3 quả",
            "color": "Trắng",
            "price": 135000,
            "sale_price": 120000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 136,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 12,
        "name": "Hộp 12 quả bóng bàn Butterfly R40+ 3 sao",
        "description": "Hộp 12 quả chính hãng Butterfly giúp tiết kiệm chi phí cho đội tuyển.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "quantity": "12 quả / hộp"
        },
        "images": [
          {
            "id": 136,
            "image_url": "/frontend/assets/products/catalog/p136.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 182,
            "sku_code": "TS-C20-P136-A",
            "size": "Hộp 12 quả",
            "color": "Trắng",
            "price": 490000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 12,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 137,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 12,
        "name": "Hộp 3 quả bóng bàn Butterfly A40+ 3 sao",
        "description": "Bề mặt bóng mịn đều giúp tạo xoáy chuẩn xác trong từng pha giao bóng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "grade": "3 Sao ITTF"
        },
        "images": [
          {
            "id": 137,
            "image_url": "/frontend/assets/products/catalog/p137.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 183,
            "sku_code": "TS-C20-P137-A",
            "size": "Hộp 3 quả",
            "color": "Trắng",
            "price": 145000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 3,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 138,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 12,
        "name": "Hộp 6 quả bóng bàn tập luyện Butterfly Training 40+",
        "description": "Độ bền cao và cảm giác gần sát bóng thi đấu 3 sao.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "use": "Tập luyện câu lạc bộ"
        },
        "images": [
          {
            "id": 138,
            "image_url": "/frontend/assets/products/catalog/p138.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 184,
            "sku_code": "TS-C20-P138-A",
            "size": "Hộp 6 quả",
            "color": "Trắng",
            "price": 110000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 6,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 139,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 2,
        "name": "Hộp 6 quả bóng bàn Lining 3 sao 40+ ITTF",
        "description": "Bóng nhựa ABS không đường may cho quỹ đạo bay mượt mà ổn định.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "grade": "3 Sao ITTF"
        },
        "images": [
          {
            "id": 139,
            "image_url": "/frontend/assets/products/catalog/p139.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 185,
            "sku_code": "TS-C20-P139-A",
            "size": "Hộp 6 quả",
            "color": "Trắng",
            "price": 155000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 6,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 140,
        "sport_id": 6,
        "category_id": 20,
        "brand_id": 13,
        "name": "Hộp 10 quả bóng bàn DHS D40+ 3 sao màu Cam",
        "description": "Màu cam dễ nhìn hơn trong phòng tập ánh sáng trắng hoặc tường sáng màu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "diameter": "40+ ABS",
          "color": "Cam nổi bật"
        },
        "images": [
          {
            "id": 140,
            "image_url": "/frontend/assets/products/catalog/p140.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 186,
            "sku_code": "TS-C20-P140-A",
            "size": "Hộp 10 quả",
            "color": "Cam",
            "price": 205000,
            "stock": 18,
            "unit": "LO",
            "quantity_per_lot": 10,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 141,
        "sport_id": 1,
        "category_id": 15,
        "brand_id": 1,
        "name": "Áo cầu lông Yonex Tournament Pro 10519",
        "description": "Công nghệ VeryCOOL chứa Xylitol tự nhiên giúp làm mát cơ thể tức thì khi thi đấu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "100% Polyester",
          "tech": "VeryCOOL Dry giảm 3°C"
        },
        "images": [
          {
            "id": 141,
            "image_url": "/frontend/assets/products/catalog/p141.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 187,
            "sku_code": "TS-C15-P141-A",
            "size": "L",
            "color": "Trắng Đỏ",
            "price": 690000,
            "sale_price": 590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 188,
            "sku_code": "TS-C15-P141-B",
            "size": "XL",
            "color": "Trắng Đỏ",
            "price": 690000,
            "sale_price": 590000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 142,
        "sport_id": 1,
        "category_id": 15,
        "brand_id": 1,
        "name": "Áo cầu lông Yonex National Team 2024",
        "description": "Form áo thi đấu đội tuyển thoáng khí, đường may raglan hỗ trợ vung tay linh hoạt.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Polyester co giãn 4 chiều",
          "tech": "UV Reduction + Sweat Absorbent"
        },
        "images": [
          {
            "id": 142,
            "image_url": "/frontend/assets/products/catalog/p142.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 189,
            "sku_code": "TS-C15-P142-A",
            "size": "L",
            "color": "Xanh Navy",
            "price": 750000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 190,
            "sku_code": "TS-C15-P142-B",
            "size": "XL",
            "color": "Xanh Navy",
            "price": 750000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 143,
        "sport_id": 1,
        "category_id": 15,
        "brand_id": 2,
        "name": "Áo cầu lông Lining AAYT015 Dry-Fit",
        "description": "Vải siêu nhẹ nhanh khô giúp cơ thể luôn thoải mái trong suốt set đấu căng thẳng.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Polyester",
          "tech": "AT DRY thấm hút nhanh"
        },
        "images": [
          {
            "id": 143,
            "image_url": "/frontend/assets/products/catalog/p143.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 191,
            "sku_code": "TS-C15-P143-A",
            "size": "L",
            "color": "Đỏ Đen",
            "price": 550000,
            "sale_price": 490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 192,
            "sku_code": "TS-C15-P143-B",
            "size": "XL",
            "color": "Đỏ Đen",
            "price": 550000,
            "sale_price": 490000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 144,
        "sport_id": 1,
        "category_id": 15,
        "brand_id": 3,
        "name": "Áo cầu lông Victor T-40005 Competition",
        "description": "Họa tiết hình học năng động, thấm hút mồ hôi nhanh và không bết dính da.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "100% Recycled Polyester",
          "tech": "PerfectDRY"
        },
        "images": [
          {
            "id": 144,
            "image_url": "/frontend/assets/products/catalog/p144.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 193,
            "sku_code": "TS-C15-P144-A",
            "size": "L",
            "color": "Trắng Xanh",
            "price": 590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 194,
            "sku_code": "TS-C15-P144-B",
            "size": "XL",
            "color": "Trắng Xanh",
            "price": 590000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 145,
        "sport_id": 2,
        "category_id": 15,
        "brand_id": 4,
        "name": "Áo đấu bóng đá Nike Dri-FIT Strike Jersey",
        "description": "Áo tập luyện và thi đấu bóng đá chính hãng Nike với lưới thoát khí dọc hai bên sườn.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "100% Polyester",
          "tech": "Nike Dri-FIT"
        },
        "images": [
          {
            "id": 145,
            "image_url": "/frontend/assets/products/catalog/p145.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 195,
            "sku_code": "TS-C15-P145-A",
            "size": "L",
            "color": "Xanh Đen",
            "price": 950000,
            "sale_price": 850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 196,
            "sku_code": "TS-C15-P145-B",
            "size": "XL",
            "color": "Xanh Đen",
            "price": 950000,
            "sale_price": 850000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 146,
        "sport_id": 2,
        "category_id": 15,
        "brand_id": 4,
        "name": "Áo bóng đá Nike Chelsea Home 2024/25",
        "description": "Phiên bản sân nhà chính hãng với họa tiết sóng nước đặc trưng và vải thoáng khí.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Dri-FIT ADV",
          "fit": "Stadium Fit"
        },
        "images": [
          {
            "id": 146,
            "image_url": "/frontend/assets/products/catalog/p146.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 197,
            "sku_code": "TS-C15-P146-A",
            "size": "L",
            "color": "Xanh Dương",
            "price": 1890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 198,
            "sku_code": "TS-C15-P146-B",
            "size": "XL",
            "color": "Xanh Dương",
            "price": 1890000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 147,
        "sport_id": 2,
        "category_id": 15,
        "brand_id": 5,
        "name": "Áo đấu bóng đá Adidas Real Madrid Home 2024/25",
        "description": "Thiết kế trắng cổ điển thanh lịch của đội bóng Hoàng Gia với công nghệ hút ẩm AEROREADY.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "100% Recycled Polyester",
          "tech": "AEROREADY"
        },
        "images": [
          {
            "id": 147,
            "image_url": "/frontend/assets/products/catalog/p147.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 199,
            "sku_code": "TS-C15-P147-A",
            "size": "L",
            "color": "Trắng Đen",
            "price": 1950000,
            "sale_price": 1790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 200,
            "sku_code": "TS-C15-P147-B",
            "size": "XL",
            "color": "Trắng Đen",
            "price": 1950000,
            "sale_price": 1790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 148,
        "sport_id": 2,
        "category_id": 15,
        "brand_id": 5,
        "name": "Áo thể thao Adidas Tiro 24 Training Jersey",
        "description": "3 sọc đặc trưng dọc vai, form dáng thể thao hiện đại phù hợp mọi môn vận động.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Polyester Interlock",
          "tech": "AEROREADY"
        },
        "images": [
          {
            "id": 148,
            "image_url": "/frontend/assets/products/catalog/p148.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 201,
            "sku_code": "TS-C15-P148-A",
            "size": "L",
            "color": "Đen Trắng",
            "price": 790000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 202,
            "sku_code": "TS-C15-P148-B",
            "size": "XL",
            "color": "Đen Trắng",
            "price": 790000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 149,
        "sport_id": 2,
        "category_id": 15,
        "brand_id": 11,
        "name": "Bộ quần áo bóng đá Kamito Galaxy",
        "description": "Vải mè kim thoáng mát, in chuyển nhiệt sắc nét không bong tróc khi giặt máy.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Vải mè thể thao cao cấp",
          "fit": "Form Việt Nam"
        },
        "images": [
          {
            "id": 149,
            "image_url": "/frontend/assets/products/catalog/p149.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 203,
            "sku_code": "TS-C15-P149-A",
            "size": "L",
            "color": "Xanh Ngọc",
            "price": 320000,
            "sale_price": 279000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 204,
            "sku_code": "TS-C15-P149-B",
            "size": "XL",
            "color": "Xanh Ngọc",
            "price": 320000,
            "sale_price": 279000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 150,
        "sport_id": 1,
        "category_id": 15,
        "brand_id": 1,
        "name": "Quần short cầu lông Yonex 15140 Pro",
        "description": "Cạp chun êm ái, túi quần sâu giữ bóng chắc chắn cho cả cầu lông và tennis.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "material": "Polyester co giãn",
          "tech": "VeryCOOL + Túi sâu"
        },
        "images": [
          {
            "id": 150,
            "image_url": "/frontend/assets/products/catalog/p150.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 205,
            "sku_code": "TS-C15-P150-A",
            "size": "L",
            "color": "Đen",
            "price": 480000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          },
          {
            "id": 206,
            "sku_code": "TS-C15-P150-B",
            "size": "XL",
            "color": "Đen",
            "price": 480000,
            "stock": 12,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 151,
        "sport_id": 1,
        "category_id": 16,
        "brand_id": 1,
        "name": "Túi vợt cầu lông Yonex Pro Tournament 92431W",
        "description": "Dáng túi chữ nhật cứng cáp chuyên nghiệp với lớp lót cách nhiệt bảo vệ cước vợt.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "6-9 cây vợt",
          "material": "Polyester + PU chống nước",
          "compartments": "2 ngăn lớn + ngăn giày"
        },
        "images": [
          {
            "id": 151,
            "image_url": "/frontend/assets/products/catalog/p151.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 207,
            "sku_code": "TS-C16-P151-A",
            "size": "6-9 vợt",
            "color": "Xanh Đen",
            "price": 1650000,
            "sale_price": 1490000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 152,
        "sport_id": 1,
        "category_id": 16,
        "brand_id": 1,
        "name": "Balo cầu lông Yonex Pro Backpack B 92412",
        "description": "Balo đa năng gọn nhẹ có ngăn đựng giày thông gió dưới đáy và quai đeo êm vai.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "2-3 cây vợt + ngăn giày riêng",
          "dimensions": "31 x 20 x 47 cm"
        },
        "images": [
          {
            "id": 152,
            "image_url": "/frontend/assets/products/catalog/p152.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 208,
            "sku_code": "TS-C16-P152-A",
            "size": "2-3 vợt",
            "color": "Đen Xanh",
            "price": 1450000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 153,
        "sport_id": 1,
        "category_id": 16,
        "brand_id": 2,
        "name": "Túi vợt cầu lông Lining ABJT059 6 ngăn",
        "description": "Chất liệu da PU trượt nước dễ vệ sinh, ngăn chứa rộng rãi cho cả ống cầu và quần áo.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "6 cây vợt",
          "lining": "Lớp bạc cách nhiệt Thermo"
        },
        "images": [
          {
            "id": 153,
            "image_url": "/frontend/assets/products/catalog/p153.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 209,
            "sku_code": "TS-C16-P153-A",
            "size": "6 vợt",
            "color": "Đen Vàng",
            "price": 1390000,
            "sale_price": 1250000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 154,
        "sport_id": 1,
        "category_id": 16,
        "brand_id": 2,
        "name": "Balo cầu lông Lining ABSU387",
        "description": "Phong cách tối giản thanh lịch, dùng linh hoạt từ văn phòng ra thẳng sân cầu.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "2 cây vợt + ngăn laptop 15.6 inch"
        },
        "images": [
          {
            "id": 154,
            "image_url": "/frontend/assets/products/catalog/p154.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 210,
            "sku_code": "TS-C16-P154-A",
            "size": "2 vợt",
            "color": "Trắng Đen",
            "price": 1190000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 155,
        "sport_id": 1,
        "category_id": 16,
        "brand_id": 3,
        "name": "Túi vợt cầu lông Victor BR9613 Rectangular",
        "description": "Form hộp vuông vắn giữ phom túi cực đẹp, khóa kéo kim loại bền bỉ.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "6 cây vợt",
          "material": "PU + Polyester cao cấp"
        },
        "images": [
          {
            "id": 155,
            "image_url": "/frontend/assets/products/catalog/p155.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 211,
            "sku_code": "TS-C16-P155-A",
            "size": "6 vợt",
            "color": "Trắng Xanh",
            "price": 1590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 156,
        "sport_id": 3,
        "category_id": 16,
        "brand_id": 6,
        "name": "Balo Tennis Wilson Tour Backpack",
        "description": "Balo thiết kế chuyên biệt cho người chơi Tennis với ngăn vợt đệm êm và ngăn phụ kiện.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "2 cây vợt Tennis",
          "compartments": "Ngăn vợt khóa chống trượt + ngăn giày"
        },
        "images": [
          {
            "id": 156,
            "image_url": "/frontend/assets/products/catalog/p156.jpg",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 212,
            "sku_code": "TS-C16-P156-A",
            "size": "2 vợt",
            "color": "Đỏ Đen",
            "price": 1490000,
            "sale_price": 1350000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 157,
        "sport_id": 3,
        "category_id": 16,
        "brand_id": 6,
        "name": "Túi Tennis Wilson Super Tour 9 Pack",
        "description": "Lớp lót Thermoguard bảo vệ khung và dây cước trước nhiệt độ nắng nóng ngoài sân.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "9 cây vợt",
          "tech": "Thermoguard 2.0"
        },
        "images": [
          {
            "id": 157,
            "image_url": "/frontend/assets/products/catalog/p157.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 213,
            "sku_code": "TS-C16-P157-A",
            "size": "9 vợt",
            "color": "Đỏ Wilson",
            "price": 2850000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 158,
        "sport_id": 3,
        "category_id": 16,
        "brand_id": 7,
        "name": "Balo Tennis Babolat Pure Aero Backpack",
        "description": "Ngăn chứa vợt cách nhiệt thông minh có thể gập gọn khi không mang vợt.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "3 cây vợt",
          "volume": "32L"
        },
        "images": [
          {
            "id": 158,
            "image_url": "/frontend/assets/products/catalog/p158.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 214,
            "sku_code": "TS-C16-P158-A",
            "size": "3 vợt",
            "color": "Vàng Đen",
            "price": 1890000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 159,
        "sport_id": 4,
        "category_id": 16,
        "brand_id": 9,
        "name": "Balo Pickleball Joola Vision II Deluxe",
        "description": "Tích hợp sẵn móc treo hàng rào tiện lợi cùng hơn 10 ngăn nhỏ đựng bóng và phụ kiện.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "capacity": "4 vợt Pickleball + ngăn giày thông khí",
          "hook": "Móc treo hàng rào sân"
        },
        "images": [
          {
            "id": 159,
            "image_url": "/frontend/assets/products/catalog/p159.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 215,
            "sku_code": "TS-C16-P159-A",
            "size": "4 vợt",
            "color": "Đen Xanh",
            "price": 1750000,
            "sale_price": 1590000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      },
      {
        "id": 160,
        "sport_id": 2,
        "category_id": 16,
        "brand_id": 4,
        "name": "Túi trống thể thao Nike Brasilia 9.5 Medium (60L)",
        "description": "Túi trống rộng rãi đựng trọn bộ giày bóng đá, bóng, quần áo và bình nước.",
        "condition_type": "MOI",
        "wear_description": null,
        "status": "ACTIVE",
        "specifications": {
          "volume": "60L",
          "material": "Polyester chống nước đáy túi"
        },
        "images": [
          {
            "id": 160,
            "image_url": "/frontend/assets/products/catalog/p160.webp",
            "is_primary": true,
            "sort_order": 1
          }
        ],
        "skus": [
          {
            "id": 216,
            "sku_code": "TS-C16-P160-A",
            "size": "60L",
            "color": "Đen Trắng",
            "price": 1150000,
            "stock": 18,
            "unit": "CHIEC",
            "quantity_per_lot": 1,
            "status": "ACTIVE"
          }
        ]
      }
    ],
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
      },
      {
        id: 4,
        sport_id: 3,
        sport_name: "Tennis",
        title: "Giao lưu đánh đôi Tennis trình độ 3.0 tối thứ 5",
        match_date: "2026-11-24",
        match_time: "18:00 - 20:00",
        location: "CLB Quần Vợt Tennis Bách Khoa, Hà Nội",
        level: "Khá / Trình độ 3.0+",
        slots_needed: 2,
        price_share: "90.000đ / người",
        contact_name: "Phạm Minh Tuấn",
        contact_phone: "0915223344",
        author_id: 2,
        status: "OPEN",
        description: "Đánh set giao lưu vui vẻ, đã có bóng mới hộp 3 quả."
      },
      {
        id: 5,
        sport_id: 6,
        sport_name: "Bóng bàn",
        title: "Tìm đối tập giật bóng & đánh đơn bóng bàn chiều thứ 7",
        match_date: "2026-11-25",
        match_time: "16:30 - 18:30",
        location: "CLB Bóng Bàn Hà Nội T&T, Hoàn Kiếm",
        level: "Phong trào / Trung bình khá",
        slots_needed: 1,
        price_share: "40.000đ / người",
        contact_name: "Nguyễn Quốc Huy",
        contact_phone: "0982334455",
        author_id: 3,
        status: "OPEN",
        description: "Tập kỹ thuật đều tay và giao hữu 3 ván thắng 2."
      },
      {
        id: 6,
        sport_id: 1,
        sport_name: "Cầu lông",
        title: "Tuyển 2 bạn đánh cầu lông sân Cầu Giấy Pro khung vàng",
        match_date: "2026-11-26",
        match_time: "19:30 - 21:30",
        location: "Sân Cầu Lông Cầu Giấy Pro, Dịch Vọng Hậu",
        level: "Trung bình - Khá",
        slots_needed: 2,
        price_share: "65.000đ / người",
        contact_name: "Trần Đức Mạnh",
        contact_phone: "0977889900",
        author_id: 2,
        status: "OPEN",
        description: "Nhóm hòa đồng, chia tiền sân + cầu Hải Yến đều."
      }
    ],
    courts: [
      {
        id: 1,
        sport_id: 4,
        sport_name: "Pickleball",
        name: "Muse Pickle",
        address: "198 Phố Ngọc Hà, phường Ba Đình, Hà Nội",
        distance: "118.1m",
        opening_hours: "06:00 - 24:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
        logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120",
        surface: "Sân chuyên dụng đệm cao su Pickleball"
      },
      {
        id: 2,
        sport_id: 4,
        sport_name: "Pickleball",
        name: "NHF Pickleball",
        address: "50 ngách 31 ngõ 135 Đội Cấn, Ba Đình, Hà Nội",
        distance: "616.9m",
        opening_hours: "05:30 - 23:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800",
        logo_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120",
        surface: "Sân Acrylic 5 lớp chuẩn quốc tế"
      },
      {
        id: 3,
        sport_id: 4,
        sport_name: "Pickleball",
        name: "PickleBall 20 Thụy Khuê",
        address: "20 Đ. Thụy Khuê, Thụy Khuê, Tây Hồ, Hà Nội",
        distance: "631.0m",
        opening_hours: "05:00 - 24:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800",
        logo_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120",
        surface: "Sân ngoài trời chống lóa cao cấp"
      },
      {
        id: 4,
        sport_id: 4,
        sport_name: "Pickleball",
        name: "Câu lạc bộ Tây Hồ",
        address: "Số 10 Thụy Khuê, Tây Hồ, Hà Nội",
        distance: "729.9m",
        opening_hours: "05:00 - 22:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        logo_url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=120",
        surface: "Cụm 4 sân mái che thông thoáng"
      },
      {
        id: 5,
        sport_id: 4,
        sport_name: "Pickleball",
        name: "Nhà Thể Thao - Binh Chủng Thông Tin",
        address: "01 Giang Văn Minh - Giảng Võ - Hà Nội",
        distance: "848.5m",
        opening_hours: "05:00 - 22:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1530915365347-e34b1e8df1db?w=800",
        logo_url: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=120",
        surface: "Sàn gỗ & thảm thi đấu chuẩn quân đội"
      },
      {
        id: 6,
        sport_id: 4,
        sport_name: "Pickleball",
        name: "ACE Pickleball Club - Pullman HaNoi",
        address: "40 Cát Linh - 61 Giảng Võ, P. Ô Chợ Dừa, TP. Hà Nội",
        distance: "856.1m",
        opening_hours: "06:00 - 22:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: true,
        discount_label: "Ưu đãi -15%",
        image_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
        logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120",
        surface: "Sân khách sạn Pullman chuẩn 5 sao"
      },
      {
        id: 7,
        sport_id: 1,
        sport_name: "Cầu lông",
        name: "Sân Cầu Lông Kỳ Hòa - Sân 1",
        address: "Sư Vạn Hạnh, Quận 10, TP.HCM",
        distance: "1.1km",
        opening_hours: "06:00 - 23:00",
        rating: 4.9,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
        logo_url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=120",
        surface: "Thảm PVC chuẩn thi đấu BWF"
      },
      {
        id: 8,
        sport_id: 1,
        sport_name: "Cầu lông",
        name: "Sân Cầu Lông Cầu Giấy Pro",
        address: "35 Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
        distance: "1.4km",
        opening_hours: "05:30 - 23:30",
        rating: 4.9,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: true,
        discount_label: "Ưu đãi -10%",
        image_url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800",
        logo_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120",
        surface: "Thảm Enlio 5mm giảm chấn chống trượt"
      },
      {
        id: 9,
        sport_id: 2,
        sport_name: "Bóng đá",
        name: "Sân Cỏ Nhân Tạo Mỹ Đình Sport",
        address: "Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
        distance: "2.1km",
        opening_hours: "06:00 - 24:00",
        rating: 4.8,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
        logo_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120",
        surface: "Cỏ nhân tạo sợi đệm cao su FIFA"
      },
      {
        id: 10,
        sport_id: 3,
        sport_name: "Tennis",
        name: "CLB Quần Vợt Tennis Bách Khoa",
        address: "Tạ Quang Bửu, Hai Bà Trưng, Hà Nội",
        distance: "1.5km",
        opening_hours: "05:30 - 22:30",
        rating: 4.9,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800",
        logo_url: "https://images.unsplash.com/photo-1530915365347-e34b1e8df1db?w=120",
        surface: "Sân cứng Acrylic 9 lớp tiêu chuẩn ITF"
      },
      {
        id: 11,
        sport_id: 6,
        sport_name: "Bóng bàn",
        name: "CLB Bóng Bàn Hà Nội T&T",
        address: "Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
        distance: "950m",
        opening_hours: "07:00 - 22:00",
        rating: 5.0,
        badges: ["Đơn ngày", "Sự kiện"],
        has_discount: false,
        image_url: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800",
        logo_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120",
        surface: "Bàn thi đấu DHS chuẩn ITTF"
      }
    ],
    court_slots: [
      { id: 1, court_id: 1, time_slot: "06:00 - 08:00 (Sáng sớm)", fixed_price: 150000 },
      { id: 2, court_id: 1, time_slot: "17:30 - 19:30 (Khung vàng)", fixed_price: 240000 },
      { id: 3, court_id: 1, time_slot: "19:30 - 21:30 (Tối)", fixed_price: 220000 },
      { id: 4, court_id: 2, time_slot: "05:30 - 07:30 (Sáng sớm)", fixed_price: 140000 },
      { id: 5, court_id: 2, time_slot: "17:30 - 19:30 (Khung vàng)", fixed_price: 240000 },
      { id: 6, court_id: 3, time_slot: "06:00 - 08:00 (Sáng)", fixed_price: 150000 },
      { id: 7, court_id: 3, time_slot: "18:00 - 20:00 (Khung vàng)", fixed_price: 250000 },
      { id: 8, court_id: 4, time_slot: "17:00 - 19:00 (Khung vàng)", fixed_price: 220000 },
      { id: 9, court_id: 5, time_slot: "18:00 - 20:00 (Khung vàng)", fixed_price: 200000 },
      { id: 10, court_id: 6, time_slot: "17:30 - 19:30 (Khung vàng)", fixed_price: 280000 },
      { id: 11, court_id: 7, time_slot: "17:30 - 19:30 (Khung vàng)", fixed_price: 220000 },
      { id: 12, court_id: 8, time_slot: "18:00 - 20:00 (Khung vàng)", fixed_price: 230000 },
      { id: 13, court_id: 9, time_slot: "19:00 - 20:30 (Tối)", fixed_price: 650000 },
      { id: 14, court_id: 10, time_slot: "18:00 - 20:00 (Tối)", fixed_price: 350000 },
      { id: 15, court_id: 11, time_slot: "18:00 - 20:00 (Tối)", fixed_price: 120000 }
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

          // Đồng bộ ảnh thực tế & texture 3D mới cho Victor Auraspeed 90K II (id = 10)
          const victor90k = mergedProducts.find(p => Number(p.id) === 10);
          if (victor90k) {
            const localImg = "/frontend/assets/products/victor-auraspeed-90k-ii.png";
            victor90k.model_3d_texture = localImg;
            if (!victor90k.images || !victor90k.images.length || String(victor90k.images[0].image_url || "").includes("unsplash.com")) {
              victor90k.images = [{ id: 16, image_url: localImg, is_primary: true, sort_order: 1 }];
            }
          }

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
            matches: (Array.isArray(parsed.matches) && parsed.matches.length > 0) ? parsed.matches : initialData.matches,
            courts: (parsed.courts && parsed.courts.length >= 8 && parsed.courts[0].image_url) ? parsed.courts : initialData.courts,
            court_slots: (parsed.court_slots && parsed.court_slots.length >= 10) ? parsed.court_slots : initialData.court_slots,
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
      if (!Array.isArray(this.data.matches)) this.data.matches = [];
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

      // Không cho phép trùng lịch cùng sân, ca và ngày khi đang chờ xác nhận hoặc đã xác nhận
      const activeStatuses = ["PENDING", "CONFIRMED", "CHO_XAC_NHAN", "XAC_NHAN", "DA_XAC_NHAN"];
      const conflict = (this.data.bookings || []).find(
        (b) =>
          Number(b.court_id) === Number(court_id) &&
          Number(b.slot_id) === Number(slot_id) &&
          b.booking_date === booking_date &&
          activeStatuses.includes(b.status)
      );
      if (conflict) {
        throw new Error("Ca giờ này đã có người đặt hoặc đang chờ xác nhận. Vui lòng chọn ca khác!");
      }

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
    async syncFromBackend() {
      const apiBase =
        (typeof window !== "undefined" && window.TSPORT_API_BASE) ||
        (typeof CONFIG !== "undefined" && CONFIG && CONFIG.API_BASE_URL) ||
        "http://127.0.0.1:8000/api";
      try {
        const res = await fetch(`${apiBase}/catalog/bootstrap`, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        if (!res.ok) return false;
        const payload = await res.json();
        if (!payload || !Array.isArray(payload.products) || !payload.products.length) return false;

        // Giữ lại sale_price nội bộ cho mục Flash Sale nếu backend chưa có cột sale_price
        const saleMap = new Map();
        (this.data.products || []).forEach((p) => {
          (p.skus || []).forEach((s) => {
            if (s.sale_price) saleMap.set(s.sku_code, s.sale_price);
          });
        });

        payload.products.forEach((p) => {
          (p.skus || []).forEach((s) => {
            if (!s.sale_price && saleMap.has(s.sku_code)) {
              s.sale_price = saleMap.get(s.sku_code);
            }
          });
        });

        if (Array.isArray(payload.sports) && payload.sports.length) this.data.sports = payload.sports;
        if (Array.isArray(payload.categories) && payload.categories.length) this.data.categories = payload.categories;
        if (Array.isArray(payload.brands) && payload.brands.length) this.data.brands = payload.brands;
        this.data.products = payload.products;
        this.save();

        window.TSPORT_BACKEND_ONLINE = true;
        window.dispatchEvent(new CustomEvent("tsport-backend-synced", { detail: { products: payload.products.length } }));
        return true;
      } catch (_err) {
        window.TSPORT_BACKEND_ONLINE = false;
        return false;
      }
    }
}

  window.tsportStore = new TsportStore();
  // Tự động đồng bộ dữ liệu thực từ FastAPI + MySQL ở nền ngay khi tải trang
  if (typeof window !== "undefined" && typeof fetch === "function") {
    window.tsportStore.syncFromBackend();
  }
})();
