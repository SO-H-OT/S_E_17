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
