import axios from 'axios';
import { AnalysisRequest, AnalysisResponse, PatientHistory } from '../types/bloodTest';

// API基础配置 - 使用相对路径，让lighttpd代理处理
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// API服务函数
export const bloodTestAPI = {
  // 分析血常规检验结果
  analyzeBloodTest: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    try {
      const response = await api.post('/api/analyze', request);
      return response.data;
    } catch (error) {
      throw new Error('分析血常规结果时发生错误');
    }
  },

  // 获取患者历史记录
  getPatientHistory: async (patientId: string): Promise<PatientHistory> => {
    try {
      const response = await api.get(`/api/patient/${patientId}/history`);
      return response.data;
    } catch (error) {
      throw new Error('获取患者历史记录时发生错误');
    }
  },

  // 获取血常规参考范围
  getReferenceRanges: async (): Promise<any> => {
    try {
      const response = await api.get('/api/reference-ranges');
      return response.data;
    } catch (error) {
      throw new Error('获取参考范围时发生错误');
    }
  },

  // 健康检查
  healthCheck: async (): Promise<any> => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      throw new Error('API服务不可用');
    }
  },
};

export default api;



