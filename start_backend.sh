#!/bin/bash

echo "🩸 启动血常规分析AI工具后端服务..."

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 进入后端目录
cd backend

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔄 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装Python依赖包..."
pip install -r requirements.txt

# 启动后端服务
echo "🚀 启动后端API服务..."
python app.py



