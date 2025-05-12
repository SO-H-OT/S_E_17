import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const apiService = {

  // 获取鱼类统计数据
  getFishStatistics: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/fish-statistics`);
      return response.data;
    } catch (error) {
      throw new Error('获取鱼类统计数据失败');
    }
  },

  // 获取在线市场数据
  getOnlineMarketData: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/online-market`);
      return response.data;
    } catch (error) {
      throw new Error('获取在线市场数据失败');
    }
  },

  // 获取天气数据
  getWeatherData: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/weather`);
      return response.data;
    } catch (error) {
      throw new Error('获取天气数据失败');
    }
  },

  // 获取空气质量数据
  getAirQualityData: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/air-quality`);
      return response.data;
    } catch (error) {
      throw new Error('获取空气质量数据失败');
    }
  },

  // 获取水质监测数据
  getWaterQuality: async (year, month, province, basin) => {
    let url = `${BASE_URL}/water-quality?year=${year}&month=${month}`;
    if (province) url += `&province=${province}`;
    if (basin) url += `&basin=${basin}`;
    
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error('获取水质数据失败');
    }
  },

  // 获取水质监测可用时间段
  getWaterQualityPeriods: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/water-quality/periods`);
      return response.data;
    } catch (error) {
      throw new Error('获取水质时间段失败');
    }
  },

  // 获取所有省份
  getProvinces: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/water-quality/provinces`);
      return response.data;
    } catch (error) {
      throw new Error('获取省份数据失败');
    }
  },

  // 获取所有流域
  getBasins: async (province) => {
    let url = `${BASE_URL}/water-quality/basins`;
    if (province) url += `?province=${province}`;
    
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error('获取流域数据失败');
    }
  },

  // 获取水质统计数据
  getWaterQualityStats: async (year, month) => {
    let url = `${BASE_URL}/water-quality/statistics?year=${year}&month=${month}`;
    
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error('获取水质统计数据失败');
    }
  }
};
