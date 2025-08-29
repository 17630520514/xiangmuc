#!/bin/bash

# 🚀 快速部署脚本 - 阿里云轻量应用服务器
# 使用方法: ./quick_deploy.sh <服务器IP>

set -e

SERVER_IP=$1
if [ -z "$SERVER_IP" ]; then
    echo "❌ 请提供服务器IP地址"
    echo "使用方法: ./quick_deploy.sh <服务器IP>"
    exit 1
fi

echo "🎯 开始快速部署到服务器: $SERVER_IP"

# 1. 上传项目代码
echo "📤 上传项目代码到服务器..."
scp -r . root@$SERVER_IP:/opt/blood-test-ai/

# 2. 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh root@$SERVER_IP << 'EOF'
cd /opt/blood-test-ai

# 安装系统依赖
apt update -y
apt install -y python3 python3-pip python3-venv nginx supervisor

# 创建Python虚拟环境
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 构建前端
cd frontend
npm install
npm run build
cd ..

# 配置Nginx
cat > /etc/nginx/sites-available/blood-test-ai << 'NGINX'
server {
    listen 80;
    server_name _;
    
    location / {
        root /opt/blood-test-ai/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/blood-test-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# 配置Supervisor
cat > /etc/supervisor/conf.d/blood-test-ai.conf << 'SUPER'
[program:blood-test-ai]
command=/opt/blood-test-ai/venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
directory=/opt/blood-test-ai/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/blood-test-ai.err.log
stdout_logfile=/var/log/blood-test-ai.out.log
SUPER

supervisorctl reread
supervisorctl update

# 开放端口
ufw allow 80/tcp
ufw allow 22/tcp
ufw --force enable

echo "✅ 部署完成！"
EOF

echo "🎉 部署完成！"
echo "🌐 访问地址: http://$SERVER_IP"
echo ""
echo "📚 管理命令:"
echo "   - 查看状态: ssh root@$SERVER_IP 'supervisorctl status'"
echo "   - 重启服务: ssh root@$SERVER_IP 'supervisorctl restart blood-test-ai'"
echo "   - 查看日志: ssh root@$SERVER_IP 'tail -f /var/log/blood-test-ai.out.log'"
