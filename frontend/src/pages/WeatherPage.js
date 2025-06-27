import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, CircularProgress
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import AMapLoader from '@amap/amap-jsapi-loader';

function WeatherPage() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const [location, setLocation] = useState({
    lng: 112.9823, 
    lat: 28.1949, 
    name: '长沙市芙蓉区',
    address: '湖南省长沙市芙蓉区',
    province: '湖南省'
  });
  const mapRef = useRef(null);

  // 直接使用axios调用后端API
  const getCityCode = async (address) => {
    try {
      const response = await axios.get('http://localhost:5000/api/geocode/city-code', {
        params: {
          key:'866d4afb3eeee428807b7b4127c8dcfe',
          address: address
        }
      });
      
      if (response.data.success) {
        return response.data.data.city_code;
      } else {
        throw new Error(response.data.error || '获取城市编码失败');
      }
    } catch (error) {
      console.error('获取城市编码错误:', error);
      throw error;
    }
  };

  // 获取天气信息
  const getAMapWeather = async (cityCode) => {
    try {
      const response = await axios.get('http://localhost:5000/api/weather/amap', {
        params: {
           key:'866d4afb3eeee428807b7b4127c8dcfe',
           city_code: cityCode
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取天气信息失败');
      }
    } catch (error) {
      console.error('获取天气信息错误:', error);
      throw error;
    }
  };

  // 初始化地图
  useEffect(() => {
    AMapLoader.load({
      key: '866d4afb3eeee428807b7b4127c8dcfe', // 替换为你的高德地图key
      version: '2.0',
      plugins: ['AMap.Marker'] // 需要使用的插件
    }).then((AMap) => {
      const map = new AMap.Map(mapRef.current, {
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
    }).catch(error => {
      console.error('地图加载失败:', error);
      setMapLoading(false);
    });

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, []);

  // 当地图位置变化时更新地图
  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.setCenter([location.lng, location.lat]);
    
    // 清除旧标记
    mapInstance.clearMap();
    
    // 添加新标记
    new window.AMap.Marker({
      position: [location.lng, location.lat],
      title: location.name,
      map: mapInstance
    });
  }, [location.lng, location.lat, mapInstance]);

  useEffect(() => {
    const fetchWeatherData = async () => {
        setLoading(true);
        try {
            const cityCode = await getCityCode(location.address);
            const weatherRes = await getAMapWeather(cityCode);

            console.log('完整天气响应:', weatherRes);

            // 处理城市信息
            if (weatherRes.city_info) {
                setLocation(prev => ({
                    ...prev,
                    name: weatherRes.city_info.name,
                    province: weatherRes.city_info.name.split('市')[0] || '湖南省',
                    lng: weatherRes.city_info.longitude,
                    lat: weatherRes.city_info.latitude
                }));
            }
            
            if (weatherRes.weather && weatherRes.weather.casts) {
                const casts = weatherRes.weather.casts;
                const chartData = casts.map(cast => ({
                    date: cast.date,
                    dayWeather: cast.day.weather,
                    nightWeather: cast.night.weather,
                    dayTemp: parseInt(cast.day.temp),
                    nightTemp: parseInt(cast.night.temp),
                    dayWind: `${cast.day.wind}风 ${cast.day.power}级`,
                    nightWind: `${cast.night.wind}风 ${cast.night.power}级`
                }));
                
                setWeatherData(chartData);
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
       {location.name} 天气预报
      </Typography>
      
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {/* 地图部分 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>城市位置</Typography>
              <Box sx={{ width: '100%', height: 400, position: 'relative' }}>
                {mapLoading && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <CircularProgress />
                  </Box>
                )}
                <div 
                  ref={mapRef} 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    opacity: mapLoading ? 0 : 1,
                    transition: 'opacity 0.3s'
                  }} 
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* 温度图表部分 */}
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
          
          {/* 天气详情部分 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>近期天气详情</Typography>
              <Grid container spacing={2}>
                {weatherData?.map((day, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
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
        </Grid>
      )}
    </Container>
  );
}

export default WeatherPage;