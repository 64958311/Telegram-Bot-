import os
from dotenv import load_dotenv

load_dotenv()

# Bot 配置
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# 代理配置
PROXY_URL = os.getenv("HTTP_PROXY")

# 是否使用代理
USE_PROXY = bool(PROXY_URL)

# 其他配置
REQUEST_KWARGS = {
    'proxy_url': PROXY_URL if USE_PROXY else None,
}