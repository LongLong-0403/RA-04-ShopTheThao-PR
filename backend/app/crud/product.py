from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.catalog import (
    Brand,
    Category,
    CommonStatusEnum,
    ConditionEnum,
    Product,
    ProductImage,
    ProductSku,
    ProductStatusEnum,
    Sport,
)


def get_category_tree_ids(db: Session, category_id: int) -> list[int]:
    """Return a category and all descendants without relying on DB-specific CTEs."""
    rows = db.execute(select(Category.id, Category.parent_id)).all()
    children: dict[int | None, list[int]] = {}
    for current_id, parent_id in rows:
        children.setdefault(parent_id, []).append(current_id)

    result: list[int] = []
    pending = [category_id]
    while pending:
        current = pending.pop()
        if current in result:
            continue
        result.append(current)
        pending.extend(children.get(current, []))
    return result


def _min_price_query():
    return (
        select(func.min(ProductSku.price))
        .where(ProductSku.product_id == Product.id)
        .correlate(Product)
        .scalar_subquery()
    )


def _public_product_query(db: Session, *, include_relations: bool = False):
    min_price = _min_price_query()
    query = (
        select(Product, min_price.label("min_price"))
        .join(Sport, Product.sport_id == Sport.id)
        .join(Category, Product.category_id == Category.id)
        .join(Brand, Product.brand_id == Brand.id)
        .where(
            Product.status == ProductStatusEnum.ACTIVE,
            Sport.status == CommonStatusEnum.ACTIVE,
            Category.status == CommonStatusEnum.ACTIVE,
            Brand.status == CommonStatusEnum.ACTIVE,
            min_price.is_not(None),
            select(ProductImage.id)
            .where(ProductImage.product_id == Product.id)
            .exists(),
        )
    )
    # The list serializer also needs the related display names and primary image.
    # selectinload avoids one query per product while keeping the aggregate query unique.
    query = query.options(
        selectinload(Product.sport),
        selectinload(Product.category),
        selectinload(Product.brand),
        selectinload(Product.images),
    )
    if include_relations:
        query = query.options(selectinload(Product.skus))
    return query, min_price


def list_products(
    db: Session,
    *,
    q: str | None = None,
    sport_id: int | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    condition_type: ConditionEnum | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
):
    query, price = _public_product_query(db)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.where(or_(Product.name.ilike(keyword), Product.description.ilike(keyword)))
    if sport_id is not None:
        query = query.where(Product.sport_id == sport_id)
    if category_id is not None:
        query = query.where(Product.category_id.in_(get_category_tree_ids(db, category_id)))
    if brand_id is not None:
        query = query.where(Product.brand_id == brand_id)
    if condition_type is not None:
        query = query.where(Product.condition_type == condition_type)
    if min_price is not None:
        query = query.where(price >= min_price)
    if max_price is not None:
        query = query.where(price <= max_price)

    count_query = select(func.count()).select_from(query.order_by(None).subquery())
    total = db.scalar(count_query) or 0
    if sort == "price_asc":
        query = query.order_by(price.asc(), Product.id.desc())
    elif sort == "price_desc":
        query = query.order_by(price.desc(), Product.id.desc())
    else:
        query = query.order_by(Product.created_at.desc(), Product.id.desc())

    rows = db.execute(query.offset((page - 1) * page_size).limit(page_size)).all()
    return rows, total


def get_public_product(db: Session, product_id: int):
    query, _ = _public_product_query(db, include_relations=True)
    return db.execute(query.where(Product.id == product_id)).first()

