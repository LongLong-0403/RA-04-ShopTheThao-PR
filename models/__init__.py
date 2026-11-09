# Import mọi model ở đây để Base.metadata.create_all() "nhìn thấy" và tạo bảng.
from app.models.item import Item  # noqa: F401
from app.models.catalog import (  # noqa: F401
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
