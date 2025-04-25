from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.crud import users as users_crud
from app.schemas.users import User, UserCreate, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """获取用户列表"""
    return users_crud.get_users(db, skip=skip, limit=limit, active_only=active_only)

@router.get("/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """获取特定用户"""
    db_user = users_crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user

@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db)
):
    """更新用户信息"""
    db_user = users_crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return users_crud.update_user(db, user_id=user_id, user_data=user.dict(exclude_unset=True))

@router.put("/{user_id}/status", response_model=User)
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db)
):
    """更新用户状态"""
    db_user = users_crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return users_crud.update_user(db, user_id=user_id, user_data={"is_active": is_active})