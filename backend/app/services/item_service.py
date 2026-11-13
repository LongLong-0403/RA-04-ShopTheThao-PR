"""Service cho bảng items: toàn bộ logic đọc/ghi DB. Router chỉ gọi vào đây."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate
from app.services.exceptions import NotFoundError


def list_items(db: Session, keyword: str | None = None) -> list[Item]:
    query = select(Item).order_by(Item.id.desc())
    if keyword:
        query = query.where(Item.name.contains(keyword))
    return list(db.scalars(query))


def get_item(db: Session, item_id: int) -> Item:
    item = db.get(Item, item_id)
    if item is None:
        raise NotFoundError(f"Không tìm thấy item id={item_id}")
    return item


def create_item(db: Session, data: ItemCreate) -> Item:
    item = Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)  # lấy lại id, created_at... do MySQL sinh ra
    return item


def update_item(db: Session, item_id: int, data: ItemUpdate) -> Item:
    item = get_item(db, item_id)
    # exclude_unset: chỉ lấy các trường FE thực sự gửi lên
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: int) -> None:
    db.delete(get_item(db, item_id))
    db.commit()


def seed_items(db: Session) -> None:
    """Thêm dữ liệu mẫu nếu bảng items đang trống."""
    if db.scalar(select(Item.id).limit(1)) is not None:
        return
    db.add_all(
        [
            Item(name="Cơm rang dưa bò", description="Món mẫu để kiểm tra API", price=45000),
            Item(name="Trà đá", description="Dữ liệu mẫu số 2", price=5000),
        ]
    )
    db.commit()
