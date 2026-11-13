"""API CRUD mẫu cho items. Đường dẫn đầy đủ: /api/items

    GET    /api/items          danh sách (tìm theo tên: ?q=com)
    GET    /api/items/{id}     chi tiết 1 item
    POST   /api/items          thêm mới
    PUT    /api/items/{id}     sửa
    DELETE /api/items/{id}     xoá
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.item import ItemCreate, ItemOut, ItemUpdate
from app.services import item_service

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("", response_model=list[ItemOut])
def list_items(q: str | None = None, db: Session = Depends(get_db)):
    return item_service.list_items(db, keyword=q)


@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    return item_service.get_item(db, item_id)


@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def create_item(data: ItemCreate, db: Session = Depends(get_db)):
    return item_service.create_item(db, data)


@router.put("/{item_id}", response_model=ItemOut)
def update_item(item_id: int, data: ItemUpdate, db: Session = Depends(get_db)):
    return item_service.update_item(db, item_id, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item_service.delete_item(db, item_id)
