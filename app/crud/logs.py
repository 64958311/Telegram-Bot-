from sqlalchemy.orm import Session
from app.db.models import Log
from datetime import datetime


def create_log(db: Session, log_data: dict):
    """创建新日志"""
    db_log = Log(**log_data)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def get_logs(db: Session, skip: int = 0, limit: int = 100, push_id: int = None, user_id: int = None,
             status: str = None):
    """获取日志列表"""
    query = db.query(Log)

    if push_id:
        query = query.filter(Log.push_id == push_id)
    if user_id:
        query = query.filter(Log.user_id == user_id)
    if status:
        query = query.filter(Log.status == status)

    return query.order_by(Log.created_at.desc()).offset(skip).limit(limit).all()


def get_log_by_push_and_user(db: Session, push_id: int, user_id: int):
    """获取特定推送和用户的日志"""
    return db.query(Log).filter(Log.push_id == push_id, Log.user_id == user_id).first()


def update_log_status(db: Session, log_id: int, status: str, timestamp_field: str = None):
    """更新日志状态"""
    db_log = db.query(Log).filter(Log.log_id == log_id).first()
    if db_log:
        db_log.status = status

        # 更新相应的时间戳字段
        if timestamp_field and hasattr(db_log, timestamp_field):
            setattr(db_log, timestamp_field, datetime.now())

        db.commit()
        db.refresh(db_log)
    return db_log