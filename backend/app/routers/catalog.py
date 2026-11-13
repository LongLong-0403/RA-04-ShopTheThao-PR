"""Catalog maintenance and public product search."""
import math
from pathlib import Path
from uuid import uuid4
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.core.deps import require_admin
from app.db.session import get_db
from app.models.catalog import Sport, Category, Brand, Product, ProductSku, ProductImage, ConditionEnum, ProductStatusEnum, UnitEnum
from app.services.product_rules import validate_used, sync_stock

UPLOAD_DIR = Path(__file__).resolve().parents[2] / 'uploads' / 'products'

router = APIRouter()

class Named(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=120, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    status: str = Field(default='ACTIVE', pattern='^(ACTIVE|INACTIVE)$')

class SportInput(Named):
    description: str | None = None

class CategoryInput(Named):
    parent_id: int | None = None

class BrandInput(Named):
    logo_url: str | None = Field(default=None, max_length=500)

def catalog_routes(path, model, schema):
    def listing(db: Session = Depends(get_db)):
        return list(db.scalars(select(model).where(model.status == 'ACTIVE').order_by(model.id)))
    def save(data, db, row=None):
        values = data.model_dump()
        if db.scalar(select(model.id).where(or_(model.name == data.name, model.slug == data.slug), model.id != (row.id if row else -1))):
            raise HTTPException(409, 'Tên hoặc slug đã tồn tại')
        if model is Category and data.parent_id is not None:
            parent, seen = data.parent_id, {row.id} if row else set()
            while parent is not None:
                if parent in seen:
                    raise HTTPException(409, 'Danh mục không được tạo chu trình')
                seen.add(parent)
                ancestor = db.get(Category, parent)
                if ancestor is None:
                    raise HTTPException(404, 'Không tìm thấy danh mục cha')
                parent = ancestor.parent_id
        if row is None:
            row = model(**values)
            db.add(row)
        else:
            for key, value in values.items():
                setattr(row, key, value)
        db.commit()
        db.refresh(row)
        return row
    def create(data, db: Session = Depends(get_db)):
        return save(data, db)
    def update(row_id: int, data, db: Session = Depends(get_db)):
        # Serialize category edits so concurrent parent changes cannot form a cycle.
        list(db.scalars(select(model).order_by(model.id).with_for_update()))
        row = db.get(model, row_id)
        if row is None:
            raise HTTPException(404, 'Không tìm thấy dữ liệu')
        return save(data, db, row)
    def remove(row_id: int, db: Session = Depends(get_db)):
        row = db.get(model, row_id)
        if row is None:
            raise HTTPException(404, 'Không tìm thấy dữ liệu')
        field = {Sport: Product.sport_id, Category: Product.category_id, Brand: Product.brand_id}[model]
        if db.scalar(select(Product.id).where(field == row_id).limit(1)):
            raise HTTPException(409, 'Đang có sản phẩm tham chiếu; hãy chuyển INACTIVE')
        if model is Category and db.scalar(select(Category.id).where(Category.parent_id == row_id).limit(1)):
            raise HTTPException(409, 'Danh mục còn danh mục con')
        db.delete(row)
        db.commit()
    create.__annotations__['data'] = schema
    update.__annotations__['data'] = schema
    for endpoint, method in [(listing, 'GET'), (create, 'POST'), (update, 'PUT'), (remove, 'DELETE')]:
        router.add_api_route('/' + path + ('/{row_id}' if endpoint in (update, remove) else ''), endpoint,
                             methods=[method], name=f'{path}_{method}', tags=['catalog-' + path],
                             status_code=201 if method == 'POST' else 200,
                             dependencies=[] if method == 'GET' else [Depends(require_admin)])

catalog_routes('sports', Sport, SportInput)
catalog_routes('categories', Category, CategoryInput)
catalog_routes('brands', Brand, BrandInput)

class SkuInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    sku_code: str = Field(min_length=1, max_length=100)
    size: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=50)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    stock: int = Field(ge=0, strict=True)
    unit: UnitEnum = UnitEnum.CHIEC
    quantity_per_lot: int = Field(default=1, gt=0, strict=True)

    @model_validator(mode='after')
    def lot(self):
        if (self.unit == UnitEnum.CHIEC and self.quantity_per_lot != 1) or (self.unit == UnitEnum.LO and self.quantity_per_lot <= 1):
            raise ValueError('CHIEC cần 1; LO cần số đơn vị > 1')
        return self

class ImageInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    image_url: str = Field(min_length=1, max_length=500, pattern=r'^(https?://[^\s/]+[^\s]*|/uploads/products/[a-f0-9]{32}\.(png|jpg|webp))$')
    is_primary: bool = False
    sort_order: int = Field(default=0, ge=0)

class ProductInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    sport_id: int
    category_id: int
    brand_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    specifications: dict | None = None
    condition_type: ConditionEnum = ConditionEnum.MOI
    wear_description: str | None = None
    status: ProductStatusEnum = ProductStatusEnum.INACTIVE

    @model_validator(mode='after')
    def wear(self):
        if self.condition_type == ConditionEnum.CU and not (self.wear_description or '').strip():
            raise ValueError('Hàng CU phải có mô tả hao mòn')
        return self

def product_or_404(db, product_id):
    p = db.scalar(select(Product).where(Product.id == product_id).with_for_update())
    if p is None:
        raise HTTPException(404, 'Không tìm thấy sản phẩm')
    return p

def validate_product(db, data, row=None):
    for model, key in [(Sport, 'sport_id'), (Category, 'category_id'), (Brand, 'brand_id')]:
        if db.get(model, getattr(data, key)) is None:
            raise HTTPException(404, f'Không tìm thấy {key}')
    validate_used(data.condition_type, db.get(Category, data.category_id), row.skus if row else [])
    if data.status != ProductStatusEnum.INACTIVE and (row is None or not row.skus or sum(i.is_primary for i in row.images) != 1):
        raise HTTPException(409, 'Thêm SKU và một ảnh chính trước khi kích hoạt')

@router.post('/products', tags=['catalog-products'], dependencies=[Depends(require_admin)], status_code=201)
def create_product(data: ProductInput, db: Session = Depends(get_db)):
    validate_product(db, data)
    row = Product(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.put('/products/{product_id}', tags=['catalog-products'], dependencies=[Depends(require_admin)])
def update_product(product_id: int, data: ProductInput, db: Session = Depends(get_db)):
    row = product_or_404(db, product_id)
    validate_product(db, data, row)
    for key, value in data.model_dump().items():
        setattr(row, key, value)
    sync_stock(row)
    db.commit()
    db.refresh(row)
    return row

@router.delete('/products/{product_id}', tags=['catalog-products'], dependencies=[Depends(require_admin)])
def hide_product(product_id: int, db: Session = Depends(get_db)):
    row = product_or_404(db, product_id)
    row.status = ProductStatusEnum.INACTIVE
    db.commit()
    return {'id': row.id, 'status': row.status}

@router.post('/products/{product_id}/skus', tags=['catalog-skus'], dependencies=[Depends(require_admin)], status_code=201)
def add_sku(product_id: int, data: SkuInput, db: Session = Depends(get_db)):
    p = product_or_404(db, product_id)
    validate_used(p.condition_type, p.category, [*p.skus, data])
    normalized = lambda value: (value or '').strip().lower()
    if any((normalized(s.size), normalized(s.color), s.unit, s.quantity_per_lot) ==
           (normalized(data.size), normalized(data.color), data.unit, data.quantity_per_lot) for s in p.skus):
        raise HTTPException(409, 'Trùng bộ thuộc tính SKU')
    row = ProductSku(product=p, **data.model_dump())
    db.add(row)
    sync_stock(p)
    db.commit()
    db.refresh(row)
    return row

@router.post('/products/{product_id}/images', tags=['catalog-images'], dependencies=[Depends(require_admin)], status_code=201)
def add_image(product_id: int, data: ImageInput, db: Session = Depends(get_db)):
    p = product_or_404(db, product_id)
    if data.is_primary or not p.images:
        for image in p.images:
            image.is_primary = False
        db.flush()
    values = data.model_dump()
    if not p.images:
        values['is_primary'] = True
    row = ProductImage(product=p, **values)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.put('/products/{product_id}/skus/{sku_id}', tags=['catalog-skus'], dependencies=[Depends(require_admin)])
def edit_sku(product_id: int, sku_id: int, data: SkuInput, db: Session = Depends(get_db)):
    p = product_or_404(db, product_id)
    row = db.scalar(select(ProductSku).where(ProductSku.id == sku_id, ProductSku.product_id == p.id).with_for_update())
    if row is None: raise HTTPException(404, 'Không tìm thấy SKU')
    validate_used(p.condition_type, p.category, [s for s in p.skus if s.id != sku_id] + [data])
    if row.order_items and (row.unit != data.unit or row.quantity_per_lot != data.quantity_per_lot):
        raise HTTPException(409, 'SKU đã có đơn: không được đổi đơn vị hoặc quy cách lô')
    normalize = lambda value: (value or '').strip().lower()
    for s in p.skus:
        if s.id != sku_id and (normalize(s.size), normalize(s.color), s.unit, s.quantity_per_lot) == (normalize(data.size), normalize(data.color), data.unit, data.quantity_per_lot):
            raise HTTPException(409, 'Trùng biến thể')
    for key, value in data.model_dump().items(): setattr(row, key, value)
    sync_stock(p)
    db.commit()
    db.refresh(row)
    return row

@router.delete('/products/{product_id}/skus/{sku_id}', tags=['catalog-skus'], dependencies=[Depends(require_admin)])
def remove_sku(product_id: int, sku_id: int, db: Session = Depends(get_db)):
    from app.models.order import OrderItem
    p = product_or_404(db, product_id)
    row = db.get(ProductSku, sku_id)
    if row is None or row.product_id != p.id: raise HTTPException(404, 'Không tìm thấy SKU')
    if db.scalar(select(OrderItem.id).where(OrderItem.product_sku_id == sku_id).limit(1)) or (p.status != ProductStatusEnum.INACTIVE and len(p.skus) <= 1):
        raise HTTPException(409, 'SKU đã được dùng hoặc là SKU cuối của sản phẩm đang bán')
    if row.cart_items:
        raise HTTPException(409, 'SKU đang nằm trong giỏ hàng; hãy ẩn sản phẩm thay vì xóa')
    p.skus.remove(row)
    sync_stock(p)
    db.commit()
    return {'deleted': sku_id}


@router.get('/admin/products', tags=['catalog-admin'], dependencies=[Depends(require_admin)])
def admin_products(q: str | None = None, db: Session = Depends(get_db)):
    query = select(Product).order_by(Product.id.desc())
    if q:
        query = query.where(Product.name.contains(q))
    return list(db.scalars(query))


@router.get('/admin/products/{product_id}', tags=['catalog-admin'], dependencies=[Depends(require_admin)])
def admin_product_detail(product_id: int, db: Session = Depends(get_db)):
    p = product_or_404(db, product_id)
    return {'product': p, 'skus': p.skus, 'images': sorted(p.images, key=lambda i: (i.sort_order, i.id))}


@router.put('/products/{product_id}/images/{image_id}', tags=['catalog-images'], dependencies=[Depends(require_admin)])
def edit_image(product_id: int, image_id: int, data: ImageInput, db: Session = Depends(get_db)):
    p = product_or_404(db, product_id)
    image = next((i for i in p.images if i.id == image_id), None)
    if image is None:
        raise HTTPException(404, 'Không tìm thấy ảnh')
    if image.is_primary and not data.is_primary and p.status != ProductStatusEnum.INACTIVE:
        raise HTTPException(409, 'Hãy chọn ảnh khác làm ảnh chính trước')
    if data.is_primary:
        for i in p.images:
            i.is_primary = False
        db.flush()
    for key, value in data.model_dump().items():
        setattr(image, key, value)
    db.commit()
    db.refresh(image)
    return image


@router.delete('/products/{product_id}/images/{image_id}', tags=['catalog-images'], dependencies=[Depends(require_admin)])
def remove_image(product_id: int, image_id: int, db: Session = Depends(get_db)):
    p = product_or_404(db, product_id)
    image = next((i for i in p.images if i.id == image_id), None)
    if image is None:
        raise HTTPException(404, 'Không tìm thấy ảnh')
    if image.is_primary and p.status != ProductStatusEnum.INACTIVE:
        raise HTTPException(409, 'Không thể xóa ảnh chính khi đang hiển thị')
    db.delete(image)
    db.commit()
    return {'deleted': image_id}


@router.post('/products/{product_id}/images/upload', tags=['catalog-images'], dependencies=[Depends(require_admin)], status_code=201)
async def upload_image(product_id: int, request: Request, db: Session = Depends(get_db)):
    """Raw image body (not multipart); bounded stream, server-generated filename."""
    product_or_404(db, product_id)
    content = bytearray()
    async for chunk in request.stream():
        content.extend(chunk)
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(413, 'Ảnh tối đa 5 MB')
    mime = request.headers.get('content-type', '').split(';')[0]
    extension = None
    if mime == 'image/png' and content.startswith(b'\x89PNG\r\n\x1a\n') and b'IEND' in content[-16:]:
        extension = 'png'
    elif mime == 'image/jpeg' and content.startswith(b'\xff\xd8\xff') and content.endswith(b'\xff\xd9'):
        extension = 'jpg'
    elif mime == 'image/webp' and content[:4] == b'RIFF' and content[8:12] == b'WEBP':
        extension = 'webp'
    if extension is None:
        raise HTTPException(422, 'Chỉ chấp nhận ảnh PNG, JPEG, WebP có chữ ký hợp lệ')
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f'{uuid4().hex}.{extension}'
    path = UPLOAD_DIR / name
    path.write_bytes(content)
    try:
        return add_image(product_id, ImageInput(image_url=f'/uploads/products/{name}'), db)
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise

@router.get('/products', tags=['catalog-products'])
@router.get('/search/products', tags=['catalog-products'], include_in_schema=False)
def products(q: str | None = None, sport_id: int | None = None, category_id: int | None = None,
             brand_id: int | None = None, condition_type: ConditionEnum | None = None,
             min_price: Decimal | None = Query(None, ge=0), max_price: Decimal | None = Query(None, ge=0),
             sort: str = Query('price_asc', pattern='^(price_asc|price_desc)$'),
             page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(422, 'Khoảng giá không hợp lệ')
    prices = select(ProductSku.product_id, func.min(ProductSku.price).label('price')).where(ProductSku.stock > 0).group_by(ProductSku.product_id).subquery()
    query = select(Product, prices.c.price).join(prices, prices.c.product_id == Product.id).join(Sport).join(Category).join(Brand).where(
        Product.status == 'ACTIVE', Sport.status == 'ACTIVE', Category.status == 'ACTIVE', Brand.status == 'ACTIVE',
        Product.images.any(ProductImage.is_primary == True))
    if q:
        query = query.where(or_(Product.name.contains(q), Product.description.contains(q)))
    if sport_id is not None: query = query.where(Product.sport_id == sport_id)
    if brand_id is not None: query = query.where(Product.brand_id == brand_id)
    if category_id is not None:
        ids = {category_id}
        pairs = db.execute(select(Category.id, Category.parent_id).where(Category.status == 'ACTIVE')).all()
        while True:
            expanded = ids | {i for i, parent in pairs if parent in ids}
            if expanded == ids: break
            ids = expanded
        query = query.where(Product.category_id.in_(ids))
    if condition_type: query = query.where(Product.condition_type == condition_type)
    if min_price is not None: query = query.where(prices.c.price >= min_price)
    if max_price is not None: query = query.where(prices.c.price <= max_price)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.order_by(prices.c.price.desc() if sort == 'price_desc' else prices.c.price.asc(), Product.id)
    return {'items': [{'product': p, 'min_price': price} for p, price in db.execute(query.offset((page-1)*page_size).limit(page_size))],
            'total': total, 'page': page, 'page_size': page_size, 'total_pages': math.ceil(total/page_size)}

@router.get('/products/{product_id}', tags=['catalog-products'])
def detail(product_id: int, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if p is None or p.status != ProductStatusEnum.ACTIVE or any(x.status.value != 'ACTIVE' for x in (p.sport, p.category, p.brand)):
        raise HTTPException(404, 'Không tìm thấy sản phẩm')
    return {'product': p, 'skus': p.skus, 'images': p.images}

@router.get('/menu', tags=['catalog-menu'])
def menu(db: Session = Depends(get_db)):
    categories = list(db.scalars(select(Category).where(Category.status == 'ACTIVE').order_by(Category.id)))
    def node(c, seen):
        if c.id in seen: return None
        brands = list(db.scalars(select(Brand).join(Product).where(Product.category_id == c.id, Product.status == 'ACTIVE', Brand.status == 'ACTIVE').distinct()))
        return {'id': c.id, 'name': c.name, 'brands': brands,
                'children': [node(child, seen | {c.id}) for child in categories if child.parent_id == c.id]}
    return [node(c, set()) for c in categories if c.parent_id is None]
