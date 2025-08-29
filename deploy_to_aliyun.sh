#!/bin/bash

# 🚀 阿里云轻量应用服务器部署脚本
# 血常规分析AI工具 - 一键部署

set -e

echo "🎯 开始部署血常规分析AI工具到阿里云轻量应用服务器..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置信息
SERVER_IP=""
SERVER_USER="root"
SERVER_PORT="22"
PROJECT_NAME="blood-test-ai"
DOMAIN=""

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}使用方法: $0 <服务器IP> [域名]${NC}"
    echo -e "${YELLOW}示例: $0 123.456.789.123 example.com${NC}"
    exit 1
fi

SERVER_IP=$1
if [ $# -eq 2 ]; then
    DOMAIN=$2
fi

echo -e "${BLUE}📋 部署配置:${NC}"
echo -e "   服务器IP: ${GREEN}$SERVER_IP${NC}"
echo -e "   服务器用户: ${GREEN}$SERVER_USER${NC}"
echo -e "   项目名称: ${GREEN}$PROJECT_NAME${NC}"
if [ ! -z "$DOMAIN" ]; then
    echo -e "   域名: ${GREEN}$DOMAIN${NC}"
fi

# 确认部署
read -p "确认部署到服务器 $SERVER_IP? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}部署已取消${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 开始部署流程...${NC}"

# 1. 检查SSH连接
echo -e "${BLUE}1️⃣ 检查SSH连接...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo -e "${RED}❌ SSH连接失败，请检查:${NC}"
    echo -e "   - 服务器IP是否正确"
    echo -e "   - SSH密钥是否配置"
    echo -e "   - 防火墙是否开放22端口"
    exit 1
fi
echo -e "${GREEN}✅ SSH连接成功${NC}"

# 2. 在服务器上创建项目目录
echo -e "${BLUE}2️⃣ 创建项目目录...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
mkdir -p /opt/$PROJECT_NAME
cd /opt/$PROJECT_NAME
EOF
echo -e "${GREEN}✅ 项目目录创建成功${NC}"

# 3. 安装系统依赖
echo -e "${BLUE}3️⃣ 安装系统依赖...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# 更新系统
apt update -y

# 安装Python3和相关工具
apt install -y python3 python3-pip python3-venv python3-dev

# 安装Node.js和npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装Nginx
apt install -y nginx

# 安装其他必要工具
apt install -y git curl wget unzip supervisor

# 安装Python依赖
apt install -y python3-opencv python3-pil python3-pil.imagetk

echo "系统依赖安装完成"
EOF
echo -e "${GREEN}✅ 系统依赖安装完成${NC}"

# 4. 配置Python环境
echo -e "${BLUE}4️⃣ 配置Python环境...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/$PROJECT_NAME

# 创建Python虚拟环境
python3 -m venv venv
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装Python依赖
pip install fastapi uvicorn python-multipart pillow opencv-python-headless sqlite3

echo "Python环境配置完成"
EOF
echo -e "${GREEN}✅ Python环境配置完成${NC}"

# 5. 配置Nginx
echo -e "${BLUE}5️⃣ 配置Nginx...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# 创建Nginx配置文件
cat > /etc/nginx/sites-available/$PROJECT_NAME << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/$PROJECT_NAME/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
NGINX_CONFIG

# 启用站点
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

echo "Nginx配置完成"
EOF
echo -e "${GREEN}✅ Nginx配置完成${NC}"

# 6. 配置Supervisor
echo -e "${BLUE}6️⃣ 配置Supervisor...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# 创建Supervisor配置
cat > /etc/supervisor/conf.d/$PROJECT_NAME.conf << 'SUPERVISOR_CONFIG'
[program:$PROJECT_NAME]
command=/opt/$PROJECT_NAME/venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
directory=/opt/$PROJECT_NAME/backend
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/$PROJECT_NAME.err.log
stdout_logfile=/var/log/$PROJECT_NAME.out.log
environment=PYTHONPATH="/opt/$PROJECT_NAME/backend"
SUPERVISOR_CONFIG

# 重新加载Supervisor配置
supervisorctl reread
supervisorctl update

echo "Supervisor配置完成"
EOF
echo -e "${GREEN}✅ Supervisor配置完成${NC}"

# 7. 配置防火墙
echo -e "${BLUE}7️⃣ 配置防火墙...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# 开放必要端口
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "防火墙配置完成"
EOF
echo -e "${GREEN}✅ 防火墙配置完成${NC}"

# 8. 创建部署脚本
echo -e "${BLUE}8️⃣ 创建部署脚本...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/$PROJECT_NAME

# 创建部署脚本
cat > deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
echo "🚀 开始部署..."

# 拉取最新代码
git pull origin main

# 安装前端依赖并构建
cd frontend
npm install
npm run build
cd ..

# 安装后端依赖
source venv/bin/activate
cd backend
pip install -r requirements.txt
cd ..

# 重启服务
supervisorctl restart $PROJECT_NAME

echo "✅ 部署完成！"
echo "🌐 访问地址: http://$(curl -s ifconfig.me)"
DEPLOY_SCRIPT

chmod +x deploy.sh

echo "部署脚本创建完成"
EOF
echo -e "${GREEN}✅ 部署脚本创建完成${NC}"

# 9. 创建项目启动脚本
echo -e "${BLUE}9️⃣ 创建项目启动脚本...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/$PROJECT_NAME

# 创建启动脚本
cat > start.sh << 'START_SCRIPT'
#!/bin/bash
echo "🚀 启动血常规分析AI工具..."

# 启动后端服务
cd backend
source ../venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000
START_SCRIPT

chmod +x start.sh

echo "启动脚本创建完成"
EOF
echo -e "${GREEN}✅ 启动脚本创建完成${NC}"

# 10. 创建环境配置文件
echo -e "${BLUE}🔟 创建环境配置...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/$PROJECT_NAME

# 创建环境配置文件
cat > .env << 'ENV_CONFIG'
# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=false

# 数据库配置
DATABASE_URL=sqlite:///./blood_test.db

# 文件上传配置
UPLOAD_DIR=./data/images
MAX_FILE_SIZE=52428800

# 安全配置
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["*"]
ENV_CONFIG

echo "环境配置创建完成"
EOF
echo -e "${GREEN}✅ 环境配置创建完成${NC}"

echo -e "${GREEN}🎉 部署配置完成！${NC}"
echo -e "${BLUE}📋 下一步操作:${NC}"
echo -e "1. 将项目代码上传到服务器:"
echo -e "   ${YELLOW}scp -r . $SERVER_USER@$SERVER_IP:/opt/$PROJECT_NAME/${NC}"
echo -e ""
echo -e "2. 在服务器上运行部署:"
echo -e "   ${YELLOW}ssh $SERVER_USER@$SERVER_IP 'cd /opt/$PROJECT_NAME && ./deploy.sh'${NC}"
echo -e ""
echo -e "3. 访问应用:"
echo -e "   ${GREEN}http://$SERVER_IP${NC}"
if [ ! -z "$DOMAIN" ]; then
    echo -e "   ${GREEN}http://$DOMAIN${NC}"
fi

echo -e ""
echo -e "${BLUE}📚 部署完成后的管理命令:${NC}"
echo -e "   - 查看服务状态: ${YELLOW}supervisorctl status${NC}"
echo -e "   - 重启服务: ${YELLOW}supervisorctl restart $PROJECT_NAME${NC}"
echo -e "   - 查看日志: ${YELLOW}tail -f /var/log/$PROJECT_NAME.out.log${NC}"
echo -e "   - 更新代码: ${YELLOW}cd /opt/$PROJECT_NAME && ./deploy.sh${NC}"
