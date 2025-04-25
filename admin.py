from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.session import get_db
from app.core.security import authenticate_admin, create_access_token, get_current_admin
from app.db.models import AdminUser

router = APIRouter()


@router.post("/login")
def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """管理员登录"""
    admin = authenticate_admin(db, form_data.username, form_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 更新最后登录时间
    admin.last_login = datetime.now()
    db.commit()

    # 创建访问令牌
    access_token = create_access_token(
        data={"sub": admin.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin_id": admin.admin_id,
        "username": admin.username,
        "role": admin.role
    }


@router.get("/me")
def read_current_admin(
        current_admin: AdminUser = Depends(get_current_admin)
):
    """获取当前管理员信息"""
    return {
        "admin_id": current_admin.admin_id,
        "username": current_admin.username,
        "email": current_admin.email,
        "role": current_admin.role,
        "is_active": current_admin.is_active,
        "last_login": current_admin.last_login
    }


@router.get("/stats")
def get_stats(
        current_admin: AdminUser = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """获取统计数据"""
    from sqlalchemy import func
    # 导入数据库模型
    from app.db.models import User, Push, Log

    # 获取用户数量
    user_count = db.query(func.count(User.user_id)).scalar()

    # 获取活跃用户数量
    active_user_count = db.query(func.count(User.user_id)).filter(User.is_active == True).scalar()

    # 获取推送数量
    push_count = db.query(func.count(Push.push_id)).scalar()

    # 获取已完成推送数量
    completed_push_count = db.query(func.count(Push.push_id)).filter(Push.status == "completed").scalar()

    # 获取发送成功的日志数量
    sent_log_count = db.query(func.count(Log.log_id)).filter(Log.status == "sent").scalar()

    # 获取发送失败的日志数量
    failed_log_count = db.query(func.count(Log.log_id)).filter(Log.status == "failed").scalar()

    # 计算成功率
    success_rate = 0
    if sent_log_count + failed_log_count > 0:
        success_rate = sent_log_count / (sent_log_count + failed_log_count) * 100

    return {
        "user_count": user_count or 0,
        "active_user_count": active_user_count or 0,
        "push_count": push_count or 0,
        "completed_push_count": completed_push_count or 0,
        "sent_log_count": sent_log_count or 0,
        "failed_log_count": failed_log_count or 0,
        "success_rate": success_rate
    }