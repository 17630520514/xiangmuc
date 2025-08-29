#!/bin/bash

# 部署最新代码到阿里云服务器
echo "🚀 开始部署最新代码到服务器..."

# 服务器信息
SERVER_IP="47.92.134.143"
SERVER_USER="root"
PROJECT_PATH="/opt/blood-test-ai"

# 上传前端代码
echo "📤 上传前端代码..."
scp -r frontend/src/* $SERVER_USER@$SERVER_IP:$PROJECT_PATH/frontend/src/

# 上传后端代码
echo "📤 上传后端代码..."
scp -r backend/* $SERVER_USER@$SERVER_IP:$PROJECT_PATH/backend/

# 上传配置文件
echo "📤 上传配置文件..."
scp lighttpd.conf $SERVER_USER@$SERVER_IP:$PROJECT_PATH/
scp start_services.sh $SERVER_USER@$SERVER_IP:$PROJECT_PATH/
scp stop_services.sh $SERVER_USER@$SERVER_IP:$PROJECT_PATH/

# 在服务器上重新构建前端
echo "🔨 在服务器上重新构建前端..."
ssh $SERVER_USER@$SERVER_IP "cd $PROJECT_PATH/frontend && npm run build"

# 重启服务
echo "🔄 重启服务..."
ssh $SERVER_USER@$SERVER_IP "cd $PROJECT_PATH && ./stop_services.sh && ./start_services.sh"

echo "✅ 部署完成！"
echo "🌐 前端地址: https://47.92.134.143"
echo "🔧 后端地址: http://47.92.134.143:8000"
