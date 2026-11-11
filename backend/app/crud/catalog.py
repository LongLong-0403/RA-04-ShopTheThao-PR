"""Catalog business rules. Writes use transactions and database constraints."""
from contextlib import contextmanager

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.catalog import Brand, Category, CommonStatusEnum, Product, ProductStatusEnum, Sport
from app.models.court import BuybackRequest, Court, MatchPost


def get_or_404(db: Session, model, object_id: int):
    obj = db.get(model, object_id)
    if obj is None:
        raise HTTPException(404, "Không tìm thấy bản ghi")
    return obj


def list_records(db: Session, model, q=None, status=None, offset=0, limit=100, parent_id=None):
    query = select(model).order_by(model.name, model.id)
    if q:
        query = query.where(model.name.contains(q.strip(), autoescape=True))
    if status is not None:
        query = query.where(model.status == status)
    if parent_id is not None and model is Category:
        query = query.where(Category.parent_id == parent_id)
    return list(db.scalars(query.offset(offset).limit(limit)))


@contextmanager
def write_transaction(db: Session):
    try:
        yield
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(409, "Tên/slug đã tồn tại hoặc bản ghi đang được tham chiếu") from error
    except Exception:
        db.rollback()
        raise


def check_unique(db: Session, model, payload: dict, object_id=None):
    for field in ("name", "slug"):
        if field not in payload:
            continue
        query = select(model.id).where(func.lower(getattr(model, field)) == payload[field].lower())
        if object_id is not None:
            query = query.where(model.id != object_id)
        if db.scalar(query.limit(1)) is not None:
            raise HTTPException(409, f"{field} đã tồn tại")


def validate_parent(db: Session, parent_id: int | None, object_id=None):
    seen = {object_id} if object_id is not None else set()
    while parent_id is not None:
        if parent_id in seen:
            raise HTTPException(409, "Danh mục không được tự làm cha hoặc tạo chu trình")
        seen.add(parent_id)
        parent = get_or_404(db, Category, parent_id)
        parent_id = parent.parent_id


def lock_categories(db: Session):
    # Serialize hierarchy changes, including moves across different roots.
    # Refresh objects already loaded by an earlier query in this session.
    return list(db.scalars(select(Category).order_by(Category.id).with_for_update().execution_options(populate_existing=True)))


def create_record(db: Session, model, data):
    payload = data.model_dump()
    with write_transaction(db):
        if model is Category:
            locked_categories = lock_categories(db)
            validate_parent(db, payload.get("parent_id"))
        check_unique(db, model, payload)
        obj = model(**payload)
        db.add(obj)
        db.flush()
    db.refresh(obj)
    return obj


def update_record(db: Session, model, object_id: int, data):
    payload = data.model_dump(exclude_unset=True)
    with write_transaction(db):
        if model is Category:
            locked_categories = lock_categories(db)
        obj = db.scalar(select(model).where(model.id == object_id).with_for_update().execution_options(populate_existing=True))
        if obj is None:
            raise HTTPException(404, "Không tìm thấy bản ghi")
        if model is Category and "parent_id" in payload:
            validate_parent(db, payload["parent_id"], object_id)
        check_unique(db, model, payload, object_id)
        for field, value in payload.items():
            setattr(obj, field, value)
        db.flush()
    db.refresh(obj)
    return obj


def delete_record(db: Session, model, object_id: int):
    with write_transaction(db):
        if model is Category:
            locked_categories = lock_categories(db)
        obj = db.scalar(select(model).where(model.id == object_id).with_for_update())
        if obj is None:
            raise HTTPException(404, "Không tìm thấy bản ghi")
        product_field = {Sport: Product.sport_id, Category: Product.category_id, Brand: Product.brand_id}[model]
        if db.scalar(select(Product.id).where(product_field == object_id).limit(1)) is not None:
            raise HTTPException(409, "Không thể xoá khi còn sản phẩm")
        if model is Category and db.scalar(select(Category.id).where(Category.parent_id == object_id).limit(1)) is not None:
            raise HTTPException(409, "Không thể xoá khi còn danh mục con")
        if model is Sport:
            for related in (Court, MatchPost, BuybackRequest):
                if db.scalar(select(related.id).where(related.sport_id == object_id).limit(1)) is not None:
                    raise HTTPException(409, "Môn thể thao đang được sử dụng")
        # SQL DELETE avoids ORM automatically nulling child foreign keys.
        db.execute(delete(model).where(model.id == object_id))


def category_tree(db: Session, status=None, menu=False, sport_id=None):
    categories = list(db.scalars(select(Category).order_by(Category.name, Category.id)))
    nodes = {}
    for category in categories:
        nodes[category.id] = {
            "id": category.id, "name": category.name, "slug": category.slug,
            "parent_id": category.parent_id, "status": category.status,
            "children": [],
        }
        if menu:
            nodes[category.id]["brands"] = []

    if menu:
        query = (
            select(Product.category_id, Brand)
            .join(Brand, Product.brand_id == Brand.id)
            .join(Sport, Product.sport_id == Sport.id)
            .where(
                Product.status.in_([ProductStatusEnum.ACTIVE, ProductStatusEnum.OUT_OF_STOCK]),
                Brand.status == CommonStatusEnum.ACTIVE,
                Sport.status == CommonStatusEnum.ACTIVE,
            ).distinct().order_by(Brand.name, Brand.id)
        )
        if sport_id is not None:
            get_or_404(db, Sport, sport_id)
            query = query.where(Product.sport_id == sport_id)
        for category_id, brand in db.execute(query):
            if category_id in nodes:
                nodes[category_id]["brands"].append(brand)

    roots = []
    for node in nodes.values():
        if node["parent_id"] in nodes:
            nodes[node["parent_id"]]["children"].append(node)
        else:
            roots.append(node)

    def filter_node(node, visited):
        if node["id"] in visited:
            raise HTTPException(409, "Dữ liệu danh mục có chu trình; cần sửa dữ liệu")
        if status is not None and node["status"] != status:
            return None
        visited = visited | {node["id"]}
        node["children"] = [child for item in node["children"] if (child := filter_node(item, visited)) is not None]
        if menu:
            brands = {brand.id: brand for brand in node["brands"]}
            for child in node["children"]:
                brands.update({brand.id: brand for brand in child["brands"]})
            node["brands"] = sorted(brands.values(), key=lambda brand: (brand.name.casefold(), brand.id))
        return node

    # Validate every parent chain as corrupted cycles might not have a root.
    for category in categories:
        current, visited = category.id, set()
        while current in nodes:
            if current in visited:
                raise HTTPException(409, "Dữ liệu danh mục có chu trình; cần sửa dữ liệu")
            visited.add(current)
            current = nodes[current]["parent_id"]
    return [result for root in roots if (result := filter_node(root, set())) is not None]