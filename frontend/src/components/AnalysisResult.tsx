import React from 'react';
import { AnalysisResponse } from '../types/bloodTest';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Heart, 
  Activity,
  AlertCircle,
  Clock
} from 'lucide-react';

interface AnalysisResultProps {
  result: AnalysisResponse;
  onNewAnalysis: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onNewAnalysis }) => {
  // 获取整体状态的图标和样式
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'attention':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'abnormal':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '指标正常';
      case 'attention':
        return '需要关注';
      case 'abnormal':
        return '异常指标';
      default:
        return '未知状态';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 border-green-200';
      case 'attention':
        return 'bg-yellow-50 border-yellow-200';
      case 'abnormal':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // 获取血小板状态的严重程度颜色
  const getPltStatusColor = (pltStatus: string) => {
    switch (pltStatus) {
      case 'severe':
        return 'text-red-600 bg-red-100';
      case 'moderate':
        return 'text-orange-600 bg-orange-100';
      case 'mild':
        return 'text-yellow-600 bg-yellow-100';
      case 'normal':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBleedingRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'moderate':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      case 'minimal':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">分析结果</h2>
        <button
          onClick={onNewAnalysis}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          新建分析
        </button>
      </div>

      {/* 整体状态概览 */}
      <div className={`p-6 rounded-lg border-2 ${getStatusBgColor(result.overall_status)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon(result.overall_status)}
            <h3 className="text-xl font-bold text-gray-900 ml-3">
              分析结果: {getStatusText(result.overall_status)}
            </h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(result.analysis_date).toLocaleString('zh-CN')}
          </div>
        </div>
        <p className="text-gray-600">
          患者ID: <span className="font-medium">{result.patient_id}</span>
        </p>
      </div>

      {/* ITP专项评估 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Heart className="w-6 h-6 mr-2 text-red-500" />
            ITP专项评估
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">血小板状态</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPltStatusColor(result.itp_assessment.plt_status)}`}>
              {result.itp_assessment.plt_status === 'severe' && '严重减少'}
              {result.itp_assessment.plt_status === 'moderate' && '中度减少'}
              {result.itp_assessment.plt_status === 'mild' && '轻度减少'}
              {result.itp_assessment.plt_status === 'normal' && '正常'}
              {!['severe', 'moderate', 'mild', 'normal'].includes(result.itp_assessment.plt_status) && '待评估'}
            </span>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">出血风险</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBleedingRiskColor(result.itp_assessment.bleeding_risk)}`}>
              {result.itp_assessment.bleeding_risk === 'high' && '高风险'}
              {result.itp_assessment.bleeding_risk === 'moderate' && '中等风险'}
              {result.itp_assessment.bleeding_risk === 'low' && '低风险'}
              {result.itp_assessment.bleeding_risk === 'minimal' && '极低风险'}
              {!['high', 'moderate', 'low', 'minimal'].includes(result.itp_assessment.bleeding_risk) && '待评估'}
            </span>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">治疗反应</h4>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
              {result.itp_assessment.treatment_response || '待评估'}
            </span>
          </div>
        </div>
      </div>

      {/* 关键发现 */}
      {result.key_findings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-500" />
              关键发现
            </h3>
          </div>
          <div className="space-y-2">
            {result.key_findings.map((finding, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 专业建议 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
            专业建议
          </h3>
        </div>
        <div className="space-y-3">
          {result.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                {index + 1}
              </div>
              <span className="text-green-800">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 重要提醒 */}
      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-amber-500 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-2">重要提醒</h4>
            <p className="text-amber-700 text-sm leading-relaxed">
              本分析结果仅供参考，不能替代专业医疗诊断。如有任何健康疑虑或症状，请及时就医咨询专业血液科医生。
              ITP患者需要定期监测血小板计数，并在医生指导下调整治疗方案。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
