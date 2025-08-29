import React, { useState, useRef } from 'react';
import { Upload, FileImage, User, Building, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadResponse {
  patient_name: string;
  hospital: string;
  test_date: string;
  upload_time: string;
  file_path: string;
  analysis: {
    hemoglobin: string;
    white_blood_cells: string;
    platelets: string;
    overall_assessment: string;
  };
  status: string;
  fix_applied: boolean;
}

const BloodTestUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patient_name: '',
    hospital: '',
    test_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请先选择图片文件');
      return;
    }

    if (!formData.patient_name || !formData.hospital || !formData.test_date) {
      setError('请填写完整信息');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const data = new FormData();
      data.append('image', selectedFile);
      data.append('patient_name', formData.patient_name);
      data.append('hospital', formData.hospital);
      data.append('test_date', formData.test_date);
      if (formData.notes) {
        data.append('notes', formData.notes);
      }

      const response = await fetch('/api/upload-report', {
        method: 'POST',
        body: data,
      });

      const result: UploadResponse = await response.json();
      
      if (response.ok && result.status === 'success') {
        setUploadResult(result);
        setError(null);
      } else {
        setUploadResult(null);
        setError(result.status === 'error' ? '识别失败，请检查图片质量或重试' : '上传失败，请重试');
      }
    } catch (error) {
      setUploadResult(null);
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadResult(null);
    setError(null);
    setFormData({
      patient_name: '',
      hospital: '',
      test_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          血常规报告识别
        </h1>
        <p className="text-gray-600">
          上传血常规报告图片，AI自动识别指标和数值
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：上传区域 */}
        <div className="space-y-6">
          {/* 图片上传 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!previewUrl ? (
              <div 
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  <span className="text-blue-500 font-medium">点击上传</span> 或拖拽图片到此处
                </p>
                <p className="text-sm text-gray-500">
                  支持 JPG、PNG、BMP 等格式
                </p>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="预览" 
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <FileImage className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* 表单信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                患者姓名
              </label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入患者姓名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-2" />
                医院名称
              </label>
              <input
                type="text"
                name="hospital"
                value={formData.hospital}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入医院名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                检测日期
              </label>
              <input
                type="date"
                name="test_date"
                value={formData.test_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                备注信息
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="可选：添加备注信息"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? '识别中...' : '开始识别'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
          </div>
        </div>

        {/* 右侧：结果显示 */}
        <div className="space-y-6">
          {/* 错误信息显示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-red-800">
                  识别失败
                </span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 成功信息显示 */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800">
                  报告识别成功
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-green-700">
                <p>患者姓名: {uploadResult.patient_name}</p>
                <p>医院名称: {uploadResult.hospital}</p>
                <p>检测日期: {uploadResult.test_date}</p>
                <p>上传时间: {uploadResult.upload_time}</p>
              </div>
            </div>
          )}

          {/* 分析结果 */}
          {uploadResult?.analysis && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                分析结果
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">血红蛋白</div>
                  <div className={`text-lg font-medium ${getStatusColor(uploadResult.analysis.hemoglobin)}`}>
                    {uploadResult.analysis.hemoglobin}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">白细胞</div>
                  <div className={`text-lg font-medium ${getStatusColor(uploadResult.analysis.white_blood_cells)}`}>
                    {uploadResult.analysis.white_blood_cells}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">血小板</div>
                  <div className={`text-lg font-medium ${getStatusColor(uploadResult.analysis.platelets)}`}>
                    {uploadResult.analysis.platelets}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border col-span-2">
                  <div className="text-sm text-gray-600">整体评估</div>
                  <div className="text-lg font-medium text-gray-800">
                    {uploadResult.analysis.overall_assessment}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">使用说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 支持清晰的血常规报告图片</li>
              <li>• 自动识别常见血常规指标</li>
              <li>• 智能判断指标是否异常</li>
              <li>• 可保存历史记录进行对比</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodTestUpload;


