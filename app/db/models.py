from sqlalchemy import Boolean, Column, Integer, BigInteger, String, Text, Enum, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False)  # 使用BigInteger
    username = Column(String(191))
    first_name = Column(String(191))
    last_name = Column(String(191))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    last_interaction_at = Column(TIMESTAMP, nullable=True)

class AdminUser(Base):
    __tablename__ = "admin_users"

    admin_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(191), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(191), unique=True, nullable=False)
    role = Column(Enum('admin', 'editor', 'viewer'), default='editor')
    is_active = Column(Boolean, default=True)
    last_login = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class Push(Base):
    __tablename__ = "pushs"

    push_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(191), nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(Enum('text', 'photo', 'video', 'document', 'audio'), default='text')
    media_url = Column(String(1024))
    scheduled_time = Column(TIMESTAMP, nullable=True)
    status = Column(Enum('draft', 'scheduled', 'sending', 'completed', 'cancelled'), default='draft')
    target_user_ids = Column(JSON)
    created_by = Column(Integer, ForeignKey("admin_users.admin_id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    read_count = Column(Integer, default=0)
    use_markdown = Column(Boolean, default=False)  # 新字段
    buttons = Column(Text, nullable=True)  # 新字段

class Log(Base):
    __tablename__ = "logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    push_id = Column(Integer, ForeignKey("pushs.push_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    status = Column(Enum('sent', 'delivered', 'read', 'failed'), nullable=False)
    error_message = Column(Text)
    sent_at = Column(TIMESTAMP, nullable=True)
    delivered_at = Column(TIMESTAMP, nullable=True)
    read_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    message_id = Column(BigInteger, nullable=True)  # 添加消息ID字段