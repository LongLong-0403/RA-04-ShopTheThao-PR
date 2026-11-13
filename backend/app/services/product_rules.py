"""Shared catalog invariants; quantities are always selling units."""
import unicodedata

from fastapi import HTTPException
from app.models.catalog import ConditionEnum, ProductStatusEnum, UnitEnum


def category_kind(category):
    names, seen = [], set()
    while category is not None and category.id not in seen:
        seen.add(category.id)
        names.append(category.slug + ' ' + category.name)
        category = category.parent
    text = unicodedata.normalize('NFD', ' '.join(names).lower())
    words = ''.join(c for c in text if not unicodedata.combining(c)).replace('-', ' ').split()
    if 'vot' in words or 'racket' in words:
        return 'racket'
    if 'cau' in words or 'bong' in words or 'ball' in words or 'shuttlecock' in words:
        return 'ball'
    return None


def validate_used(condition, category, skus):
    if condition != ConditionEnum.CU:
        return
    kind = category_kind(category)
    if kind == 'racket' and (sum(s.stock for s in skus) > 1 or any(s.unit != UnitEnum.CHIEC for s in skus)):
        raise HTTPException(422, 'Vợt cũ bán theo CHIEC, tổng tồn sản phẩm tối đa 1')
    if kind == 'ball' and any(s.unit != UnitEnum.LO for s in skus):
        raise HTTPException(422, 'Cầu/bóng cũ phải bán theo LO')


def sync_stock(product):
    if product.status != ProductStatusEnum.INACTIVE:
        product.status = ProductStatusEnum.ACTIVE if any(s.stock > 0 for s in product.skus) else ProductStatusEnum.OUT_OF_STOCK