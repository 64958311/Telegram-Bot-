from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import logging
from app.db.session import get_db
from app.crud import pushs as pushs_crud
from app.schemas.pushs import Push, PushCreate, PushUpdate
from app.core.security import get_current_admin
from app.db.models import AdminUser

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=Push)
def create_push(
        push: PushCreate,
        current_admin: Optional[AdminUser] = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """创建新推送"""
    logger.info("接收到创建推送请求")
    push_data = push.dict()

    # 设置创建者ID
    push_data["created_by"] = current_admin.admin_id if current_admin else None

    # 设置为草稿状态
    push_data["status"] = "draft"

    logger.info(f"创建推送数据: {push_data}")
    return pushs_crud.create_push(db, push_data)


@router.get("/", response_model=List[Push])
def read_pushes(
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """获取推送列表"""
    pushes = pushs_crud.get_pushes(db, skip=skip, limit=limit, status=status)
    # 将 JSON 字符串转换回列表
    for push in pushes:
        if isinstance(push.target_user_ids, str):
            try:
                push.target_user_ids = json.loads(push.target_user_ids)
            except:
                push.target_user_ids = []
        # 确保 created_by 有值
        if push.created_by is None:
            push.created_by = 0
    return pushes


@router.get("/{push_id}", response_model=Push)
def read_push(
        push_id: int,
        db: Session = Depends(get_db)
):
    """获取特定推送"""
    db_push = pushs_crud.get_push(db, push_id)
    if db_push is None:
        raise HTTPException(status_code=404, detail="推送不存在")
    # 将 JSON 字符串转换回列表
    if isinstance(db_push.target_user_ids, str):
        try:
            db_push.target_user_ids = json.loads(db_push.target_user_ids)
        except:
            db_push.target_user_ids = []
    return db_push


@router.put("/{push_id}", response_model=Push)
def update_push(
        push_id: int,
        push: PushUpdate,
        db: Session = Depends(get_db)
):
    """更新推送信息"""
    db_push = pushs_crud.get_push(db, push_id)
    if db_push is None:
        raise HTTPException(status_code=404, detail="推送不存在")

    # 若状态为已完成或已发送，则不允许更新
    if db_push.status in ["completed", "sending"]:
        raise HTTPException(status_code=400, detail="已发送或正在发送的推送不能更新")

    push_data = push.dict(exclude_unset=True)
    updated_push = pushs_crud.update_push(db, push_id=push_id, push_data=push_data)

    # 将 JSON 字符串转换回列表
    if isinstance(updated_push.target_user_ids, str):
        try:
            updated_push.target_user_ids = json.loads(updated_push.target_user_ids)
        except:
            updated_push.target_user_ids = []

    return updated_push


@router.delete("/{push_id}", response_model=bool)
def delete_push(
        push_id: int,
        db: Session = Depends(get_db)
):
    """删除推送"""
    db_push = pushs_crud.get_push(db, push_id)
    if db_push is None:
        raise HTTPException(status_code=404, detail="推送不存在")

    # 若状态为已完成或已发送，则不允许删除
    if db_push.status in ["completed", "sending"]:
        raise HTTPException(status_code=400, detail="已发送或正在发送的推送不能删除")

    return pushs_crud.delete_push(db, push_id=push_id)


@router.post("/{push_id}/send", response_model=dict)
async def send_push_message(
        push_id: int,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    """发送推送消息"""
    logger.info(f"接收到发送推送请求: {push_id}")

    db_push = pushs_crud.get_push(db, push_id)
    if db_push is None:
        raise HTTPException(status_code=404, detail="推送不存在")

    # 只有已完成的推送不能重新发送
    if db_push.status == "completed":
        raise HTTPException(status_code=400, detail="该推送已经完成发送")

    # 更新推送状态为正在发送
    pushs_crud.update_push_status(db, push_id=push_id, status="sending")

    # 打印推送信息用于调试
    logger.info(f"推送ID: {push_id}, 标题: {db_push.title}")
    logger.info(f"内容: {db_push.content[:100]}...")
    logger.info(f"使用Markdown: {getattr(db_push, 'use_markdown', False)}")
    logger.info(f"按钮数据: {getattr(db_push, 'buttons', 'None')}")

    # 使用后台任务发送
    try:
        from app.services.push_service import send_push
        background_tasks.add_task(send_push, push_id)
        logger.info(f"已添加推送任务到后台: {push_id}")
        return {"message": "推送任务已添加到队列，正在后台发送"}
    except Exception as e:
        logger.error(f"添加推送任务失败: {e}")
        pushs_crud.update_push_status(db, push_id=push_id, status="draft")  # 重置状态
        raise HTTPException(status_code=500, detail=f"发送失败: {str(e)}")


@router.post("/{push_id}/cancel", response_model=Push)
def cancel_push(
        push_id: int,
        db: Session = Depends(get_db)
):
    """取消推送"""
    db_push = pushs_crud.get_push(db, push_id)
    if db_push is None:
        raise HTTPException(status_code=404, detail="推送不存在")

    # 只有草稿或计划中的推送可以取消
    if db_push.status not in ["draft", "scheduled"]:
        raise HTTPException(status_code=400, detail="只有草稿或计划中的推送可以取消")

    updated_push = pushs_crud.update_push_status(db, push_id=push_id, status="cancelled")

    # 将 JSON 字符串转换回列表
    if isinstance(updated_push.target_user_ids, str):
        try:
            updated_push.target_user_ids = json.loads(updated_push.target_user_ids)
        except:
            updated_push.target_user_ids = []

    return updated_push


@router.delete("/{push_id}/message", response_model=dict)
async def delete_push_message(
        push_id: int,
        db: Session = Depends(get_db)
):
    """删除已发送的推送消息"""
    logger.info(f"接收到删除推送消息请求: {push_id}")

    db_push = pushs_crud.get_push(db, push_id)
    if db_push is None:
        raise HTTPException(status_code=404, detail="推送不存在")

    try:
        # 导入推送服务
        from app.services.push_service import delete_sent_message
        result = await delete_sent_message(push_id)
        return {"message": "消息删除成功", "details": result}
    except Exception as e:
        logger.error(f"删除消息失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")