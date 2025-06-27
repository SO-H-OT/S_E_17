import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, CircularProgress, Button
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import AMapLoader from '@amap/amap-jsapi-loader';

function WeatherPage() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [location, setLocation] = useState({
    lng: 112.9823, 
    lat: 28.1949, 
    name: '长沙市芙蓉区',
    address: '湖南省长沙市芙蓉区',
    province: '湖南省'
  });
  const mapRef = useRef(null);

  // 清理高德地图全局资源
  const cleanAMapResources = () => {
    if (window.AMap) {
      try {
        // 销毁所有地图实例
        if (window.AMap.Map) {
          window.AMap.Map.prototype.destroyAll && window.AMap.Map.prototype.destroyAll();
        }
        // 删除全局对象
        delete window.AMap;
        delete window._AMapSdkLoaded;
      } catch (e) {
        console.warn('清理AMap资源出错:', e);
      }
    }
    // 清空DOM容器
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
    }
  };

  // API调用函数
  const getCityCode = async (address) => {
    try {
      const response = await axios.get('http://localhost:5000/api/geocode/city-code', {
        params: {
          key:'866d4afb3eeee428807b7b4127c8dcfe',
          address: address
        }
      });
      return response.data.success ? response.data.data.city_code : Promise.reject(response.data.error);
    } catch (error) {
      console.error('获取城市编码错误:', error);
      throw error;
    }
  };

  const getAMapWeather = async (cityCode) => {
    try {
      const response = await axios.get('http://localhost:5000/api/weather/amap', {
        params: {
           key:'866d4afb3eeee428807b7b4127c8dcfe',
           city_code: cityCode
        }
      });
      return response.data.success ? response.data.data : Promise.reject(response.data.error);
    } catch (error) {
      console.error('获取天气信息错误:', error);
      throw error;
    }
  };

  // 地图初始化
  useEffect(() => {
    let map;
    let timer;

    const initMap = async () => {
      try {
        // 先清理旧资源
        cleanAMapResources();
        
        // 加载AMap SDK
        const AMap = await AMapLoader.load({
          key: '866d4afb3eeee428807b7b4127c8dcfe',
          version: '2.0',
          plugins: ['AMap.Marker'],
          queryParams: { _t: Date.now() } // 防止缓存
        });

        if (!mapRef.current) {
          throw new Error('地图容器未找到');
        }

        // 创建新地图实例
        map = new AMap.Map(mapRef.current, {
          zoom: 12,
          center: [location.lng, location.lat],
          viewMode: '2D'
        });

        // 添加标记
        new AMap.Marker({
          position: [location.lng, location.lat],
          title: location.name,
          map: map
        });

        setMapInstance(map);
        setMapLoading(false);
        setMapError(null);
      } catch (error) {
        console.error('地图加载失败:', error);
        setMapError('地图初始化失败，请检查网络或Key配置');
        setMapLoading(false);
      }
    };

    // 延迟初始化确保DOM就绪
    timer = setTimeout(initMap, 500);
    
    return () => {
      clearTimeout(timer);
      if (map) {
        try {
          map.destroy();
        } catch (e) {
          console.warn('地图销毁错误:', e);
        }
      }
      cleanAMapResources();
      setMapInstance(null);
    };
  }, []);

  // 位置更新逻辑
  useEffect(() => {
    if (!mapInstance || !location.lng || !location.lat) return;

    try {
      mapInstance.setCenter([location.lng, location.lat]);
      mapInstance.clearMap();
      new window.AMap.Marker({
        position: [location.lng, location.lat],
        title: location.name,
        map: mapInstance
      });
    } catch (error) {
      console.error('地图更新失败:', error);
    }
  }, [location.lng, location.lat, mapInstance]);

  // 天气数据获取
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      try {
        const cityCode = await getCityCode(location.address);
        const weatherRes = await getAMapWeather(cityCode);

        if (weatherRes.city_info) {
          setLocation(prev => ({
            ...prev,
            name: weatherRes.city_info.name,
            province: weatherRes.city_info.name.split('市')[0] || '湖南省',
            lng: weatherRes.city_info.longitude,
            lat: weatherRes.city_info.latitude
          }));
        }
        
        if (weatherRes.weather?.casts) {
          setWeatherData(weatherRes.weather.casts.map(cast => ({
            date: cast.date,
            dayWeather: cast.day.weather,
            nightWeather: cast.night.weather,
            dayTemp: parseInt(cast.day.temp),
            nightTemp: parseInt(cast.night.temp),
            dayWind: `${cast.day.wind}风 ${cast.day.power}级`,
            nightWind: `${cast.night.wind}风 ${cast.night.power}级`
          })));
        }
      } catch (error) {
        console.error('获取天气数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeatherData();
  }, [location.address]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>     

      <Typography variant="h4" gutterBottom>
        天气预报
      </Typography>
      
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {/* 地图容器 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>城市位置</Typography>
              <Box sx={{ 
                width: '100%', 
                height: 400,
                minHeight: 400,
                position: 'relative',
                border: '1px solid #eee',
                backgroundColor: '#fafafa'
              }}>
                {mapLoading && !mapError && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}>
                    <CircularProgress />
                  </Box>
                )}
                
                {mapError && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'error.main'
                  }}>
                    <Typography>{mapError}</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => window.location.reload()}
                      sx={{ mt: 2 }}
                    >
                      重新加载地图
                    </Button>
                  </Box>
                )}
                
                <div 
                  ref={mapRef} 
                  style={{ 
                    width: '100%',
                    height: '100%',
                    minHeight: 'inherit',
                    opacity: mapLoading ? 0 : 1,
                    transition: 'opacity 0.3s'
                  }} 
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* 天气详情 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>近期天气详情</Typography>
              <Grid container spacing={2}>
                {weatherData?.map((day) => (
                  <Grid item xs={12} sm={6} md={3} key={day.date}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid #eee', 
                      borderRadius: 1,
                      textAlign: 'center'
                    }}>
                      <Typography variant="subtitle1">{day.date}</Typography>
                      <Typography>白天: {day.dayWeather} {day.dayTemp}°C</Typography>
                      <Typography>夜间: {day.nightWeather} {day.nightTemp}°C</Typography>
                      <Typography>风向: {day.dayWind}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          
          {/* 温度图表 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>未来4天温度变化</Typography>
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <LineChart data={weatherData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" name="白天温度" unit="°C" />
                    <YAxis yAxisId="right" orientation="right" name="夜间温度" unit="°C" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="dayTemp" 
                      stroke="#ff4444" 
                      name="白天温度" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="nightTemp" 
                      stroke="#2196f3" 
                      name="夜间温度" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default WeatherPage;