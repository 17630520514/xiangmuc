#!/usr/bin/env python3
"""
测试血常规报告上传API
"""

import requests
import os
from datetime import datetime

def test_upload_api():
    """测试上传API"""
    url = "http://localhost:8000/api/upload-report"
    
    # 检查是否有测试图片
    images_dir = "data/images"
    if not os.path.exists(images_dir):
        print("❌ 图片目录不存在")
        return
    
    # 获取第一张测试图片
    test_images = [f for f in os.listdir(images_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    if not test_images:
        print("❌ 没有找到测试图片")
        return
    
    test_image_path = os.path.join(images_dir, test_images[0])
    print(f"📸 使用测试图片: {test_image_path}")
    
    # 准备表单数据
    data = {
        'patient_name': '测试患者',
        'hospital': '测试医院',
        'test_date': datetime.now().isoformat(),
        'notes': 'API测试'
    }
    
    # 准备文件
    files = {
        'image': (test_images[0], open(test_image_path, 'rb'), 'image/png')
    }
    
    try:
        print("🚀 发送测试请求...")
        response = requests.post(url, data=data, files=files)
        
        print(f"📊 响应状态码: {response.status_code}")
        print(f"📋 响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ 上传成功!")
            result = response.json()
            print(f"📝 响应内容: {result}")
        else:
            print("❌ 上传失败!")
            print(f"🔍 错误详情: {response.text}")
            
    except Exception as e:
        print(f"💥 请求异常: {e}")
    finally:
        files['image'][1].close()

if __name__ == "__main__":
    print("🧪 开始测试血常规报告上传API...")
    test_upload_api()
    print("🏁 测试完成!")

