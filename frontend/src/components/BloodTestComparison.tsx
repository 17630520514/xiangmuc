import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, User, Building, Search, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BloodTestItem {
  name: string;
  value: number;
  unit: string;
  reference_range: string;
  status: string;
  is_abnormal: boolean;
}

interface BloodTestReport {
  id: string;
  patient_name: string;
  test_date: string;
  hospital: string;
  items: BloodTestItem[];
  notes?: string;
  created_at: string;
}

interface ComparisonData {
  trends: Record<string, {
    values: number[];
    dates: string[];
    trend: string;
  }>;
  abnormal_changes: string[];
  comparison_summary: string;
  previous_reports?: BloodTestReport[]; // 新增字段，用于存储对比的报告
}

const BloodTestComparison: React.FC = () => {
  const [reports, setReports] = useState<BloodTestReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<BloodTestReport | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReports, setFilteredReports] = useState<BloodTestReport[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = reports.filter(report => 
        report.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.hospital.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [searchQuery, reports]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
        setFilteredReports(data);
      }
    } catch (error) {
      console.error('获取报告失败:', error);
    }
  };

  const handleReportSelect = async (report: BloodTestReport) => {
    setSelectedReport(report);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/reports/compare/${report.id}`);
      if (response.ok) {
        const data = await response.json();
        // 保存完整的对比数据，包括对比报告信息
        setComparisonData({
          ...data.comparison,
          previous_reports: data.comparison.previous_reports || []
        });
      }
    } catch (error) {
      console.error('获取对比数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case '上升':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case '下降':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case '稳定':
        return <Minus className="h-4 w-4 text-blue-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '正常':
        return 'text-green-600 bg-green-100';
      case '偏高':
        return 'text-red-600 bg-red-100';
      case '偏低':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const prepareChartData = (trends: Record<string, any>) => {
    const chartData: any[] = [];
    
    Object.entries(trends).forEach(([indicator, data]) => {
      data.dates.forEach((date: string, index: number) => {
        const existingData = chartData.find(item => item.date === date);
        if (existingData) {
          existingData[indicator] = data.values[index];
        } else {
          const newData: any = { date };
          newData[indicator] = data.values[index];
          chartData.push(newData);
        }
      });
    });
    
    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          血常规报告对比分析
        </h1>
        <p className="text-gray-600">
          查看历史趋势，对比不同时期的检测结果
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：报告列表 */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              检测报告列表
            </h3>
            
            {/* 搜索框 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索患者或医院..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 报告列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleReportSelect(report)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReport?.id === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{report.patient_name}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(report.test_date)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{report.hospital}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {report.items.length} 项指标
                    </span>
                    <span className="text-xs text-gray-500">
                      {report.items.filter(item => item.is_abnormal).length} 项异常
                    </span>
                  </div>
                </div>
              ))}
              
              {filteredReports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? '没有找到匹配的报告' : '暂无检测报告'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 中间：当前报告详情 */}
        <div className="space-y-4">
          {selectedReport ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                当前报告详情
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">患者：{selectedReport.patient_name}</span>
                </div>
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">医院：{selectedReport.hospital}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">日期：{formatDate(selectedReport.test_date)}</span>
                </div>
              </div>

              {/* 指标列表 */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">检测指标</h4>
                <div className="space-y-2">
                  {selectedReport.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.value} {item.unit} (参考: {item.reference_range})
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              请选择一个报告进行对比分析
            </div>
          )}
        </div>

        {/* 右侧：对比分析结果 */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">分析中...</p>
            </div>
          ) : comparisonData ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                对比分析结果
              </h3>
              
              {/* 对比关系说明 */}
              {comparisonData.previous_reports && comparisonData.previous_reports.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">📊 对比关系</h4>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium">当前报告:</span>
                      <span className="ml-2">{selectedReport?.patient_name} - {formatDate(selectedReport?.test_date || '')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">对比报告:</span>
                      <span className="ml-2">
                        {comparisonData.previous_reports.map((report, index) => (
                          <span key={report.id} className="inline-block bg-yellow-100 px-2 py-1 rounded mr-2 mb-1">
                            {report.patient_name} - {formatDate(report.test_date)}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-2">
                      💡 系统自动查找同名患者的历史报告进行趋势分析
                    </div>
                  </div>
                </div>
              )}
              
              {/* 对比摘要 */}
              {comparisonData.comparison_summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 对比摘要</h4>
                  <p className="text-sm text-blue-800">{comparisonData.comparison_summary}</p>
                </div>
              )}

              {/* 异常变化提醒 */}
              {comparisonData.abnormal_changes && comparisonData.abnormal_changes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-red-800 mb-2">⚠️ 异常变化提醒</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {comparisonData.abnormal_changes.map((change, index) => (
                      <li key={index}>• {change}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 趋势图表 */}
              {comparisonData.trends && Object.keys(comparisonData.trends).length > 0 && (
                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-medium text-gray-800 mb-3">📈 趋势分析</h4>
                  <div className="text-xs text-gray-500 mb-2">
                    显示 {selectedReport?.patient_name} 在不同日期的指标变化趋势
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={prepareChartData(comparisonData.trends)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend />
                      {Object.keys(comparisonData.trends).map((indicator, index) => (
                        <Line
                          key={indicator}
                          type="monotone"
                          dataKey={indicator}
                          stroke={`hsl(${index * 60}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 趋势详情 */}
              {comparisonData.trends && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800 mb-2">📊 指标趋势详情</h4>
                  {Object.entries(comparisonData.trends).map(([indicator, data]) => (
                    <div key={indicator} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{indicator}</span>
                      <div className="flex items-center">
                        {getTrendIcon(data.trend)}
                        <span className="text-xs text-gray-600 ml-1">{data.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              选择报告后可查看对比分析
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodTestComparison;
