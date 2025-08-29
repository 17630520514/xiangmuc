# 🚀 阿里云轻量应用服务器部署指南

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04/22.04 LTS
- **配置**: 2核4GB内存 (推荐)
- **存储**: 40GB以上
- **网络**: 公网IP，开放80和22端口

### 2. 本地环境要求
- Git已安装
- SSH密钥已配置到服务器
- 本地项目代码完整

## 🔧 部署步骤

### 方法一：使用快速部署脚本 (推荐)

```bash
# 1. 给脚本执行权限
chmod +x quick_deploy.sh

# 2. 执行部署 (替换为你的服务器IP)
./quick_deploy.sh 123.456.789.123
```

### 方法二：手动部署

#### 步骤1: 上传代码到服务器
```bash
# 创建项目目录
ssh root@你的服务器IP "mkdir -p /opt/blood-test-ai"

# 上传项目代码
scp -r . root@你的服务器IP:/opt/blood-test-ai/
```

#### 步骤2: 安装系统依赖
```bash
ssh root@你的服务器IP
cd /opt/blood-test-ai

# 更新系统
apt update -y

# 安装Python环境
apt install -y python3 python3-pip python3-venv

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装Nginx和Supervisor
apt install -y nginx supervisor
```

#### 步骤3: 配置Python环境
```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装Python依赖
pip install -r backend/requirements.txt
```

#### 步骤4: 构建前端
```bash
cd frontend
npm install
npm run build
cd ..
```

#### 步骤5: 配置Nginx
```bash
# 创建Nginx配置
cat > /etc/nginx/sites-available/blood-test-ai << 'EOF'
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /opt/blood-test-ai/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 文件上传限制
    client_max_body_size 50M;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/blood-test-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置并重启
nginx -t
systemctl restart nginx
systemctl enable nginx
```

#### 步骤6: 配置Supervisor
```bash
# 创建Supervisor配置
cat > /etc/supervisor/conf.d/blood-test-ai.conf << 'EOF'
[program:blood-test-ai]
command=/opt/blood-test-ai/venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
directory=/opt/blood-test-ai/backend
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/blood-test-ai.err.log
stdout_logfile=/var/log/blood-test-ai.out.log
environment=PYTHONPATH="/opt/blood-test-ai/backend"
EOF

# 重新加载配置
supervisorctl reread
supervisorctl update
```

#### 步骤7: 配置防火墙
```bash
# 开放必要端口
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable
```

## 🌐 访问应用

部署完成后，通过以下地址访问：
- **本地访问**: http://localhost
- **公网访问**: http://你的服务器IP
- **域名访问**: 如果配置了域名，http://你的域名

## 📚 管理命令

### 服务管理
```bash
# 查看服务状态
supervisorctl status

# 启动服务
supervisorctl start blood-test-ai

# 停止服务
supervisorctl stop blood-test-ai

# 重启服务
supervisorctl restart blood-test-ai
```

### 日志查看
```bash
# 查看应用日志
tail -f /var/log/blood-test-ai.out.log

# 查看错误日志
tail -f /var/log/blood-test-ai.err.log

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 代码更新
```bash
cd /opt/blood-test-ai

# 拉取最新代码
git pull origin main

# 重新构建前端
cd frontend
npm run build
cd ..

# 重启服务
supervisorctl restart blood-test-ai
```

## 🔍 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查Python环境
source venv/bin/activate
python -c "import fastapi; print('FastAPI OK')"

# 检查端口占用
netstat -tlnp | grep :8000

# 查看详细错误日志
tail -f /var/log/blood-test-ai.err.log
```

#### 2. 前端无法访问
```bash
# 检查Nginx状态
systemctl status nginx

# 检查Nginx配置
nginx -t

# 检查前端文件
ls -la /opt/blood-test-ai/frontend/build/
```

#### 3. 文件上传失败
```bash
# 检查目录权限
ls -la /opt/blood-test-ai/backend/data/

# 检查磁盘空间
df -h

# 检查Nginx上传限制
grep client_max_body_size /etc/nginx/sites-enabled/blood-test-ai
```

## 🔒 安全建议

### 1. 防火墙配置
- 只开放必要端口 (22, 80, 443)
- 使用强密码或SSH密钥
- 定期更新系统

### 2. 应用安全
- 修改默认密钥
- 配置HTTPS (推荐)
- 限制文件上传类型和大小

### 3. 监控和备份
- 配置日志轮转
- 定期备份数据
- 监控服务器资源使用

## 📞 技术支持

如果遇到部署问题，请检查：
1. 服务器配置是否满足要求
2. SSH连接是否正常
3. 系统依赖是否完整安装
4. 日志文件中的错误信息

---

**🎉 部署完成后，你的血常规分析AI工具就可以在公网上使用了！**
