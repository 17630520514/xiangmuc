import React, { useState } from 'react';
import { BloodTestResult } from '../types/bloodTest';
import { Activity, Calendar, User, AlertCircle } from 'lucide-react';

interface BloodTestFormProps {
  onSubmit: (data: BloodTestResult) => void;
  loading?: boolean;
}

const BloodTestForm: React.FC<BloodTestFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<BloodTestResult>({
    patient_id: '',
    test_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 血常规指标分组
  const indicatorGroups = {
    basic: {
      title: '基础信息',
      icon: <User className="w-5 h-5" />,
      fields: [
        { key: 'patient_id', label: '患者ID', type: 'text', required: true },
        { key: 'test_date', label: '检验日期', type: 'date', required: true },
      ]
    },
    platelets: {
      title: '血小板相关指标 (ITP重点关注)',
      icon: <Activity className="w-5 h-5 text-red-500" />,
      fields: [
        { key: 'plt', label: '血小板计数 (PLT)', unit: '10^9/L', type: 'number' },
        { key: 'mpv', label: '平均血小板体积 (MPV)', unit: 'fL', type: 'number' },
        { key: 'pdw', label: '血小板分布宽度 (PDW)', unit: '%', type: 'number' },
        { key: 'pct', label: '血小板压积 (PCT)', unit: '%', type: 'number' },
        { key: 'p_lcr', label: '大血小板比率 (P-LCR)', unit: '%', type: 'number' },
      ]
    },
    wbc: {
      title: '白细胞系列',
      icon: <Activity className="w-5 h-5 text-blue-500" />,
      fields: [
        { key: 'wbc', label: '白细胞计数 (WBC)', unit: '10^9/L', type: 'number' },
        { key: 'neut_percent', label: '中性粒细胞%', unit: '%', type: 'number' },
        { key: 'lymph_percent', label: '淋巴细胞%', unit: '%', type: 'number' },
        { key: 'mono_percent', label: '单核细胞%', unit: '%', type: 'number' },
        { key: 'eos_percent', label: '嗜酸性粒细胞%', unit: '%', type: 'number' },
        { key: 'baso_percent', label: '嗜碱性粒细胞%', unit: '%', type: 'number' },
      ]
    },
    rbc: {
      title: '红细胞系列',
      icon: <Activity className="w-5 h-5 text-green-500" />,
      fields: [
        { key: 'rbc', label: '红细胞计数 (RBC)', unit: '10^12/L', type: 'number' },
        { key: 'hgb', label: '血红蛋白 (HGB)', unit: 'g/L', type: 'number' },
        { key: 'hct', label: '红细胞压积 (HCT)', unit: '%', type: 'number' },
        { key: 'mcv', label: '平均红细胞体积 (MCV)', unit: 'fL', type: 'number' },
      ]
    }
  };

  const handleInputChange = (key: string, value: string) => {
    const newFormData = { ...formData };
    if (value === '') {
      delete (newFormData as any)[key];
    } else {
      (newFormData as any)[key] = key === 'patient_id' || key === 'test_date' ? value : parseFloat(value);
    }
    setFormData(newFormData);

    // 清除相关错误
    if (errors[key]) {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient_id) {
      newErrors.patient_id = '请输入患者ID';
    }

    if (!formData.test_date) {
      newErrors.test_date = '请选择检验日期';
    }

    // 检查是否至少填写了一个指标
    const hasIndicators = Object.keys(formData).some(
      key => key !== 'patient_id' && key !== 'test_date' && formData[key as keyof BloodTestResult] != null
    );

    if (!hasIndicators) {
      newErrors.general = '请至少填写一个血常规指标';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.key as keyof BloodTestResult];
    const displayValue = value != null ? value.toString() : '';

    return (
      <div key={field.key} className="mb-4">
        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.unit && <span className="text-gray-500 text-xs ml-1">({field.unit})</span>}
        </label>
        <input
          type={field.type}
          id={field.key}
          value={displayValue}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 ${
            errors[field.key] ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={field.type === 'number' ? '请输入数值' : ''}
          step={field.type === 'number' ? '0.01' : undefined}
        />
        {errors[field.key] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors[field.key]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="medical-card">
      <div className="medical-card-header">
        <h2 className="medical-card-title flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-medical-600" />
          血常规检验数据录入
        </h2>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errors.general}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.entries(indicatorGroups).map(([groupKey, group]) => (
          <div key={groupKey} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              {group.icon}
              <span className="ml-2">{group.title}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(renderField)}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-medical-600 hover:bg-medical-700 focus:ring-medical-500'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                分析中...
              </div>
            ) : (
              '开始分析'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BloodTestForm;



