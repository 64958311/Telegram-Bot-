import asyncio
import json
import logging
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import SessionLocal
from app.crud import pushs as pushs_crud
from app.crud import users as users_crud
from app.crud import logs as logs_crud
from app.bot.config import BOT_TOKEN

# 配置日志
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


def escape_markdown(text):
    """转义 Markdown 特殊字符"""
    if not text:
        return ""
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return ''.join([f'\\{char}' if char in escape_chars else char for char in text])


async def send_push(push_id: int):
    """发送推送消息的异步任务"""
    # 创建一个新的数据库会话
    db = SessionLocal()
    try:
        logger.info(f"开始发送推送 ID: {push_id}")
        # 获取推送信息
        push = pushs_crud.get_push(db, push_id)
        if not push:
            logger.error(f"推送不存在: {push_id}")
            return

        # 解析目标用户ID
        target_user_ids = []
        if isinstance(push.target_user_ids, str):
            try:
                target_user_ids = json.loads(push.target_user_ids)
                logger.info(f"目标用户数量: {len(target_user_ids)}")
            except json.JSONDecodeError:
                logger.error(f"解析目标用户ID失败: {push.target_user_ids}")
                pushs_crud.update_push_status(db, push_id, "cancelled")
                return
        else:
            target_user_ids = push.target_user_ids

        # 获取目标用户
        users = []
        for user_id in target_user_ids:
            user = users_crud.get_user(db, user_id)
            if user and user.is_active:
                users.append(user)

        logger.info(f"找到活跃用户数量: {len(users)}")

        # 导入Telegram库
        try:
            from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
        except ImportError:
            logger.error("无法导入telegram库，请确保已安装 python-telegram-bot")
            pushs_crud.update_push_status(db, push_id, "cancelled")
            return

        # 解析按钮数据
        keyboard = None
        if hasattr(push, 'buttons') and push.buttons:
            try:
                logger.info(f"处理按钮数据: {push.buttons}")
                if isinstance(push.buttons, str):
                    buttons_data = json.loads(push.buttons)
                else:
                    buttons_data = push.buttons

                logger.info(f"解析后的按钮数据: {buttons_data}")

                # 构建按钮键盘
                keyboard_buttons = []
                for btn in buttons_data:
                    row = []
                    if 'text' not in btn or not btn['text']:
                        logger.warning(f"按钮缺少文本: {btn}")
                        continue

                    if 'url' in btn and btn['url']:
                        logger.info(f"添加URL按钮: {btn['text']} -> {btn['url']}")
                        row.append(InlineKeyboardButton(text=btn['text'], url=btn['url']))
                    elif 'callback_data' in btn and btn['callback_data']:
                        logger.info(f"添加回调按钮: {btn['text']} -> {btn['callback_data']}")
                        row.append(InlineKeyboardButton(text=btn['text'], callback_data=btn['callback_data']))

                    if row:
                        keyboard_buttons.append(row)

                if keyboard_buttons:
                    keyboard = InlineKeyboardMarkup(keyboard_buttons)
                    logger.info(f"创建了带有 {len(keyboard_buttons)} 行按钮的键盘")
                else:
                    logger.warning("未能创建有效的按钮键盘")
            except Exception as e:
                logger.error(f"解析按钮数据失败: {e}")

        # 创建Bot实例
        bot = Bot(token=BOT_TOKEN)

        # 发送消息计数
        success_count = 0
        fail_count = 0

        # 发送消息
        for user in users:
            try:
                logger.info(f"向用户 {user.telegram_id} 发送 {push.content_type} 类型消息")

                # 使用Markdown (如果启用)
                parse_mode = None
                if hasattr(push, 'use_markdown') and push.use_markdown:
                    parse_mode = "MarkdownV2"
                    logger.info(f"使用 MarkdownV2 格式")

                # 根据内容类型发送不同类型的消息
                if push.content_type == "text":
                    result = await bot.send_message(
                        chat_id=user.telegram_id,
                        text=push.content,
                        parse_mode=parse_mode,
                        reply_markup=keyboard
                    )

                    # 记录消息ID
                    message_id = result.message_id

                    # 记录发送成功
                    logs_crud.create_log(db, {
                        "push_id": push.push_id,
                        "user_id": user.user_id,
                        "status": "sent",
                        "sent_at": datetime.now(),
                        "message_id": message_id  # 保存消息ID
                    })

                elif push.content_type == "photo":
                    try:
                        result = await bot.send_photo(
                            chat_id=user.telegram_id,
                            photo=push.media_url,
                            caption=push.content,
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                    except Exception as e:
                        logger.error(f"发送图片失败: {e}")
                        result = await bot.send_message(
                            chat_id=user.telegram_id,
                            text=f"[图片] {push.content}\n{push.media_url}",
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                elif push.content_type == "video":
                    try:
                        result = await bot.send_video(
                            chat_id=user.telegram_id,
                            video=push.media_url,
                            caption=push.content,
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                    except Exception as e:
                        logger.error(f"发送视频失败: {e}")
                        result = await bot.send_message(
                            chat_id=user.telegram_id,
                            text=f"[视频] {push.content}\n{push.media_url}",
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                elif push.content_type == "document":
                    try:
                        result = await bot.send_document(
                            chat_id=user.telegram_id,
                            document=push.media_url,
                            caption=push.content,
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                    except Exception as e:
                        logger.error(f"发送文档失败: {e}")
                        result = await bot.send_message(
                            chat_id=user.telegram_id,
                            text=f"[文档] {push.content}\n{push.media_url}",
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                elif push.content_type == "audio":
                    try:
                        result = await bot.send_audio(
                            chat_id=user.telegram_id,
                            audio=push.media_url,
                            caption=push.content,
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                    except Exception as e:
                        logger.error(f"发送音频失败: {e}")
                        result = await bot.send_message(
                            chat_id=user.telegram_id,
                            text=f"[音频] {push.content}\n{push.media_url}",
                            parse_mode=parse_mode,
                            reply_markup=keyboard
                        )

                        # 记录消息ID
                        message_id = result.message_id

                        # 记录发送成功
                        logs_crud.create_log(db, {
                            "push_id": push.push_id,
                            "user_id": user.user_id,
                            "status": "sent",
                            "sent_at": datetime.now(),
                            "message_id": message_id
                        })

                # 更新发送计数
                pushs_crud.increment_sent_count(db, push_id)
                success_count += 1

                # 避免发送太快触发限制
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"发送消息失败: {e}")
                logs_crud.create_log(db, {
                    "push_id": push.push_id,
                    "user_id": user.user_id,
                    "status": "failed",
                    "error_message": str(e)
                })
                fail_count += 1

        # 更新推送状态
        pushs_crud.update_push_status(db, push_id, "completed")
        logger.info(f"推送 {push_id} 发送完成。成功: {success_count}, 失败: {fail_count}")

    except Exception as e:
        logger.error(f"发送推送时出错: {e}")
        pushs_crud.update_push_status(db, push_id, "cancelled")
    finally:
        db.close()


async def delete_sent_message(push_id: int):
    """删除已发送的推送消息"""
    # 创建一个新的数据库会话
    db = SessionLocal()
    try:
        logger.info(f"开始删除推送 ID: {push_id} 的消息")
        # 获取推送信息
        push = pushs_crud.get_push(db, push_id)
        if not push:
            logger.error(f"推送不存在: {push_id}")
            return {"success": False, "error": "推送不存在"}

        # 获取该推送的所有成功发送日志
        logs = logs_crud.get_logs(db, push_id=push_id, status="sent")
        if not logs:
            logger.warning(f"未找到推送 {push_id} 的发送记录")
            return {"success": False, "error": "未找到发送记录"}

        logger.info(f"找到 {len(logs)} 条发送记录")

        # 导入Telegram库
        try:
            from telegram import Bot
        except ImportError:
            logger.error("无法导入telegram库")
            return {"success": False, "error": "无法导入telegram库"}

        # 创建Bot实例
        bot = Bot(token=BOT_TOKEN)

        # 删除消息计数
        success_count = 0
        fail_count = 0

        # 尝试删除每条消息
        for log in logs:
            try:
                # 检查是否有消息ID
                if not log.message_id:
                    logger.warning(f"日志 {log.log_id} 没有消息ID")
                    fail_count += 1
                    continue

                # 获取用户信息
                user = users_crud.get_user(db, log.user_id)
                if not user:
                    logger.warning(f"找不到用户ID {log.user_id}")
                    fail_count += 1
                    continue

                logger.info(f"尝试删除用户 {user.telegram_id} 的消息 {log.message_id}")

                # 删除消息
                await bot.delete_message(
                    chat_id=user.telegram_id,
                    message_id=log.message_id
                )

                logger.info(f"成功删除消息 {log.message_id}")
                success_count += 1

            except Exception as e:
                logger.error(f"删除消息失败: {e}")
                fail_count += 1

        return {
            "success": True,
            "deleted_count": success_count,
            "failed_count": fail_count
        }

    except Exception as e:
        logger.error(f"删除消息过程中出错: {e}")
        return {"success": False, "error": str(e)}
    finally:
        db.close()