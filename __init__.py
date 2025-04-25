from fastapi import APIRouter
from app.api import users, pushs, logs, admin

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pushs.router, prefix="/pushs", tags=["pushs"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])