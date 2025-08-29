#!/bin/bash

# 血常规AI工具服务启动脚本

echo "正在启动血常规AI工具服务..."

# 启动lighttpd
echo "启动lighttpd..."
systemctl start lighttpd
systemctl enable lighttpd

# 启动supervisor
echo "启动supervisor..."
systemctl start supervisord
systemctl enable supervisord

# 启动后端服务
echo "启动后端API服务..."
supervisorctl start blood-test-ai

# 检查服务状态
echo "检查服务状态..."
echo "--- lighttpd状态 ---"
systemctl status lighttpd --no-pager -l
echo "--- supervisor状态 ---"
systemctl status supervisord --no-pager -l
echo "--- 后端服务状态 ---"
supervisorctl status

echo "服务启动完成！"
echo "前端地址: http://$(hostname -I | awk '{print $1}')"
echo "API文档: http://$(hostname -I | awk '{print $1}'):8000/docs"

