from sqlalchemy.orm import Session
from app.db.models import Push
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


def get_push(db: Session, push_id: int):
    """获取特定推送"""
    return db.query(Push).filter(Push.push_id == push_id).first()


def get_pushes(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    """获取推送列表"""
    query = db.query(Push)
    if status:
        query = query.filter(Push.status == status)
    return query.order_by(Push.created_at.desc()).offset(skip).limit(limit).all()


def create_push(db: Session, push_data: dict):
    """创建新推送"""
    logger.info(f"创建推送数据: {push_data}")

    try:
        # 确保target_user_ids是JSON字符串
        if "target_user_ids" in push_data and isinstance(push_data["target_user_ids"], list):
            push_data["target_user_ids"] = json.dumps(push_data["target_user_ids"])

        # 确保buttons是JSON字符串
        if "buttons" in push_data and push_data["buttons"] and not isinstance(push_data["buttons"], str):
            push_data["buttons"] = json.dumps(push_data["buttons"])

        # 创建推送对象
        db_push = Push(**push_data)
        db.add(db_push)
        db.commit()
        db.refresh(db_push)
        return db_push
    except Exception as e:
        logger.error(f"创建推送失败: {e}")
        db.rollback()
        raise


def update_push(db: Session, push_id: int, push_data: dict):
    """更新推送信息"""
    db_push = get_push(db, push_id)
    if db_push:
        try:
            # 处理target_user_ids
            if "target_user_ids" in push_data and isinstance(push_data["target_user_ids"], list):
                push_data["target_user_ids"] = json.dumps(push_data["target_user_ids"])

            # 处理buttons
            if "buttons" in push_data and push_data["buttons"] and not isinstance(push_data["buttons"], str):
                push_data["buttons"] = json.dumps(push_data["buttons"])

            # 更新字段
            for key, value in push_data.items():
                setattr(db_push, key, value)

            db_push.updated_at = datetime.now()
            db.commit()
            db.refresh(db_push)
            return db_push
        except Exception as e:
            logger.error(f"更新推送失败: {e}")
            db.rollback()
            raise
    return None


def delete_push(db: Session, push_id: int):
    """删除推送"""
    db_push = get_push(db, push_id)
    if db_push:
        try:
            db.delete(db_push)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"删除推送失败: {e}")
            db.rollback()
            raise
    return False


def update_push_status(db: Session, push_id: int, status: str):
    """更新推送状态"""
    db_push = get_push(db, push_id)
    if db_push:
        try:
            db_push.status = status
            db_push.updated_at = datetime.now()
            db.commit()
            db.refresh(db_push)
            return db_push
        except Exception as e:
            logger.error(f"更新推送状态失败: {e}")
            db.rollback()
            raise
    return None


def increment_sent_count(db: Session, push_id: int):
    """增加发送计数"""
    db_push = get_push(db, push_id)
    if db_push:
        try:
            db_push.sent_count += 1
            db.commit()
            db.refresh(db_push)
            return db_push
        except Exception as e:
            logger.error(f"增加发送计数失败: {e}")
            db.rollback()
            raise
    return None