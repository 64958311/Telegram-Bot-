# Telegram Push Bot 文档

## 📋 功能特性

* 管理员通过 Web 界面控制消息推送
* 支持多种消息类型（文本、图片、视频、文档、音频）
* 支持 Markdown 格式文本
* 支持添加内联按钮
* 支持定时发送
* 支持选择性推送（可选择特定用户）
* 支持删除已发送的消息
* 详细的推送日志记录

## 🛠️ 技术栈

* **后端**：Python + FastAPI
* **数据库**：MySQL
* **前端**：React + Ant Design
* **Telegram API**：python-telegram-bot
* **部署**：Docker + Docker Compose

## 📥 安装与设置

### 环境要求

* Python 3.9+
* Node.js 14+
* MySQL 8.0+
* 有效的 Telegram Bot Token

### 获取代码

```
git clone https://github.com/64958311/Telegram-Bot-.git
cd telegram-push-bot
```

### 后端设置

#### 创建虚拟环境

```
python -m venv venv
source venv/bin/activate  # Windows 使用: venv\Scripts\activate
```

#### 安装依赖

```
pip install -r requirements.txt
```

#### 创建环境变量文件 .env

```
# 数据库配置
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=telegram_bot
DB_HOST=localhost
DB_PORT=3306

# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=your_bot_token

# 安全配置
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# 代理配置（如需）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

#### 创建数据库

```
CREATE DATABASE telegram_bot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 运行迁移脚本创建表

```
# 如果使用 Alembic
alembic upgrade head

# 或直接使用 SQL 脚本
mysql -u your_user -p telegram_bot < scripts/schema.sql
```

#### 创建管理员账户

```
python scripts/create_admin.py --username admin --password yourpassword --email admin@example.com --role admin
```

### 前端设置

#### 进入前端目录

```
cd frontend
```

#### 安装依赖

```
npm install
```

#### 修改 API 地址（如需要）

编辑 `src/services/api.js` 文件中的 `baseURL` 为后端地址

## 🚀 运行项目

### 开发环境

#### 启动后端

```
cd telegram-push-bot
source venv/bin/activate  # Windows 使用: venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 启动前端

```
cd frontend
npm start
```

### 生产环境 (Docker)

使用 Docker Compose 部署：

```
docker-compose up -d
```

## 💾 数据库结构

### users 表

```
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(191),
    first_name VARCHAR(191),
    last_name VARCHAR(191),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP
);
```

### pushs 表

```
CREATE TABLE pushs (
    push_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('text', 'photo', 'video', 'document', 'audio') DEFAULT 'text',
    media_url VARCHAR(1024),
    scheduled_time TIMESTAMP,
    status ENUM('draft', 'scheduled', 'sending', 'completed', 'cancelled') DEFAULT 'draft',
    target_user_ids JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sent_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    read_count INT DEFAULT 0,
    use_markdown BOOLEAN DEFAULT FALSE,
    buttons TEXT,
    FOREIGN KEY (created_by) REFERENCES admin_users(admin_id)
);
```

### logs 表

```
CREATE TABLE logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    push_id INT,
    user_id INT,
    status ENUM('sent', 'delivered', 'read', 'failed') NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_id BIGINT,
    FOREIGN KEY (push_id) REFERENCES pushs(push_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### admin\_users 表

```
CREATE TABLE admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'editor',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 📃 API 接口

### 用户相关

* `GET /api/users` - 获取用户列表
* `GET /api/users/{user_id}` - 获取特定用户信息
* `PUT /api/users/{user_id}/status` - 更新用户状态

### 推送相关

* `POST /api/pushs` - 创建新推送
* `GET /api/pushs` - 获取推送列表
* `GET /api/pushs/{push_id}` - 获取特定推送详情
* `PUT /api/pushs/{push_id}` - 更新推送信息
* `DELETE /api/pushs/{push_id}` - 删除推送
* `POST /api/pushs/{push_id}/send` - 发送推送
* `POST /api/pushs/{push_id}/cancel` - 取消推送
* `DELETE /api/pushs/{push_id}/message` - 删除已发送的消息

### 日志相关

* `GET /api/logs` - 获取日志列表
* `GET /api/logs/{push_id}` - 获取特定推送的日志

### 管理员相关

* `POST /api/admin/login` - 管理员登录
* `GET /api/admin/me` - 获取当前管理员信息
* `GET /api/admin/stats` - 获取统计数据

## 💻 使用指南

### 1. 创建推送

1. 登录管理界面

2. 导航到"推送管理"页面

3. 点击"创建推送"按钮

4. 填写推送信息：

   * 标题
   * 内容（支持 Markdown 格式）
   * 内容类型（文本、图片等）
   * 添加按钮（可选）
   * 选择发送时间
   * 选择接收用户

5. 点击"创建推送"按钮

### 2. Markdown 格式示例

* `*粗体文本*` 使用 \*星号\*
* `_斜体文本_` 使用 \_下划线\_
* `[链接文本](https://example.com)`
* `` `代码` `` 使用反引号

### 3. 按钮添加示例

* 按钮文本：访问网站
* 按钮 URL：https\://example.com

## ⚙️ 配置说明

### 代理设置

如果您在中国大陆等地区无法直接访问 Telegram API，可以配置代理：

1. 在 `.env` 文件中设置代理：
   ```
   HTTP_PROXY=http://127.0.0.1:7890
   HTTPS_PROXY=http://127.0.0.1:7890
   ```
2. 确保 `app/bot/config.py` 和 `app/core/proxy.py` 文件正确配置了代理

### 自定义 Bot 命令

默认情况下，系统只使用 `/start` 命令。如需添加更多命令，修改 `app/bot/bot.py` 文件。

## 🐞 故障排除

### 常见问题

#### 无法连接数据库

* 检查数据库凭据是否正确
* 确保数据库服务正在运行

#### Bot 不响应命令

* 检查 Bot Token 是否正确
* 确保网络连接正常或代理配置正确

#### 消息发送失败

* 检查用户是否已与 Bot 有过交互
* 检查 Bot 权限是否足够

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 鸣谢

* FastAPI
* React
* Ant Design
* python-telegram-bot

## 👥 贡献者

* JiuMeng

欢迎贡献代码和提出问题！如有任何疑问，请提交
