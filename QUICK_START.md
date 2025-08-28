# 🚀 快速启动指南

## 系统要求

- **操作系统**: macOS, Linux, Windows
- **Python**: 3.8 或更高版本
- **Node.js**: 16 或更高版本
- **内存**: 至少 4GB RAM
- **存储**: 至少 2GB 可用空间

## ⚡ 一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd xiangmuc

# 2. 一键启动
./start_system.sh
```

启动脚本会自动：
- 创建Python虚拟环境
- 安装所有依赖
- 启动后端API服务
- 启动前端Web应用
- 检查服务状态

## 🔧 手动启动

### 步骤1: 启动后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```

### 步骤2: 启动前端

```bash
# 新开终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 🌐 访问应用

启动成功后，在浏览器中访问：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 📱 功能测试

### 1. 手动输入分析
- 访问 http://localhost:3000
- 点击"手动输入分析"
- 输入测试数据：
  ```
  血小板计数: 85
  血红蛋白: 135
  白细胞计数: 6.2
  ```
- 点击"开始分析"

### 2. 图片识别测试
- 准备一张血常规报告图片
- 点击"图片识别"
- 上传图片并填写信息
- 查看识别结果

### 3. API接口测试
- 访问 http://localhost:8000/docs
- 测试 `/api/analyze` 接口
- 使用示例数据：
  ```json
  {
    "blood_test": {
      "plt": 85,
      "hgb": 135,
      "wbc": 6.2
    }
  }
  ```

## 🐛 常见问题

### 后端启动失败

**问题**: `ModuleNotFoundError: No module named 'cv2'`
**解决**: 安装OpenCV
```bash
pip install opencv-python
```

**问题**: `ModuleNotFoundError: No module named 'pytesseract'`
**解决**: 安装Tesseract
```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# 然后安装Python包
pip install pytesseract
```

### 前端启动失败

**问题**: `EADDRINUSE: address already in use :::3000`
**解决**: 端口被占用，修改端口或关闭占用进程
```bash
# 查找占用进程
lsof -i :3000

# 关闭进程
kill -9 <PID>
```

**问题**: `npm install` 失败
**解决**: 清除缓存重试
```bash
npm cache clean --force
npm install
```

### 服务无法访问

**问题**: 前端无法连接后端
**解决**: 检查CORS配置和端口设置

**问题**: 图片上传失败
**解决**: 检查文件大小和格式限制

## 📊 性能优化

### 开发环境
- 使用 `npm start` 启动前端（热重载）
- 使用 `python app.py` 启动后端（自动重载）

### 生产环境
- 前端: `npm run build` 构建生产版本
- 后端: 使用 `uvicorn` 或 `gunicorn` 部署

## 🔒 安全注意事项

- 生产环境请修改默认端口
- 配置适当的CORS策略
- 添加身份验证和授权
- 使用HTTPS加密传输
- 定期更新依赖包

## 📞 获取帮助

如果遇到问题：

1. 查看控制台错误信息
2. 检查网络连接和端口状态
3. 查看项目Issue页面
4. 提交新的Issue描述问题

---

**祝您使用愉快！** 🎉
