from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class BloodTestItem(BaseModel):
    """血常规检测项目"""
    name: str  # 指标名称
    value: float  # 检测值
    unit: str  # 单位
    reference_range: str  # 参考范围
    status: str  # 状态：正常/偏高/偏低
    is_abnormal: bool = False  # 是否异常

class BloodTestReport(BaseModel):
    """血常规检测报告"""
    id: Optional[str] = None
    patient_name: str  # 患者姓名
    test_date: datetime  # 检测日期
    hospital: str  # 医院名称
    items: List[BloodTestItem]  # 检测项目列表
    image_path: Optional[str] = None  # 原始图片路径
    notes: Optional[str] = None  # 备注
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    def dict(self, **kwargs):
        """重写dict方法，确保datetime字段被正确序列化"""
        data = super().dict(**kwargs)
        # 将datetime字段转换为ISO格式字符串
        for field in ['test_date', 'created_at', 'updated_at']:
            if field in data and isinstance(data[field], datetime):
                data[field] = data[field].isoformat()
        return data

class BloodTestComparison(BaseModel):
    """血常规对比数据"""
    current_report: BloodTestReport
    previous_reports: List[BloodTestReport]
    trends: Dict[str, List[float]]  # 各指标的趋势数据
    abnormal_changes: List[str]  # 异常变化提醒

class OCRResult(BaseModel):
    """OCR识别结果"""
    text: str
    confidence: float
    items: List[BloodTestItem]
    raw_data: Dict[str, Any]

class UploadResponse(BaseModel):
    """上传响应"""
    patient_name: str
    hospital: str
    test_date: str
    upload_time: str
    file_path: str
    analysis: Dict[str, str]
    status: str
    fix_applied: bool
