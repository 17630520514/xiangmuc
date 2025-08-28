import json
import os
from datetime import datetime
from typing import List, Optional, Dict
from models import BloodTestReport, BloodTestItem
import uuid

class BloodTestStorageService:
    """血常规报告存储服务"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.reports_file = os.path.join(data_dir, "blood_test_reports.json")
        self.images_dir = os.path.join(data_dir, "images")
        
        # 创建必要的目录
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)
        
        # 初始化数据文件
        self._init_data_file()
    
    def _init_data_file(self):
        """初始化数据文件"""
        if not os.path.exists(self.reports_file):
            with open(self.reports_file, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
    
    def save_report(self, report: BloodTestReport) -> str:
        """保存血常规报告"""
        # 生成唯一ID
        if not report.id:
            report.id = str(uuid.uuid4())
        
        # 更新时间戳
        report.updated_at = datetime.now()
        
        # 读取现有数据
        reports = self._load_reports()
        
        # 检查是否已存在（根据ID）
        existing_index = None
        for i, existing_report in enumerate(reports):
            if existing_report.get('id') == report.id:
                existing_index = i
                break
        
        # 转换为字典并处理datetime序列化
        report_dict = report.dict()
        
        # 将datetime对象转换为ISO格式字符串
        if 'test_date' in report_dict and isinstance(report_dict['test_date'], datetime):
            report_dict['test_date'] = report_dict['test_date'].isoformat()
        if 'created_at' in report_dict and isinstance(report_dict['created_at'], datetime):
            report_dict['created_at'] = report_dict['created_at'].isoformat()
        if 'updated_at' in report_dict and isinstance(report_dict['updated_at'], datetime):
            report_dict['updated_at'] = report_dict['updated_at'].isoformat()
        
        if existing_index is not None:
            # 更新现有报告
            reports[existing_index] = report_dict
        else:
            # 添加新报告
            reports.append(report_dict)
        
        # 保存到文件
        self._save_reports(reports)
        
        return report.id
    
    def get_report(self, report_id: str) -> Optional[BloodTestReport]:
        """根据ID获取报告"""
        reports = self._load_reports()
        
        for report_data in reports:
            if report_data.get('id') == report_id:
                return BloodTestReport(**report_data)
        
        return None
    
    def get_all_reports(self) -> List[BloodTestReport]:
        """获取所有报告"""
        reports = self._load_reports()
        return [BloodTestReport(**report_data) for report_data in reports]
    
    def get_reports_by_patient(self, patient_name: str) -> List[BloodTestReport]:
        """根据患者姓名获取报告"""
        reports = self._load_reports()
        patient_reports = []
        
        for report_data in reports:
            if report_data.get('patient_name') == patient_name:
                patient_reports.append(BloodTestReport(**report_data))
        
        return patient_reports
    
    def delete_report(self, report_id: str) -> bool:
        """删除报告"""
        reports = self._load_reports()
        original_count = len(reports)
        
        # 过滤掉要删除的报告
        reports = [r for r in reports if r.get('id') != report_id]
        
        if len(reports) < original_count:
            self._save_reports(reports)
            return True
        
        return False
    
    def search_reports(self, query: str) -> List[BloodTestReport]:
        """搜索报告"""
        reports = self._load_reports()
        results = []
        
        query_lower = query.lower()
        
        for report_data in reports:
            # 搜索患者姓名
            if query_lower in report_data.get('patient_name', '').lower():
                results.append(BloodTestReport(**report_data))
                continue
            
            # 搜索医院名称
            if query_lower in report_data.get('hospital', '').lower():
                results.append(BloodTestReport(**report_data))
                continue
            
            # 搜索备注
            if query_lower in report_data.get('notes', '').lower():
                results.append(BloodTestReport(**report_data))
                continue
        
        return results
    
    def get_reports_by_date_range(self, start_date: datetime, end_date: datetime) -> List[BloodTestReport]:
        """根据日期范围获取报告"""
        reports = self._load_reports()
        results = []
        
        for report_data in reports:
            test_date_str = report_data.get('test_date')
            if test_date_str:
                try:
                    test_date = datetime.fromisoformat(test_date_str)
                    if start_date <= test_date <= end_date:
                        results.append(BloodTestReport(**report_data))
                except ValueError:
                    continue
        
        return results
    
    def get_statistics(self) -> Dict[str, any]:
        """获取统计信息"""
        reports = self._load_reports()
        
        if not reports:
            return {
                "total_reports": 0,
                "total_patients": 0,
                "date_range": None,
                "abnormal_count": 0
            }
        
        # 统计基本信息
        total_reports = len(reports)
        unique_patients = set(r.get('patient_name') for r in reports)
        total_patients = len(unique_patients)
        
        # 日期范围
        dates = []
        for report in reports:
            test_date_str = report.get('test_date')
            if test_date_str:
                try:
                    dates.append(datetime.fromisoformat(test_date_str))
                except ValueError:
                    continue
        
        date_range = None
        if dates:
            min_date = min(dates)
            max_date = max(dates)
            date_range = {
                "start": min_date.isoformat(),
                "end": max_date.isoformat()
            }
        
        # 异常统计
        abnormal_count = 0
        for report in reports:
            items = report.get('items', [])
            for item in items:
                if item.get('is_abnormal', False):
                    abnormal_count += 1
        
        return {
            "total_reports": total_reports,
            "total_patients": total_patients,
            "date_range": date_range,
            "abnormal_count": abnormal_count
        }
    
    def save_image(self, image_data: bytes, filename: str) -> str:
        """保存图片文件"""
        # 生成唯一文件名
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(self.images_dir, unique_filename)
        
        # 保存文件
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        return file_path
    
    def delete_image(self, image_path: str) -> bool:
        """删除图片文件"""
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
                return True
        except Exception:
            pass
        return False
    
    def _load_reports(self) -> List[Dict]:
        """加载报告数据"""
        try:
            with open(self.reports_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_reports(self, reports: List[Dict]):
        """保存报告数据"""
        with open(self.reports_file, 'w', encoding='utf-8') as f:
            json.dump(reports, f, ensure_ascii=False, indent=2)
