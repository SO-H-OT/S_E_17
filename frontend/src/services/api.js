import axios from 'axios';

// 获取API基础URL的函数
export const getApiBaseUrl = async () => {
  const savedApiUrl = localStorage.getItem('apiBaseUrl');
  if (savedApiUrl) {
    return savedApiUrl;
  }

  try {
    const storedIpToTry = localStorage.getItem('lastKnownIp') || 'localhost';
    const response = await axios.get(`http://${storedIpToTry}:5000/api/server-info`, { timeout: 3000 });
    
    if (response.data.success) {
      const newBaseUrl = `http://${response.data.ip}:${response.data.port}`;
      localStorage.setItem('apiBaseUrl', newBaseUrl);
      localStorage.setItem('lastKnownIp', response.data.ip);
      return newBaseUrl;
    }
  } catch (error) {
    console.error("Failed to fetch server info:", error);
  }
  
  return "http://localhost:5000";
};

// 创建API客户端
export const createApiClient = async () => {
  const baseURL = await getApiBaseUrl();
  
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// API调用辅助函数
export const callApi = async (apiFunc) => {
  try {
    const apiClient = await createApiClient();
    return await apiFunc(apiClient);
  } catch (error) {
    if (error.message.includes('Network Error')) {
      localStorage.removeItem('apiBaseUrl');
    }
    throw error;
  }
};

// 整合所有API调用到一个对象中
export const apiService = {
  // 用户相关API
  loginUser: async (username, password) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.post('/api/login', { username, password });
      return response.data;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  registerUser: async (userData) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.post('/api/register', userData);
      return response.data;
    } catch (error) {
      console.error("Registration API error:", error);
      throw error;
    }
  },

  getUserInfo: async (username) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get(`/api/get_user/${username}`);
      return response.data;
    } catch (error) {
      console.error("Get user info API error:", error);
      throw error;
    }
  },

  getAllUsers: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/users');
      return response.data;
    } catch (error) {
      console.error("Get all users API error:", error);
      throw error;
    }
  },

  deleteUser: async (username, operatorRole) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.delete(`/api/users/${username}`, {
        data: { role: operatorRole }
      });
      return response.data;
    } catch (error) {
      console.error("Delete user API error:", error);
      throw error;
    }
  },

  updateUser: async (username, userData, operatorRole) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.put(`/api/users/${username}`, {
        ...userData,
        operator_role: operatorRole
      });
      return response.data;
    } catch (error) {
      console.error("Update user API error:", error);
      throw error;
    }
  },

  // 鱼类统计数据
  getFishStatistics: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/fish-statistics');
      return response.data;
    } catch (error) {
      console.error("Fish statistics API error:", error);
      throw new Error('获取鱼类统计数据失败');
    }
  },

  // 获取在线市场数据
  getOnlineMarketData: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/online-market');
      return response.data;
    } catch (error) {
      throw new Error('获取在线市场数据失败');
    }
  },

  // 获取天气数据
  getWeatherData: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/weather');
      return response.data;
    } catch (error) {
      throw new Error('获取天气数据失败');
    }
  },

  // 获取空气质量数据
  getAirQualityData: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/air-quality');
      return response.data;
    } catch (error) {
      throw new Error('获取空气质量数据失败');
    }
  },

  // 获取水质监测数据
  getWaterQuality: async (year, month, province, basin) => {
    const apiClient = await createApiClient();
    let params = { year, month };
    if (province) params.province = province;
    if (basin) params.basin = basin;
    
    try {
      const response = await apiClient.get('/api/water-quality', { params });
      return response.data;
    } catch (error) {
      throw new Error('获取水质数据失败');
    }
  },

  // 获取水质监测可用时间段
  getWaterQualityPeriods: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/water-quality/periods');
      return response.data;
    } catch (error) {
      throw new Error('获取水质时间段失败');
    }
  },

  // 获取所有省份
  getProvinces: async () => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/water-quality/provinces');
      return response.data;
    } catch (error) {
      throw new Error('获取省份数据失败');
    }
  },

  // 获取所有流域
  getBasins: async (province) => {
    const apiClient = await createApiClient();
    let params = {};
    if (province) params.province = province;
    
    try {
      const response = await apiClient.get('/api/water-quality/basins', { params });
      return response.data;
    } catch (error) {
      throw new Error('获取流域数据失败');
    }
  },

  // 获取水质统计数据
  getWaterQualityStats: async (year, month) => {
    const apiClient = await createApiClient();
    let params = { year, month };
    
    try {
      const response = await apiClient.get('/api/water-quality/statistics', { params });
      return response.data;
    } catch (error) {
      throw new Error('获取水质统计数据失败');
    }
  },

  // 数据导出相关API
  exportWaterQuality: async (year, month, province, basin, format = 'csv') => {
    const apiClient = await createApiClient();
    let params = { year, month, format };
    if (province) params.province = province;
    if (basin) params.basin = basin;
    
    try {
      const response = await apiClient.get('/api/export/water-quality', { 
        params,
        responseType: 'blob' // 重要：设置响应类型为blob以处理文件下载
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 生成文件名
      let filename = `water_quality_${year}_${month}`;
      if (province) filename += `_${province}`;
      if (basin) filename += `_${basin}`;
      filename += format === 'excel' || format === 'xlsx' ? '.xlsx' : '.csv';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: '导出成功' };
    } catch (error) {
      throw new Error('导出水质数据失败');
    }
  },

  exportFishData: async (format = 'csv') => {
    const apiClient = await createApiClient();
    
    try {
      const response = await apiClient.get('/api/export/fish-data', { 
        params: { format },
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `fish_data.${format === 'excel' || format === 'xlsx' ? 'xlsx' : 'csv'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: '导出成功' };
    } catch (error) {
      throw new Error('导出鱼类数据失败');
    }
  },

  exportSpeciesData: async (species, format = 'csv') => {
    const apiClient = await createApiClient();
    
    try {
      const response = await apiClient.get('/api/export/species-data', { 
        params: { species, format },
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `${species}_data.${format === 'excel' || format === 'xlsx' ? 'xlsx' : 'csv'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: '导出成功' };
    } catch (error) {
      throw new Error('导出品种数据失败');
    }
  },

  exportUsers: async (format = 'csv') => {
    const apiClient = await createApiClient();
    
    try {
      const response = await apiClient.get('/api/export/users', { 
        params: { format },
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `users_data.${format === 'excel' || format === 'xlsx' ? 'xlsx' : 'csv'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: '导出成功' };
    } catch (error) {
      throw new Error('导出用户数据失败');
    }
  },

  exportComprehensiveReport: async (year, month, format = 'pdf') => {
    // URL直接下载方式
    const url = `http://localhost:5000/api/export/comprehensive-report?year=${year}&month=${month}&format=${format}`;
    
    console.log('导出综合报告 URL:', url);
    console.log('参数:', { year, month, format });
    
    try {
      window.open(url, '_blank');
      return { success: true, message: '报告正在生成并下载...' };
    } catch (error) {
      console.error('导出综合报告错误:', error);
      throw new Error('导出综合报告失败');
    }
  },

  // 数据上传功能
  uploadData: async (dataType, data) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.post('/api/upload/data', {
        dataType,
        data
      });
      return response.data;
    } catch (error) {
      console.error("Upload data API error:", error);
      throw new Error(`上传${dataType === 'water_quality' ? '水质' : '鱼类'}数据失败: ${error.response?.data?.error || error.message}`);
    }
  },

  // CSV文件上传
  uploadCsvData: async (dataType, csvData, progressCallback) => {
    const apiClient = await createApiClient();
    try {
      // 分批上传大量数据
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < csvData.length; i += batchSize) {
        batches.push(csvData.slice(i, i + batchSize));
      }

      let uploadedCount = 0;
      for (const batch of batches) {
        const response = await apiClient.post('/api/upload/csv', {
          dataType,
          data: batch
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error);
        }
        
        uploadedCount += batch.length;
        if (progressCallback) {
          progressCallback({ uploaded: uploadedCount, total: csvData.length });
        }
      }

      return { success: true, message: `成功上传 ${uploadedCount} 条数据` };
    } catch (error) {
      console.error("Upload CSV data API error:", error);
      throw new Error(`批量上传${dataType === 'water_quality' ? '水质' : '鱼类'}数据失败: ${error.response?.data?.error || error.message}`);
    }
  },

  // 获取最近上传的数据
  getRecentUploadedData: async (dataType, limit = 20) => {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/api/recent-data', {
        params: { dataType, limit }
      });
      return response.data;
    } catch (error) {
      console.error("Get recent data API error:", error);
      throw new Error(`获取最近上传${dataType === 'water_quality' ? '水质' : '鱼类'}数据失败: ${error.response?.data?.error || error.message}`);
    }
  }
};

// 为了向后兼容，导出单独的函数版本
export const { 
  loginUser, 
  registerUser, 
  getUserInfo, 
  getAllUsers,
  deleteUser,
  updateUser
} = apiService;
