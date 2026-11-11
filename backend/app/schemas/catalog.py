"""Request/response schemas for the catalog module."""
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.catalog import CommonStatusEnum


class CatalogInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    @model_validator(mode="before")
    @classmethod
    def normalize_name(cls, values):
        if isinstance(values, dict) and isinstance(values.get("name"), str):
            values = {**values, "name": " ".join(values["name"].split())}
        return values


class SportCreate(CatalogInput):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    status: CommonStatusEnum = CommonStatusEnum.ACTIVE


class CatalogUpdate(CatalogInput):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    slug: str | None = Field(default=None, min_length=1, max_length=150, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    status: CommonStatusEnum | None = None

    @model_validator(mode="after")
    def reject_required_nulls(self):
        for field in self.model_fields_set & {"name", "slug", "status"}:
            if getattr(self, field) is None:
                raise ValueError(f"{field} không được null")
        return self


class SportUpdate(CatalogUpdate):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    slug: str | None = Field(default=None, min_length=1, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None


class CategoryCreate(CatalogInput):
    name: str = Field(min_length=1, max_length=150)
    slug: str = Field(min_length=1, max_length=150, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    parent_id: int | None = Field(default=None, gt=0)
    status: CommonStatusEnum = CommonStatusEnum.ACTIVE


class CategoryUpdate(CatalogUpdate):
    parent_id: int | None = Field(default=None, gt=0)


class BrandCreate(CatalogInput):
    name: str = Field(min_length=1, max_length=150)
    slug: str = Field(min_length=1, max_length=150, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    logo_url: str | None = Field(default=None, max_length=500)
    status: CommonStatusEnum = CommonStatusEnum.ACTIVE


class BrandUpdate(CatalogUpdate):
    logo_url: str | None = Field(default=None, max_length=500)


class SportOut(SportCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CategoryOut(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BrandOut(BrandCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CategoryTree(CategoryOut):
    children: list["CategoryTree"] = Field(default_factory=list)


class MenuNode(CategoryOut):
    brands: list[BrandOut] = Field(default_factory=list)
    children: list["MenuNode"] = Field(default_factory=list)