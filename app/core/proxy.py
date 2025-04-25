import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# 代理配置
HTTP_PROXY = os.getenv("HTTP_PROXY")
HTTPS_PROXY = os.getenv("HTTPS_PROXY")

# 是否使用代理
USE_PROXY = bool(HTTP_PROXY) and bool(HTTPS_PROXY)

# 代理设置
PROXIES = None
if USE_PROXY:
    PROXIES = {
        "http://": HTTP_PROXY,
        "https://": HTTPS_PROXY,
    }

# 创建代理客户端
def get_proxy_client():
    """获取配置了代理的 httpx 客户端"""
    if USE_PROXY:
        return httpx.AsyncClient(proxies=PROXIES)
    return httpx.AsyncClient()