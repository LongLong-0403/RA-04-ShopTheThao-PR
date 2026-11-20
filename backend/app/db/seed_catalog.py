"""Seed 6 sports, 20 categories, 13 brands, 160 products, 216 SKUs, and 160 verified images into MySQL."""
import json
from decimal import Decimal
from pathlib import Path
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.catalog import (
    Sport,
    Category,
    Brand,
    Product,
    ProductSku,
    ProductImage,
    CommonStatusEnum,
    ConditionEnum,
    ProductStatusEnum,
    UnitEnum,
)

SEED_JSON_PATH = Path(__file__).resolve().parent / "catalog_seed.json"

SPORTS_SEED = [
    (1, "Cầu lông", "cau-long", "Môn thể thao dùng vợt đánh cầu lông phong trào và chuyên nghiệp"),
    (2, "Bóng đá", "bong-da", "Môn thể thao vua với giày đinh sân cỏ nhân tạo và bóng thi đấu"),
    (3, "Tennis", "tennis", "Quần vợt chuyên nghiệp với vợt trợ lực và bóng thi đấu nỉ cao cấp"),
    (4, "Pickleball", "pickleball", "Môn thể thao xu hướng kết hợp bóng bàn, tennis và cầu lông"),
    (5, "Bóng rổ", "bong-ro", "Môn thể thao bóng rổ trong nhà sàn gỗ và ngoài trời bê tông"),
    (6, "Bóng bàn", "bong-ban", "Môn bóng bàn phong trào và thi đấu chuyên nghiệp với cốt vợt, mặt vợt và bóng 3 sao chuẩn ITTF"),
]

CATEGORIES_SEED = [
    (1, None, "Vợt thể thao", "vot-the-thao"),
    (2, 1, "Vợt cầu lông", "vot-cau-long"),
    (3, 1, "Vợt Tennis", "vot-tennis"),
    (4, 1, "Vợt Pickleball", "vot-pickleball"),
    (17, 1, "Vợt & Cốt vợt bóng bàn", "vot-cot-vot-bong-ban"),
    (18, 1, "Mặt vợt bóng bàn", "mat-vot-bong-ban"),
    (5, None, "Giày thể thao", "giay-the-thao"),
    (6, 5, "Giày cầu lông", "giay-cau-long"),
    (7, 5, "Giày bóng đá", "giay-bong-da"),
    (8, 5, "Giày Tennis & Pickleball", "giay-tennis-pickleball"),
    (19, 5, "Giày bóng bàn & Đa năng", "giay-bong-ban"),
    (9, None, "Bóng & Quả thi đấu", "bong-va-qua-thi-dau"),
    (10, 9, "Quả cầu lông", "qua-cau-long"),
    (11, 9, "Quả bóng đá", "qua-bong-da"),
    (12, 9, "Bóng Tennis", "bong-tennis"),
    (13, 9, "Bóng Pickleball", "bong-pickleball"),
    (20, 9, "Hộp bóng bàn 3 sao ITTF", "hop-bong-ban-3-sao"),
    (14, None, "Trang phục & Balo", "trang-phuc-balo"),
    (15, 14, "Áo đấu & Trang phục", "ao-dau-trang-phuc"),
    (16, 14, "Túi vợt & Balo", "tui-vot-balo"),
]

BRANDS_SEED = [
    (1, "Yonex", "yonex", "/frontend/assets/products/catalog/p001.webp"),
    (2, "Lining", "lining", "/frontend/assets/products/catalog/p005.webp"),
    (3, "Victor", "victor", "/frontend/assets/products/victor-auraspeed-90k-ii.png"),
    (4, "Nike", "nike", "/frontend/assets/products/catalog/p061.jpg"),
    (5, "Adidas", "adidas", "/frontend/assets/products/catalog/p064.jpg"),
    (6, "Wilson", "wilson", "/frontend/assets/products/catalog/p011.webp"),
    (7, "Babolat", "babolat", "/frontend/assets/products/catalog/p015.webp"),
    (8, "Selkirk", "selkirk", "/frontend/assets/products/catalog/p025.webp"),
    (9, "Joola", "joola", "/frontend/assets/products/catalog/p021.webp"),
    (10, "Mizuno", "mizuno", "/frontend/assets/products/catalog/p009.webp"),
    (11, "Kamito", "kamito", "/frontend/assets/products/catalog/p069.jpg"),
    (12, "Butterfly", "butterfly", "/frontend/assets/products/catalog/p031.jpg"),
    (13, "DHS", "dhs", "/frontend/assets/products/catalog/p036.webp"),
]


def seed_catalog(db: Session) -> dict:
    """Idempotently seed sports, categories, brands, and 160 products if products table is empty."""
    # 1. Sports
    for sid, name, slug, desc in SPORTS_SEED:
        existing = db.get(Sport, sid) or db.scalar(select(Sport).where(Sport.slug == slug))
        if not existing:
            db.add(Sport(id=sid, name=name, slug=slug, description=desc, status=CommonStatusEnum.ACTIVE))
    db.flush()

    # 2. Categories (parents first, then children)
    for cid, parent_id, name, slug in [c for c in CATEGORIES_SEED if c[1] is None]:
        existing = db.get(Category, cid) or db.scalar(select(Category).where(Category.slug == slug))
        if not existing:
            db.add(Category(id=cid, parent_id=None, name=name, slug=slug, status=CommonStatusEnum.ACTIVE))
    db.flush()
    for cid, parent_id, name, slug in [c for c in CATEGORIES_SEED if c[1] is not None]:
        existing = db.get(Category, cid) or db.scalar(select(Category).where(Category.slug == slug))
        if not existing:
            db.add(Category(id=cid, parent_id=parent_id, name=name, slug=slug, status=CommonStatusEnum.ACTIVE))
    db.flush()

    # 3. Brands
    for bid, name, slug, logo in BRANDS_SEED:
        existing = db.get(Brand, bid) or db.scalar(select(Brand).where(Brand.slug == slug))
        if not existing:
            db.add(Brand(id=bid, name=name, slug=slug, logo_url=logo, status=CommonStatusEnum.ACTIVE))
    db.flush()

    # 4. Products (skip if already seeded)
    existing_prod_count = db.scalar(select(func.count()).select_from(Product)) or 0
    if existing_prod_count >= 160 or not SEED_JSON_PATH.exists():
        db.commit()
        return {"seeded": False, "products": existing_prod_count}

    with open(SEED_JSON_PATH, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    inserted_prods = 0
    for p in products_data:
        if db.get(Product, p["id"]):
            continue
        prod = Product(
            id=p["id"],
            sport_id=p["sport_id"],
            category_id=p["category_id"],
            brand_id=p["brand_id"],
            name=p["name"],
            description=p.get("description"),
            specifications=p.get("specifications"),
            condition_type=ConditionEnum(p.get("condition_type", "MOI")),
            wear_description=p.get("wear_description"),
            status=ProductStatusEnum(p.get("status", "ACTIVE")),
        )
        db.add(prod)
        db.flush()

        for s in p.get("skus", []):
            db.add(
                ProductSku(
                    id=s["id"],
                    product_id=prod.id,
                    sku_code=s["sku_code"],
                    size=s.get("size"),
                    color=s.get("color"),
                    price=Decimal(str(s["price"])),
                    stock=int(s.get("stock", 10)),
                    unit=UnitEnum(s.get("unit", "CHIEC")),
                    quantity_per_lot=int(s.get("quantity_per_lot", 1)),
                )
            )

        for img in p.get("images", []):
            db.add(
                ProductImage(
                    id=img["id"],
                    product_id=prod.id,
                    image_url=img["image_url"],
                    is_primary=bool(img.get("is_primary", True)),
                    sort_order=int(img.get("sort_order", 1)),
                )
            )
        inserted_prods += 1

    db.commit()
    return {"seeded": True, "products": inserted_prods}
