import React, { useState } from 'react';
import BloodTestForm from './components/BloodTestForm';
import AnalysisResult from './components/AnalysisResult';
import BloodTestUpload from './components/BloodTestUpload';
import BloodTestComparison from './components/BloodTestComparison';
import { BloodTestResult, AnalysisResponse } from './types/bloodTest';
import { bloodTestAPI } from './services/api';
import { Activity, Heart, AlertCircle, CheckCircle, Upload, BarChart3, FileText } from 'lucide-react';

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentView, setCurrentView] = useState<'form' | 'upload' | 'comparison'>('form');

  // 检查API状态
  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        await bloodTestAPI.healthCheck();
        setApiStatus('online');
      } catch (err) {
        setApiStatus('offline');
      }
    };
    checkApiStatus();
  }, []);

  const handleAnalyze = async (bloodTest: BloodTestResult) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await bloodTestAPI.analyzeBloodTest({
        blood_test: bloodTest,
        analysis_type: 'comprehensive'
      });
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析过程中发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'upload':
        return <BloodTestUpload />;
      case 'comparison':
        return <BloodTestComparison />;
      default:
        return (
          <>
            {!analysisResult ? (
              <BloodTestForm onSubmit={handleAnalyze} loading={loading} />
            ) : (
              <AnalysisResult 
                result={analysisResult} 
                onNewAnalysis={handleNewAnalysis}
              />
            )}
          </>
        );
    }
  };

  const getNavButtonClass = (view: string) => {
    return `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      currentView === view
        ? 'bg-blue-100 text-blue-700 border border-blue-200'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">血常规指标分析AI工具</h1>
                <p className="text-sm text-gray-600">专为ITP患者设计的智能血常规分析</p>
              </div>
            </div>
            
            {/* API状态指示器 */}
            <div className="flex items-center">
              {apiStatus === 'checking' && (
                <div className="flex items-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                  检查中...
                </div>
              )}
              {apiStatus === 'online' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  服务正常
                </div>
              )}
              {apiStatus === 'offline' && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  服务离线
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 功能导航 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('form')}
              className={getNavButtonClass('form')}
            >
              <FileText className="w-4 h-4 mr-2" />
              手动输入分析
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={getNavButtonClass('upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              图片识别
            </button>
            <button
              onClick={() => setCurrentView('comparison')}
              className={getNavButtonClass('comparison')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              历史对比
            </button>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 服务离线提示 */}
        {apiStatus === 'offline' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">
                后端服务暂时不可用。请确保后端API服务正在运行（http://localhost:8000）
              </p>
            </div>
          </div>
        )}

        {/* 动态渲染当前视图 */}
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
