from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.crud import logs as logs_crud
from app.schemas.logs import Log

router = APIRouter()

@router.get("/", response_model=List[Log])
def read_logs(
    skip: int = 0,
    limit: int = 100,
    push_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取日志列表"""
    return logs_crud.get_logs(
        db,
        skip=skip,
        limit=limit,
        push_id=push_id,
        user_id=user_id,
        status=status
    )

@router.get("/{push_id}", response_model=List[Log])
def read_push_logs(
    push_id: int,
    db: Session = Depends(get_db)
):
    """获取特定推送的日志"""
    return logs_crud.get_logs(db, push_id=push_id)

@router.get("/users/{user_id}", response_model=List[Log])
def read_user_logs(
    user_id: int,
    db: Session = Depends(get_db)
):
    """获取特定用户的日志"""
    return logs_crud.get_logs(db, user_id=user_id)