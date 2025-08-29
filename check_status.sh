#!/bin/bash

# 血常规AI工具服务状态检查脚本

echo "=== 血常规AI工具服务状态 ==="
echo ""

echo "--- lighttpd状态 ---"
systemctl is-active lighttpd > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ lighttpd: 运行中"
    echo "  端口: 80"
    echo "  状态: $(systemctl is-active lighttpd)"
else
    echo "✗ lighttpd: 未运行"
fi
echo ""

echo "--- supervisor状态 ---"
systemctl is-active supervisord > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ supervisor: 运行中"
    echo "  状态: $(systemctl is-active supervisord)"
else
    echo "✗ supervisor: 未运行"
fi
echo ""

echo "--- 后端API服务状态 ---"
supervisorctl status blood-test-ai 2>/dev/null | grep -q "RUNNING"
if [ $? -eq 0 ]; then
    echo "✓ 后端API: 运行中"
    echo "  端口: 8000"
    echo "  状态: $(supervisorctl status blood-test-ai | awk '{print $2}')"
else
    echo "✗ 后端API: 未运行"
fi
echo ""

echo "--- 网络连接测试 ---"
echo "测试前端访问..."
if curl -s http://localhost > /dev/null 2>&1; then
    echo "✓ 前端: 可访问"
else
    echo "✗ 前端: 不可访问"
fi

echo "测试API访问..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✓ API: 可访问"
else
    echo "✗ API: 不可访问"
fi

echo ""
echo "=== 服务信息 ==="
echo "服务器IP: $(hostname -I | awk '{print $1}')"
echo "前端地址: http://$(hostname -I | awk '{print $1}')"
echo "API文档: http://$(hostname -I | awk '{print $1}'):8000/docs"
echo ""

echo "=== 日志文件位置 ==="
echo "lighttpd错误日志: /var/log/lighttpd/error.log"
echo "后端服务日志: /var/log/blood-test-ai.log"
echo "supervisor日志: /var/log/supervisor/supervisord.log"

