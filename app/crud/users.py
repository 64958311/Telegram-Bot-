from sqlalchemy.orm import Session
from app.db.models import User
from datetime import datetime

def get_user_by_telegram_id(db: Session, telegram_id: int):
    """根据 Telegram ID 获取用户"""
    return db.query(User).filter(User.telegram_id == telegram_id).first()

def get_user(db: Session, user_id: int):
    """根据用户 ID 获取用户"""
    return db.query(User).filter(User.user_id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    """获取用户列表"""
    query = db.query(User)
    if active_only:
        query = query.filter(User.is_active == True)
    return query.offset(skip).limit(limit).all()

def create_user(db: Session, user_data: dict):
    """创建新用户"""
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_data: dict):
    """更新用户信息"""
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in user_data.items():
            setattr(db_user, key, value)
        db_user.updated_at = datetime.now()
        db.commit()
        db.refresh(db_user)
    return db_user

def deactivate_user(db: Session, user_id: int):
    """停用用户"""
    db_user = get_user(db, user_id)
    if db_user:
        db_user.is_active = False
        db_user.updated_at = datetime.now()
        db.commit()
        db.refresh(db_user)
    return db_user