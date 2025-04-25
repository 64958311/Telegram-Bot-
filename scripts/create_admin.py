import sys
import os
import argparse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# 添加项目根目录到 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载环境变量
load_dotenv()

from app.db.models import AdminUser
from app.core.security import get_password_hash


def create_admin(username, password, email, role='admin'):
    # 创建数据库连接
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")

    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 检查用户是否已存在
        existing_admin = db.query(AdminUser).filter(AdminUser.username == username).first()
        if existing_admin:
            print(f"管理员 '{username}' 已存在")
            return

        # 创建新管理员
        new_admin = AdminUser(
            username=username,
            password_hash=get_password_hash(password),
            email=email,
            role=role,
            is_active=True
        )

        db.add(new_admin)
        db.commit()
        print(f"管理员 '{username}' 创建成功")

    except Exception as e:
        db.rollback()
        print(f"创建管理员失败: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="创建管理员账户")
    parser.add_argument("--username", required=True, help="管理员用户名")
    parser.add_argument("--password", required=True, help="管理员密码")
    parser.add_argument("--email", required=True, help="管理员邮箱")
    parser.add_argument("--role", default="admin", choices=["admin", "editor", "viewer"], help="管理员角色")

    args = parser.parse_args()

    create_admin(args.username, args.password, args.email, args.role)