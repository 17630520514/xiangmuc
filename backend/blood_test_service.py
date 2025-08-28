"""
血常规分析服务模块
提供血常规OCR识别、数据分析和历史对比功能
"""

import cv2
import pytesseract
import re
import json
from datetime import datetime
from typing import List, Dict, Optional
from PIL import Image
import numpy as np
from models import BloodTestItem, BloodTestReport, OCRResult

class BloodTestOCRService:
    """血常规OCR识别服务"""
    
    def __init__(self):
        # 常见血常规指标及其单位
        self.blood_indicators = {
            '白细胞': ['WBC', '白细胞计数', '白细胞数'],
            '红细胞': ['RBC', '红细胞计数', '红细胞数'],
            '血红蛋白': ['HGB', 'Hb', '血红蛋白', '血色素'],
            '红细胞压积': ['HCT', '红细胞压积', '红细胞比容'],
            '平均红细胞体积': ['MCV', '平均红细胞体积'],
            '平均红细胞血红蛋白含量': ['MCH', '平均红细胞血红蛋白含量'],
            '平均红细胞血红蛋白浓度': ['MCHC', '平均红细胞血红蛋白浓度'],
            '血小板': ['PLT', '血小板计数', '血小板数'],
            '淋巴细胞': ['LYM', '淋巴细胞', '淋巴细胞计数'],
            '中性粒细胞': ['NEU', '中性粒细胞', '中性粒细胞计数'],
            '嗜酸性粒细胞': ['EOS', '嗜酸性粒细胞', '嗜酸性粒细胞计数'],
            '嗜碱性粒细胞': ['BAS', '嗜碱性粒细胞', '嗜碱性粒细胞计数'],
            '单核细胞': ['MON', '单核细胞', '单核细胞计数']
        }
        
        # 参考范围（正常值）
        self.reference_ranges = {
            '白细胞': (3.5, 9.5, '10^9/L'),
            '红细胞': (3.8, 5.8, '10^12/L'),
            '血红蛋白': (115, 175, 'g/L'),
            '红细胞压积': (0.35, 0.50, 'L/L'),
            '平均红细胞体积': (80, 100, 'fL'),
            '平均红细胞血红蛋白含量': (27, 34, 'pg'),
            '平均红细胞血红蛋白浓度': (320, 360, 'g/L'),
            '血小板': (125, 350, '10^9/L'),
            '淋巴细胞': (1.1, 3.2, '10^9/L'),
            '中性粒细胞': (1.8, 6.3, '10^9/L'),
            '嗜酸性粒细胞': (0.02, 0.52, '10^9/L'),
            '嗜碱性粒细胞': (0.00, 0.06, '10^9/L'),
            '单核细胞': (0.10, 0.60, '10^9/L')
        }

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """图像预处理"""
        # 读取图像
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("无法读取图像文件")
        
        # 转换为灰度图
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 去噪
        denoised = cv2.medianBlur(gray, 3)
        
        # 二值化
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # 形态学操作
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return processed

    def extract_text(self, image_path: str) -> str:
        """提取图像中的文字"""
        try:
            # 预处理图像
            processed_image = self.preprocess_image(image_path)
            
            # OCR识别
            text = pytesseract.image_to_string(processed_image, lang='chi_sim+eng')
            
            return text
        except Exception as e:
            raise Exception(f"OCR识别失败: {str(e)}")

    def parse_blood_test_data(self, text: str) -> List[BloodTestItem]:
        """解析血常规数据"""
        items = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 尝试匹配指标和数值
            item = self._parse_line(line)
            if item:
                items.append(item)
        
        return items

    def _parse_line(self, line: str) -> Optional[BloodTestItem]:
        """解析单行数据"""
        # 匹配模式：指标名 + 数值 + 单位 + 参考范围
        patterns = [
            r'([^\d\s]+)\s*([\d\.]+)\s*([^\d\s]+)\s*([\d\.]+-[ \d\.]+)',
            r'([^\d\s]+)\s*([\d\.]+)\s*([^\d\s]+)',
            r'([^\d\s]+)\s*([\d\.]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                indicator_name = match.group(1).strip()
                value_str = match.group(2)
                unit = match.group(3).strip() if len(match.groups()) > 2 else ""
                reference = match.group(4).strip() if len(match.groups()) > 3 else ""
                
                # 标准化指标名称
                normalized_name = self._normalize_indicator_name(indicator_name)
                if not normalized_name:
                    continue
                
                try:
                    value = float(value_str)
                    item = self._create_blood_test_item(normalized_name, value, unit, reference)
                    return item
                except ValueError:
                    continue
        
        return None

    def _normalize_indicator_name(self, name: str) -> Optional[str]:
        """标准化指标名称"""
        name = name.strip()
        
        # 查找匹配的指标
        for standard_name, aliases in self.blood_indicators.items():
            if name == standard_name:
                return standard_name
            for alias in aliases:
                if alias.lower() in name.lower() or name.lower() in alias.lower():
                    return standard_name
        
        return None

    def _create_blood_test_item(self, name: str, value: float, unit: str, reference: str) -> BloodTestItem:
        """创建血常规检测项目"""
        # 获取参考范围
        ref_min, ref_max, standard_unit = self.reference_ranges.get(name, (0, 0, ""))
        
        # 判断状态
        if ref_min <= value <= ref_max:
            status = "正常"
            is_abnormal = False
        elif value < ref_min:
            status = "偏低"
            is_abnormal = True
        else:
            status = "偏高"
            is_abnormal = True
        
        # 使用标准单位
        final_unit = standard_unit if standard_unit else unit
        
        return BloodTestItem(
            name=name,
            value=value,
            unit=final_unit,
            reference_range=f"{ref_min}-{ref_max}",
            status=status,
            is_abnormal=is_abnormal
        )

    def process_image(self, image_path: str) -> OCRResult:
        """处理图像并返回识别结果"""
        try:
            # 提取文字
            text = self.extract_text(image_path)
            
            # 解析数据
            items = self.parse_blood_test_data(text)
            
            # 计算置信度（基于识别到的项目数量）
            confidence = min(len(items) / 10.0, 1.0) if items else 0.0
            
            return OCRResult(
                text=text,
                confidence=confidence,
                items=items,
                raw_data={"image_path": image_path, "processed_at": datetime.now().isoformat()}
            )
            
        except Exception as e:
            raise Exception(f"图像处理失败: {str(e)}")

class BloodTestAnalysisService:
    """血常规分析服务"""
    
    def __init__(self):
        self.ocr_service = BloodTestOCRService()
    
    def analyze_report(self, image_path: str, patient_name: str, hospital: str, test_date: datetime) -> BloodTestReport:
        """分析血常规报告"""
        # OCR识别
        ocr_result = self.ocr_service.process_image(image_path)
        
        # 创建报告
        report = BloodTestReport(
            patient_name=patient_name,
            test_date=test_date,
            hospital=hospital,
            items=ocr_result.items,
            image_path=image_path
        )
        
        return report
    
    def compare_with_history(self, current_report: BloodTestReport, previous_reports: List[BloodTestReport]) -> Dict[str, any]:
        """与历史数据对比"""
        if not previous_reports:
            return {"message": "无历史数据可对比"}
        
        # 按日期排序
        sorted_reports = sorted(previous_reports, key=lambda x: x.test_date)
        
        # 计算趋势
        trends = {}
        abnormal_changes = []
        
        for item in current_report.items:
            item_name = item.name
            values = []
            dates = []
            
            # 收集历史数据
            for report in sorted_reports:
                for hist_item in report.items:
                    if hist_item.name == item_name:
                        values.append(hist_item.value)
                        dates.append(report.test_date)
                        break
            
            if values:
                # 添加当前值
                values.append(item.value)
                dates.append(current_report.test_date)
                
                trends[item_name] = {
                    "values": values,
                    "dates": [d.isoformat() for d in dates],
                    "trend": self._calculate_trend(values)
                }
                
                # 检查异常变化
                if len(values) >= 2:
                    # 避免除零错误
                    if values[-2] != 0:
                        change = abs(values[-1] - values[-2]) / values[-2] * 100
                        if change > 20:  # 变化超过20%视为异常
                            abnormal_changes.append(f"{item_name}: {change:.1f}%变化")
                    else:
                        # 如果前一个值是0，检查当前值是否异常
                        if values[-1] != 0:
                            abnormal_changes.append(f"{item_name}: 从0变化到{values[-1]}")
        
        return {
            "trends": trends,
            "abnormal_changes": abnormal_changes,
            "comparison_summary": self._generate_comparison_summary(current_report, previous_reports)
        }
    
    def _calculate_trend(self, values: List[float]) -> str:
        """计算趋势"""
        if len(values) < 2:
            return "无趋势"
        
        # 简单线性回归
        x = list(range(len(values)))
        y = values
        
        # 计算斜率
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        if n * sum_x2 - sum_x ** 2 == 0:
            return "无趋势"
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        
        if slope > 0.1:
            return "上升"
        elif slope < -0.1:
            return "下降"
        else:
            return "稳定"
    
    def _generate_comparison_summary(self, current: BloodTestReport, previous: List[BloodTestReport]) -> str:
        """生成对比摘要"""
        if not previous:
            return "首次检测，无对比数据"
        
        # 统计异常项目
        current_abnormal = sum(1 for item in current.items if item.is_abnormal)
        total_items = len(current.items)
        
        summary = f"本次检测{total_items}项，异常{current_abnormal}项。"
        
        # 与最近一次对比
        latest = max(previous, key=lambda x: x.test_date)
        latest_abnormal = sum(1 for item in latest.items if item.is_abnormal)
        
        if current_abnormal < latest_abnormal:
            summary += "相比上次检测，异常项目减少。"
        elif current_abnormal > latest_abnormal:
            summary += "相比上次检测，异常项目增加。"
        else:
            summary += "相比上次检测，异常项目数量相同。"
        
        return summary

    def analyze_blood_test_data(self, blood_test_data: dict, analysis_type: str = "comprehensive") -> dict:
        """分析血常规数据"""
        try:
            # 生成患者ID
            patient_id = blood_test_data.get("patient_id", f"patient_{datetime.now().strftime('%Y%m%d%H%M%S')}")
            
            # 分析各项指标
            analysis_results = {}
            key_findings = []
            abnormal_count = 0
            
            # 血小板相关指标分析（ITP重点关注）
            plt_analysis = self._analyze_platelet_indicators(blood_test_data)
            analysis_results["platelet_analysis"] = plt_analysis
            
            if plt_analysis["status"] != "normal":
                abnormal_count += 1
                key_findings.append(f"血小板计数异常: {plt_analysis['message']}")
            
            # 红细胞相关指标分析
            rbc_analysis = self._analyze_red_blood_cell_indicators(blood_test_data)
            analysis_results["rbc_analysis"] = rbc_analysis
            
            if rbc_analysis["status"] != "normal":
                abnormal_count += 1
                key_findings.append(f"红细胞指标异常: {rbc_analysis['message']}")
            
            # 白细胞相关指标分析
            wbc_analysis = self._analyze_white_blood_cell_indicators(blood_test_data)
            analysis_results["wbc_analysis"] = wbc_analysis
            
            if wbc_analysis["status"] != "normal":
                abnormal_count += 1
                key_findings.append(f"白细胞指标异常: {wbc_analysis['message']}")
            
            # 整体状态评估
            overall_status = self._assess_overall_status(abnormal_count)
            
            # ITP专项评估
            itp_assessment = self._assess_itp_condition(blood_test_data, plt_analysis)
            
            # 生成专业建议
            recommendations = self._generate_recommendations(overall_status, itp_assessment, analysis_results)
            
            return {
                "patient_id": patient_id,
                "analysis_date": datetime.now().isoformat(),
                "overall_status": overall_status,
                "key_findings": key_findings,
                "itp_assessment": itp_assessment,
                "recommendations": recommendations,
                "detailed_analysis": analysis_results
            }
            
        except Exception as e:
            raise Exception(f"血常规数据分析失败: {str(e)}")
    
    def _analyze_platelet_indicators(self, data: dict) -> dict:
        """分析血小板相关指标"""
        plt = data.get("plt")
        mpv = data.get("mpv")
        pdw = data.get("pdw")
        
        if plt is None:
            return {"status": "unknown", "message": "血小板计数数据缺失"}
        
        # 血小板计数参考范围
        plt_normal = 100 <= plt <= 300
        
        if plt < 100:
            if plt < 50:
                status = "severe"
                message = f"血小板严重减少 ({plt} ×10^9/L)，出血风险极高"
            elif plt < 100:
                status = "moderate"
                message = f"血小板中度减少 ({plt} ×10^9/L)，需要关注"
            else:
                status = "mild"
                message = f"血小板轻度减少 ({plt} ×10^9/L)"
        elif plt > 300:
            status = "high"
            message = f"血小板计数偏高 ({plt} ×10^9/L)"
        else:
            status = "normal"
            message = f"血小板计数正常 ({plt} ×10^9/L)"
        
        return {
            "status": status,
            "message": message,
            "value": plt,
            "reference_range": "100-300 ×10^9/L",
            "is_abnormal": not plt_normal
        }
    
    def _analyze_red_blood_cell_indicators(self, data: dict) -> dict:
        """分析红细胞相关指标"""
        hgb = data.get("hgb")
        rbc = data.get("rbc")
        hct = data.get("hct")
        
        if hgb is None:
            return {"status": "unknown", "message": "血红蛋白数据缺失"}
        
        # 血红蛋白参考范围（成年男性）
        hgb_normal = 130 <= hgb <= 175
        
        if hgb < 130:
            if hgb < 80:
                status = "severe"
                message = f"严重贫血 (Hb: {hgb} g/L)"
            elif hgb < 110:
                status = "moderate"
                message = f"中度贫血 (Hb: {hgb} g/L)"
            else:
                status = "mild"
                message = f"轻度贫血 (Hb: {hgb} g/L)"
        elif hgb > 175:
            status = "high"
            message = f"血红蛋白偏高 (Hb: {hgb} g/L)"
        else:
            status = "normal"
            message = f"血红蛋白正常 (Hb: {hgb} g/L)"
        
        return {
            "status": status,
            "message": message,
            "value": hgb,
            "reference_range": "130-175 g/L",
            "is_abnormal": not hgb_normal
        }
    
    def _analyze_white_blood_cell_indicators(self, data: dict) -> dict:
        """分析白细胞相关指标"""
        wbc = data.get("wbc")
        neut_percent = data.get("neut_percent")
        lymph_percent = data.get("lymph_percent")
        
        if wbc is None:
            return {"status": "unknown", "message": "白细胞计数数据缺失"}
        
        # 白细胞计数参考范围
        wbc_normal = 3.5 <= wbc <= 9.5
        
        if wbc < 3.5:
            status = "low"
            message = f"白细胞减少 (WBC: {wbc} ×10^9/L)"
        elif wbc > 9.5:
            status = "high"
            message = f"白细胞增多 (WBC: {wbc} ×10^9/L)"
        else:
            status = "normal"
            message = f"白细胞计数正常 (WBC: {wbc} ×10^9/L)"
        
        return {
            "status": status,
            "message": message,
            "value": wbc,
            "reference_range": "3.5-9.5 ×10^9/L",
            "is_abnormal": not wbc_normal
        }
    
    def _assess_overall_status(self, abnormal_count: int) -> str:
        """评估整体状态"""
        if abnormal_count == 0:
            return "normal"
        elif abnormal_count <= 2:
            return "attention"
        else:
            return "abnormal"
    
    def _assess_itp_condition(self, data: dict, plt_analysis: dict) -> dict:
        """评估ITP状况"""
        plt = data.get("plt")
        
        # 血小板状态评估
        if plt is None:
            plt_status = "unknown"
        elif plt < 50:
            plt_status = "severe"
        elif plt < 100:
            plt_status = "moderate"
        elif plt < 150:
            plt_status = "mild"
        else:
            plt_status = "normal"
        
        # 出血风险评估
        if plt_status == "severe":
            bleeding_risk = "high"
        elif plt_status == "mild":
            bleeding_risk = "moderate"
        elif plt_status == "mild":
            bleeding_risk = "low"
        else:
            bleeding_risk = "minimal"
        
        # 治疗反应评估（基于血小板变化趋势）
        treatment_response = "待评估"
        
        return {
            "plt_status": plt_status,
            "bleeding_risk": bleeding_risk,
            "treatment_response": treatment_response
        }
    
    def _generate_recommendations(self, overall_status: str, itp_assessment: dict, analysis_results: dict) -> list:
        """生成专业建议"""
        recommendations = []
        
        # 基于整体状态的建议
        if overall_status == "abnormal":
            recommendations.append("建议及时就医，进行进一步检查和诊断")
        elif overall_status == "attention":
            recommendations.append("建议定期复查，密切关注指标变化")
        
        # 基于血小板状态的建议
        plt_status = itp_assessment["plt_status"]
        if plt_status == "severe":
            recommendations.append("血小板严重减少，建议立即就医，避免剧烈运动和创伤")
            recommendations.append("注意观察出血症状，如皮肤瘀点、鼻出血、牙龈出血等")
        elif plt_status == "moderate":
            recommendations.append("血小板中度减少，建议避免剧烈运动，定期监测")
        elif plt_status == "mild":
            recommendations.append("血小板轻度减少，建议适当运动，定期复查")
        
        # 基于出血风险的建议
        bleeding_risk = itp_assessment["bleeding_risk"]
        if bleeding_risk == "high":
            recommendations.append("出血风险高，建议避免使用阿司匹林等抗血小板药物")
            recommendations.append("注意口腔卫生，使用软毛牙刷，避免硬质食物")
        
        # 一般性建议
        recommendations.append("保持规律作息，均衡饮食，适量运动")
        recommendations.append("定期进行血常规检查，建立健康档案")
        
        return recommendations
