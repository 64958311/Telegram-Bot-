import logging
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram.error import TelegramError
import httpx
import asyncio
from app.bot.config import BOT_TOKEN, REQUEST_KWARGS
from app.db.session import get_db
from app.crud.users import create_user, get_user_by_telegram_id
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.proxy import PROXIES, USE_PROXY

# 配置日志
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


# 命令处理器
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """处理 /start 命令，注册用户"""
    telegram_user = update.effective_user
    db = next(get_db())

    try:
        # 检查用户是否已存在
        user = get_user_by_telegram_id(db, telegram_user.id)

        if not user:
            # 创建新用户
            new_user = {
                "telegram_id": telegram_user.id,
                "username": telegram_user.username,
                "first_name": telegram_user.first_name,
                "last_name": telegram_user.last_name,
                "is_active": True,
                "last_interaction_at": datetime.now()
            }
            create_user(db, new_user)
            await update.message.reply_text(
                f"欢迎使用消息推送机器人，{telegram_user.first_name}！\n"
                f"您已成功注册，将会收到管理员发送的消息。"
            )
        else:
            # 更新用户的最后交互时间
            user.last_interaction_at = datetime.now()
            db.commit()

            await update.message.reply_text(
                f"您好，{telegram_user.first_name}！\n"
                f"您已经注册过了，将会继续收到管理员发送的消息。"
            )
    except Exception as e:
        logger.error(f"Error in start command: {e}")
        await update.message.reply_text(
            "抱歉，发生了错误。请稍后再试。"
        )
        db.rollback()


# 初始化 Bot
def setup_bot():
    """设置并返回 Telegram Bot 应用实例"""
    try:
        # 配置代理
        proxy_url = None
        if USE_PROXY:
            proxy_url = PROXIES.get("https://")

        # 创建应用实例
        application_builder = Application.builder().token(BOT_TOKEN)

        # 如果有代理，配置代理
        if proxy_url:
            application_builder.proxy_url(proxy_url)

        application = application_builder.build()

        # 注册命令处理器
        application.add_handler(CommandHandler("start", start_command))

        return application
    except Exception as e:
        logger.error(f"Error setting up bot: {e}")
        return None


# 运行 Bot
async def run_bot():
    """启动 Bot 并保持运行"""
    application = setup_bot()
    if application:
        await application.initialize()
        await application.start()
        await application.updater.start_polling()

        # 保持 Bot 运行
        try:
            await application.updater.stop()
            await application.stop()
        except Exception as e:
            logger.error(f"Error stopping bot: {e}")
    else:
        logger.error("Failed to set up bot application")


# 发送消息功能
async def send_message(chat_id, text, parse_mode=None, **kwargs):
    """通过代理发送消息"""
    try:
        # 使用 httpx 创建代理客户端
        async with httpx.AsyncClient(proxies=REQUEST_KWARGS.get('proxy_url')) as client:
            bot = Bot(token=BOT_TOKEN)
            await bot.initialize()
            await bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=parse_mode,
                **kwargs
            )
    except TelegramError as e:
        logger.error(f"Telegram error when sending message: {e}")
        raise
    except Exception as e:
        logger.error(f"Error when sending message: {e}")
        raise