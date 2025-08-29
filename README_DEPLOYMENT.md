# 血常规AI工具部署说明

## 系统概述

这是一个基于AI的血常规指标分析工具，包含：
- 前端：React + TypeScript + Tailwind CSS
- 后端：FastAPI + Python
- 数据库：SQLite
- Web服务器：lighttpd
- 进程管理：supervisor

## 部署信息

- 服务器IP：47.92.134.143
- 前端地址：http://47.92.134.143
- API文档：http://47.92.134.143:8000/docs
- 部署目录：/opt/blood-test-ai

## 服务管理

### 启动所有服务
```bash
cd /opt/blood-test-ai
./start_services.sh
```

### 停止所有服务
```bash
cd /opt/blood-test-ai
./stop_services.sh
```

### 检查服务状态
```bash
cd /opt/blood-test-ai
./check_status.sh
```

### 手动管理服务

#### lighttpd (前端Web服务器)
```bash
# 启动
systemctl start lighttpd

# 停止
systemctl stop lighttpd

# 重启
systemctl restart lighttpd

# 查看状态
systemctl status lighttpd

# 查看日志
tail -f /var/log/lighttpd/error.log
```

#### supervisor (后端进程管理)
```bash
# 启动
systemctl start supervisord

# 停止
systemctl stop supervisord

# 查看状态
systemctl status supervisord

# 管理后端服务
supervisorctl status blood-test-ai
supervisorctl start blood-test-ai
supervisorctl stop blood-test-ai
supervisorctl restart blood-test-ai

# 查看后端日志
supervisorctl tail blood-test-ai
```

## 目录结构

```
/opt/blood-test-ai/
├── frontend/                 # 前端源码
│   ├── build/               # 构建后的前端文件
│   ├── src/                 # 前端源码
│   └── package.json         # 前端依赖
├── backend/                  # 后端源码
│   ├── app.py               # 主应用文件
│   ├── models.py            # 数据模型
│   ├── blood_test_service.py # 业务逻辑
│   └── requirements.txt     # Python依赖
├── venv/                    # Python虚拟环境
├── start_services.sh        # 启动脚本
├── stop_services.sh         # 停止脚本
└── check_status.sh          # 状态检查脚本
```

## 配置文件

### lighttpd配置
- 位置：/etc/lighttpd/lighttpd.conf
- 功能：前端静态文件服务 + API代理

### supervisor配置
- 位置：/etc/supervisord.d/blood-test-ai.ini
- 功能：管理后端Python服务

## 日志文件

- lighttpd错误日志：/var/log/lighttpd/error.log
- 后端服务日志：/var/log/blood-test-ai.log
- supervisor日志：/var/log/supervisor/supervisord.log

## 故障排除

### 前端无法访问
1. 检查lighttpd状态：`systemctl status lighttpd`
2. 检查端口80是否开放：`netstat -tlnp | grep :80`
3. 查看lighttpd日志：`tail -f /var/log/lighttpd/error.log`

### API无法访问
1. 检查supervisor状态：`systemctl status supervisord`
2. 检查后端服务状态：`supervisorctl status blood-test-ai`
3. 查看后端日志：`supervisorctl tail blood-test-ai`
4. 检查端口8000是否开放：`netstat -tlnp | grep :8000`

### 服务启动失败
1. 检查配置文件语法
2. 查看系统日志：`journalctl -u lighttpd` 或 `journalctl -u supervisord`
3. 检查文件权限和目录是否存在

## 更新部署

### 更新前端
```bash
cd /opt/blood-test-ai/frontend
git pull
npm install
npm run build
cp -r build/* /var/www/html/
```

### 更新后端
```bash
cd /opt/blood-test-ai/backend
git pull
source ../venv/bin/activate
pip install -r requirements.txt
supervisorctl restart blood-test-ai
```

## 安全注意事项

1. 确保服务器防火墙配置正确
2. 定期更新系统和依赖包
3. 监控日志文件中的异常访问
4. 考虑使用HTTPS（需要配置SSL证书）

## 性能优化

1. 启用lighttpd压缩功能
2. 配置静态文件缓存
3. 监控系统资源使用情况
4. 根据访问量调整进程数量

## 联系信息

如有问题，请联系系统管理员或查看相关日志文件。

