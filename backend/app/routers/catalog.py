"""Public catalog reads and ADMIN-only writes."""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.catalog_auth import require_catalog_admin
from app.crud import catalog as crud
from app.db.session import get_db
from app.models.catalog import Brand, Category, CommonStatusEnum, Sport
from app.schemas.catalog import (
    BrandCreate, BrandOut, BrandUpdate, CategoryCreate, CategoryOut,
    CategoryTree, CategoryUpdate, MenuNode, SportCreate, SportOut, SportUpdate,
)

router = APIRouter(tags=["Catalog"])


# Static routes must precede /categories/{object_id}.
@router.get("/categories/tree", response_model=list[CategoryTree])
def get_category_tree(
    status: CommonStatusEnum | None = None,
    db: Session = Depends(get_db),
):
    return crud.category_tree(db, status=status)


@router.get("/menu", response_model=list[MenuNode])
def get_menu(sport_id: int | None = Query(default=None, gt=0), db: Session = Depends(get_db)):
    return crud.category_tree(db, status=CommonStatusEnum.ACTIVE, menu=True, sport_id=sport_id)


def register_resource(path, model, create_schema, update_schema, out_schema):
    """Share identical CRUD routing while preserving typed OpenAPI schemas."""
    resource = APIRouter(prefix=path)

    @resource.get("", response_model=list[out_schema], name=f"list_{model.__tablename__}")
    def list_records(
        q: str | None = Query(default=None, max_length=150),
        status: CommonStatusEnum | None = None,
        offset: int = Query(default=0, ge=0),
        limit: int = Query(default=100, ge=1, le=500),
        parent_id: int | None = Query(default=None, gt=0),
        db: Session = Depends(get_db),
    ):
        return crud.list_records(db, model, q, status, offset, limit, parent_id)

    @resource.get("/{object_id}", response_model=out_schema, name=f"get_{model.__tablename__}")
    def get_record(object_id: int, db: Session = Depends(get_db)):
        return crud.get_or_404(db, model, object_id)

    @resource.post("", response_model=out_schema, status_code=201,
                   dependencies=[Depends(require_catalog_admin)], name=f"create_{model.__tablename__}")
    def create_record(data: create_schema, db: Session = Depends(get_db)):
        return crud.create_record(db, model, data)

    @resource.put("/{object_id}", response_model=out_schema,
                  dependencies=[Depends(require_catalog_admin)], name=f"update_{model.__tablename__}")
    def update_record(object_id: int, data: update_schema, db: Session = Depends(get_db)):
        return crud.update_record(db, model, object_id, data)

    @resource.delete("/{object_id}", status_code=204,
                     dependencies=[Depends(require_catalog_admin)], name=f"delete_{model.__tablename__}")
    def delete_record(object_id: int, db: Session = Depends(get_db)):
        crud.delete_record(db, model, object_id)
        return Response(status_code=204)

    router.include_router(resource)


register_resource("/sports", Sport, SportCreate, SportUpdate, SportOut)
register_resource("/categories", Category, CategoryCreate, CategoryUpdate, CategoryOut)
register_resource("/brands", Brand, BrandCreate, BrandUpdate, BrandOut)