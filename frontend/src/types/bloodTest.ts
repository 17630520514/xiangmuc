// 血常规检验结果数据类型定义
export interface BloodTestResult {
  patient_id: string;
  test_date: string;
  // 血细胞计数相关指标
  wbc?: number;  // 白细胞计数
  neut_percent?: number;  // 中性粒细胞百分比
  lymph_percent?: number;  // 淋巴细胞百分比
  mono_percent?: number;  // 单核细胞百分比
  eos_percent?: number;  // 嗜酸性粒细胞百分比
  baso_percent?: number;  // 嗜碱性粒细胞百分比
  neut_count?: number;  // 中性粒细胞绝对值
  lymph_count?: number;  // 淋巴细胞绝对值
  mono_count?: number;  // 单核细胞绝对值
  eos_count?: number;  // 嗜酸性粒细胞绝对值
  baso_count?: number;  // 嗜碱性粒细胞绝对值
  // 红细胞相关指标
  rbc?: number;  // 红细胞计数
  hgb?: number;  // 血红蛋白
  hct?: number;  // 红细胞压积
  mcv?: number;  // 平均红细胞体积
  // 血小板相关指标（ITP患者重点关注）
  plt?: number;  // 血小板计数
  mpv?: number;  // 平均血小板体积
  pdw?: number;  // 血小板分布宽度
  pct?: number;  // 血小板压积
  p_lcr?: number;  // 大血小板比率
}

// 分析请求数据类型
export interface AnalysisRequest {
  blood_test: BloodTestResult;
  analysis_type?: string;
}

// 分析结果响应类型
export interface AnalysisResponse {
  patient_id: string;
  analysis_date: string;
  overall_status: 'normal' | 'attention' | 'abnormal';
  key_findings: string[];
  itp_assessment: {
    plt_status: string;
    bleeding_risk: string;
    treatment_response: string;
    recommendations: string[];
  };
  recommendations: string[];
  trend_analysis?: any;
}

// 参考范围类型
export interface ReferenceRange {
  min: number;
  max: number;
  unit: string;
  name: string;
}

// 指标分析结果类型
export interface IndicatorAnalysis {
  status: 'normal' | 'high' | 'low' | 'unknown';
  message: string;
  value: number;
  reference_min: number;
  reference_max: number;
  unit: string;
}

// 患者历史记录类型
export interface PatientHistory {
  patient_id: string;
  history: BloodTestResult[];
}



