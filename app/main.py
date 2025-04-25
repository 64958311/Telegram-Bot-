import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from app.api import api_router
from app.db.models import Base
from app.db.session import engine
from app.bot.bot import setup_bot

# 配置日志
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)
logger = logging.getLogger(__name__)

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建 Bot 实例
bot_app = setup_bot()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动事件
    try:
        logger.info("Starting the Telegram Bot...")
        # 启动 Bot 并保持在后台运行
        if bot_app:
            await bot_app.initialize()
            await bot_app.start()
            await bot_app.updater.start_polling()
    except Exception as e:
        logger.error(f"Error starting Telegram Bot: {e}")

    yield  # 这里是应用运行时

    # 关闭事件
    try:
        logger.info("Stopping the Telegram Bot...")
        # 停止 Bot
        if bot_app:
            await bot_app.updater.stop()
            await bot_app.stop()
            await bot_app.shutdown()
    except Exception as e:
        logger.error(f"Error stopping Telegram Bot: {e}")


# 创建 FastAPI 应用
app = FastAPI(
    title="Telegram Push Bot",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Telegram Push Bot API"}


# 如果直接运行此文件
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)