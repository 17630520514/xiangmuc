#!/bin/bash

# 血常规AI工具服务停止脚本

echo "正在停止血常规AI工具服务..."

# 停止后端服务
echo "停止后端API服务..."
supervisorctl stop blood-test-ai

# 停止supervisor
echo "停止supervisor..."
systemctl stop supervisord

# 停止lighttpd
echo "停止lighttpd..."
systemctl stop lighttpd

echo "服务停止完成！"

