#!/bin/bash

echo "💻 启动血常规分析AI工具前端服务..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 进入前端目录
cd frontend

# 安装依赖（如果node_modules不存在）
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖包..."
    npm install
fi

# 启动前端开发服务器
echo "🚀 启动前端开发服务器..."
npm start



