from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app import models
from app.schemas.match_posts import MatchPostCreate,MatchPostUpdate
router = APIRouter(prefix="/match-posts", tags=["Matchmaking (Tìm bạn chơi)"])

# 1. API Đăng bài tìm bạn chơi (Customer)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_match_post(post_in: MatchPostCreate, user_id: int = 1, db: Session = Depends(get_db)):
    # Tạo bài đăng mới theo thông tin từ client
    new_post = models.MatchPost(
        user_id=user_id,
        sport_id=post_in.sport_id,
        match_time=post_in.match_time,
        location=post_in.location,
        skill_level=post_in.skill_level,
        contact_info=post_in.contact_info,
        status="OPEN"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

# 2. API Lọc danh sách bài đăng theo môn, ngày, địa điểm (Guest, Customer)
@router.get("/")
def get_match_posts(
    sport_id: Optional[int] = None,
    location: Optional[str] = None,
    date_str: Optional[str] = Query(None, description="Lọc theo ngày, định dạng: YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    query = db.query(models.MatchPost).filter(models.MatchPost.status == "OPEN")
    
    if sport_id:
        query = query.filter(models.MatchPost.sport_id == sport_id)
    if location:
        query = query.filter(models.MatchPost.location.ilike(f"%{location}%"))
    if date_str:
        query = query.filter(models.MatchPost.match_time.like(f"{date_str}%"))
        
    return query.all()

# 3. API Chủ bài sửa / đóng / huỷ bài đăng
@router.put("/{post_id}")
def update_match_post(post_id: int, post_update: MatchPostUpdate, db: Session = Depends(get_db)):
    post = db.query(models.MatchPost).filter(models.MatchPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài đăng ghép kèo")
    
    update_data = post_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(post, key, value)
        
    db.commit()
    db.refresh(post)
    return post

# 4. API Admin ẩn/hủy bài viết không phù hợp
@router.put("/admin/{post_id}/hide")
def admin_hide_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.MatchPost).filter(models.MatchPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài đăng")
    
    post.status = "CANCELLED"
    db.commit()
    return {"message": "Đã ẩn và hủy bài đăng không phù hợp thành công"}