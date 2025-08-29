"""
血常规指标分析AI工具 - 后端API主入口
为ITP患者提供血常规指标分析和趋势跟踪服务
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, date
import json
import os
import sqlite3
from pathlib import Path

# 导入血常规识别相关模块
from models import BloodTestReport, BloodTestItem, BloodTestComparison, UploadResponse
from blood_test_service import BloodTestAnalysisService
from storage_service import BloodTestStorageService
from utils import parse_iso_datetime

# 创建FastAPI应用实例
app = FastAPI(
    title="血常规指标分析AI工具",
    description="专为ITP患者设计的血常规指标智能分析工具",
    version="1.0.0"
)

# 配置CORS中间件，允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
blood_test_service = BloodTestAnalysisService()
storage_service = BloodTestStorageService()

# 血常规图片识别和对比API端点

@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "血常规指标分析AI工具API", 
        "version": "1.0.0", 
        "status": "healthy"
    }

@app.post("/api/upload-report", response_model=UploadResponse)
async def upload_blood_test_report(
    image: UploadFile = File(...),
    patient_name: str = Form(...),
    hospital: str = Form(...),
    test_date: str = Form(...),
    notes: Optional[str] = Form(None)
):
    """上传血常规报告图片并识别"""
    try:
        # 验证文件类型
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="只支持图片文件")
        
        # 保存图片
        image_data = await image.read()
        image_path = storage_service.save_image(image_data, image.filename)
        
        # 解析日期
        try:
            parsed_date = parse_iso_datetime(test_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误，请使用ISO格式")
        
        # 分析报告
        report = blood_test_service.analyze_report(
            image_path=image_path,
            patient_name=patient_name,
            hospital=hospital,
            test_date=parsed_date
        )
        
        # 添加备注
        if notes:
            report.notes = notes
        
        # 保存报告
        report_id = storage_service.save_report(report)
        
        # 构建分析结果
        analysis_result = {
            "hemoglobin": "正常",  # 这里应该根据实际分析结果设置
            "white_blood_cells": "正常",
            "platelets": "正常", 
            "overall_assessment": "血常规检查结果正常"
        }
        
        return UploadResponse(
            patient_name=patient_name,
            hospital=hospital,
            test_date=test_date,
            upload_time=datetime.now().isoformat(),
            file_path=image_path,
            analysis=analysis_result,
            status="success",
            fix_applied=True
        )
        
    except Exception as e:
        import traceback
        print(f"❌ 上传API异常: {str(e)}")
        print(f"🔍 异常类型: {type(e)}")
        print(f"📋 异常堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"报告识别失败: {str(e)}")

@app.get("/api/reports", response_model=List[BloodTestReport])
async def get_all_reports():
    """获取所有血常规报告"""
    try:
        return storage_service.get_all_reports()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取报告失败: {str(e)}")

@app.get("/api/reports/{report_id}", response_model=BloodTestReport)
async def get_report(report_id: str):
    """根据ID获取血常规报告"""
    try:
        report = storage_service.get_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="报告不存在")
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取报告失败: {str(e)}")

@app.get("/api/reports/patient/{patient_name}", response_model=List[BloodTestReport])
async def get_patient_reports(patient_name: str):
    """获取指定患者的血常规报告"""
    try:
        return storage_service.get_reports_by_patient(patient_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取患者报告失败: {str(e)}")

@app.get("/api/reports/search/{query}", response_model=List[BloodTestReport])
async def search_reports(query: str):
    """搜索血常规报告"""
    try:
        return storage_service.search_reports(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索报告失败: {str(e)}")

@app.get("/api/reports/compare/{report_id}")
async def compare_with_history(report_id: str):
    """与历史数据对比"""
    try:
        current_report = storage_service.get_report(report_id)
        if not current_report:
            raise HTTPException(status_code=404, detail="报告不存在")
        
        # 获取所有报告
        all_reports = storage_service.get_all_reports()
        
        # 查找相似患者名的历史报告（支持模糊匹配）
        previous_reports = []
        current_patient_name = current_report.patient_name.lower()
        
        print(f"🔍 调试信息: 当前患者 '{current_report.patient_name}' (ID: {report_id})")
        print(f"🔍 调试信息: 当前患者名(小写): '{current_patient_name}'")
        print(f"🔍 调试信息: 总报告数: {len(all_reports)}")
        
        for report in all_reports:
            if report.id != report_id:  # 排除当前报告
                # 检查患者姓名是否相似（包含关系或前缀匹配）
                report_patient_name = report.patient_name.lower()
                print(f"🔍 调试信息: 检查报告 '{report.patient_name}' (ID: {report.id})")
                print(f"🔍 调试信息: 报告患者名(小写): '{report_patient_name}'")
                
                # 检查匹配条件
                contains_current = current_patient_name in report_patient_name
                current_contains = report_patient_name in current_patient_name
                surname_match = current_patient_name.split()[0] == report_patient_name.split()[0] if ' ' in current_patient_name or ' ' in report_patient_name else False
                
                print(f"🔍 调试信息: 包含关系: {contains_current}, 被包含: {current_contains}, 姓氏匹配: {surname_match}")
                
                if (contains_current or current_contains or surname_match):
                    print(f"✅ 匹配成功: '{report.patient_name}' 添加到历史报告")
                    previous_reports.append(report)
                else:
                    print(f"❌ 匹配失败: '{report.patient_name}' 不匹配")
        
        print(f"🔍 调试信息: 找到 {len(previous_reports)} 个历史报告")
        
        # 进行对比分析
        comparison_result = blood_test_service.compare_with_history(current_report, previous_reports)
        
        return {
            "current_report": current_report,
            "comparison": comparison_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"对比分析失败: {str(e)}")

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    """删除血常规报告"""
    try:
        success = storage_service.delete_report(report_id)
        if not success:
            raise HTTPException(status_code=404, detail="报告不存在")
        
        return {"message": "报告删除成功"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除报告失败: {str(e)}")

@app.get("/api/statistics")
async def get_statistics():
    """获取统计信息"""
    try:
        return storage_service.get_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

@app.get("/api/indicators/reference-ranges")
async def get_reference_ranges():
    """获取血常规指标参考范围"""
    try:
        # 从服务中获取参考范围
        ocr_service = blood_test_service.ocr_service
        return {
            "reference_ranges": ocr_service.reference_ranges,
            "indicators": ocr_service.blood_indicators
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取参考范围失败: {str(e)}")

@app.post("/api/analyze")
async def analyze_blood_test(request: dict):
    """分析血常规数据"""
    try:
        # 从请求中提取血常规数据
        blood_test_data = request.get("blood_test", {})
        analysis_type = request.get("analysis_type", "comprehensive")
        
        if not blood_test_data:
            raise HTTPException(status_code=400, detail="缺少血常规数据")
        
        # 调用分析服务
        analysis_result = blood_test_service.analyze_blood_test_data(
            blood_test_data=blood_test_data,
            analysis_type=analysis_type
        )
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    print("🚀 启动血常规分析AI工具后端服务...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
