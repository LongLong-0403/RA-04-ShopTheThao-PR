"""Storefront images managed by administrators."""

import base64
import binascii
import hashlib
import re
from typing import Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import ForeignKey, JSON, LargeBinary, String
from sqlalchemy.dialects.mysql import MEDIUMBLOB
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.deps import require_admin
from app.db.session import Base, get_db

router = APIRouter(tags=["Storefront images"])
ASSET_URL = re.compile(r"/api/media/([a-f0-9]{64})")
LOCAL_IMAGE = re.compile(r"/frontend/assets/(?:[\w-]+/)*[\w.-]+\.(?:jpg|jpeg|png|webp|gif)(?:\?v=\d+)?", re.IGNORECASE)
IMAGE_TYPES = {"png": "image/png", "jpeg": "image/jpeg", "webp": "image/webp"}


class StorefrontImage(Base):
    __tablename__ = "storefront_images"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    mime_type: Mapped[str] = mapped_column(String(20))
    content: Mapped[bytes] = mapped_column(LargeBinary().with_variant(MEDIUMBLOB(), "mysql"))


class HomeBanner(Base):
    __tablename__ = "home_banners"

    slot: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    image_url: Mapped[str] = mapped_column(String(500))


class HomeBannerFraming(Base):
    __tablename__ = "home_banner_framing"

    slot: Mapped[int] = mapped_column(ForeignKey("home_banners.slot", ondelete="CASCADE"), primary_key=True)
    settings: Mapped[dict] = mapped_column(JSON)


class BannerFrame(BaseModel):
    fit: Literal["cover", "contain"] = "cover"
    zoom: int = Field(default=100, ge=100, le=200)
    x: int = Field(default=50, ge=0, le=100)
    y: int = Field(default=0, ge=0, le=100)


class BannerFraming(BaseModel):
    desktop: BannerFrame = Field(default_factory=BannerFrame)
    mobile: BannerFrame = Field(default_factory=BannerFrame)


class BannerInput(BaseModel):
    image: str = Field(max_length=5_592_432)
    framing: BannerFraming | None = None


def store_image(db: Session, source: str) -> str:
    source = source.strip()
    asset = ASSET_URL.fullmatch(source)
    if asset:
        if db.get(StorefrontImage, asset[1]) is None:
            raise HTTPException(422, "Không tìm thấy ảnh đã tải lên.")
        return source
    if LOCAL_IMAGE.fullmatch(source):
        return source
    if len(source) <= 500 and source.startswith(("https://", "http://")):
        try:
            if urlsplit(source).hostname and not re.search(r"\s", source):
                return source
        except ValueError:
            pass
    header, _, encoded = source.partition(",")
    kind = next((kind for kind, mime in IMAGE_TYPES.items() if header == f"data:{mime};base64"), None)
    if not kind or len(encoded) > 5_592_408:
        raise HTTPException(422, "Chọn ảnh JPG, PNG hoặc WebP tối đa 4 MB, hoặc nhập URL ảnh hợp lệ.")
    try:
        content = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(422, "Dữ liệu ảnh không hợp lệ.") from None

    signatures = {
        "png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "jpeg": content.startswith(b"\xff\xd8\xff"),
        "webp": content.startswith(b"RIFF") and content[8:12] == b"WEBP",
    }
    if len(content) > 4 * 1024 * 1024 or not signatures[kind]:
        raise HTTPException(422, "Nội dung ảnh không đúng định dạng hoặc vượt quá 4 MB.")
    digest = hashlib.sha256(content).hexdigest()
    if db.get(StorefrontImage, digest) is None:
        db.add(StorefrontImage(id=digest, mime_type=IMAGE_TYPES[kind], content=content))
        db.flush()
    return f"/api/media/{digest}"


@router.get("/media/{image_id}")
def read_image(image_id: str, db: Session = Depends(get_db)):
    row = db.get(StorefrontImage, image_id)
    if row is None:
        raise HTTPException(404, "Không tìm thấy ảnh.")
    return Response(row.content, media_type=row.mime_type, headers={
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
    })


@router.get("/home-banners")
def read_banners(include_framing: bool = False, db: Session = Depends(get_db)):
    banners = db.query(HomeBanner).all()
    if not include_framing:
        return {row.slot: row.image_url for row in banners}
    settings = {row.slot: row.settings for row in db.query(HomeBannerFraming).all()}
    return {row.slot: {"image_url": row.image_url, "framing": settings.get(row.slot)}
            for row in banners}


@router.put("/home-banners/{slot}", dependencies=[Depends(require_admin)])
def update_banner(slot: int, data: BannerInput, db: Session = Depends(get_db)):
    if slot not in (1, 2, 3):
        raise HTTPException(404, "Không tìm thấy vị trí banner.")
    source = store_image(db, data.image)
    db.merge(HomeBanner(slot=slot, image_url=source))
    if data.framing is not None:
        db.flush()
        db.merge(HomeBannerFraming(slot=slot, settings=data.framing.model_dump()))
    db.commit()
    saved = db.get(HomeBannerFraming, slot)
    return {"slot": slot, "image_url": source, "framing": saved.settings if saved else None}
