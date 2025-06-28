import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, CircularProgress, Button,
  TextField, InputAdornment, IconButton, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Card, CardContent, CardHeader, Chip
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import AMapLoader from '@amap/amap-jsapi-loader';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
`;

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.8)',
  },
}));

const AppleButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  ...(variant === 'primary' && {
    background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #0051D5 0%, #003D9F 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 122, 255, 0.3)',
    },
  }),
  ...(variant === 'success' && {
    background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #28A745 0%, #1F7A32 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(52, 199, 89, 0.3)',
    },
  }),
}));

const StatusChip = styled(Chip)(({ status }) => ({
  borderRadius: '20px',
  fontWeight: 600,
  ...(status === 'good' && {
    background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
    color: 'white',
  }),
  ...(status === 'warning' && {
    background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
    color: 'white',
  }),
  ...(status === 'danger' && {
    background: 'linear-gradient(135deg, #FF3B30 0%, #D70015 100%)',
    color: 'white',
  }),
}));

const AirQualityIndicator = ({ value, type }) => {
  let status = 'good';
  let level = '优';

  if (type === 'pm2_5') {
    if (value > 75) { status = 'danger'; level = '严重污染'; }
    else if (value > 50) { status = 'warning'; level = '中度污染'; }
    else if (value > 35) { status = 'warning'; level = '轻度污染'; }
  } else if (type === 'pm10') {
    if (value > 150) { status = 'danger'; level = '严重污染'; }
    else if (value > 100) { status = 'warning'; level = '中度污染'; }
    else if (value > 75) { status = 'warning'; level = '轻度污染'; }
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1D1D1F' }}>
        {value}
      </Typography>
      <StatusChip 
        label={level}
        size="small"
        status={status}
      />
    </Box>
  );
};

function WeatherPage() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [airQualityLoading, setAirQualityLoading] = useState(false);
  const [location, setLocation] = useState({
    lng: 112.9823, 
    lat: 28.1949, 
    name: '长沙市芙蓉区',
    address: '湖南省长沙市芙蓉区',
    province: '湖南省'
  });
  const [searchInput, setSearchInput] = useState('');
  const mapRef = useRef(null);

const fetchAirQualityData = async (lat, lng) => {
  setAirQualityLoading(true);
  try {
    const response = await axios.get('http://localhost:5000/api/air-quality', {
      params: {
        latitude: lat,
        longitude: lng,
        hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone'
      }
    });
    
    if (response.data.success) {
      const hourlyData = response.data.data.hourly;
      
      setAirQualityData({
          times: hourlyData.time,
          pm10: hourlyData.pm10,
          pm2_5: hourlyData.pm2_5,
          carbon_monoxide: hourlyData.carbon_monoxide,
          nitrogen_dioxide: hourlyData.nitrogen_dioxide,
          sulphur_dioxide: hourlyData.sulphur_dioxide,
          ozone: hourlyData.ozone
    });
    }
  } catch (error) {
    console.error('获取空气质量数据失败:', error);
    setError('获取空气质量数据失败');
  } finally {
    setAirQualityLoading(false);
  }
};
 
  const cleanAMapResources = () => {
    if (window.AMap) {
      try {
        if (window.AMap.Map) {
          window.AMap.Map.prototype.destroyAll && window.AMap.Map.prototype.destroyAll();
        }
        delete window.AMap;
        delete window._AMapSdkLoaded;
      } catch (e) {
        console.warn('清理地图资源出错:', e);
      }
    }
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
    }
  };


  const getCityCode = async (address) => {
    try {
      const response = await axios.get('http://localhost:5000/api/geocode/city-code', {
        params: {
          key: '866d4afb3eeee428807b7b4127c8dcfe',
          address: address
        }
      });
      return response.data.success ? response.data.data.city_code : Promise.reject(response.data.error);
    } catch (error) {
      console.error('获取城市编码错误:', error);
      throw new Error(`获取城市编码失败: ${error.response?.data?.error || error.message}`);
    }
  };


  const getAMapWeather = async (cityCode) => {
    try {
      const response = await axios.get('http://localhost:5000/api/weather/amap', {
        params: {
          key: '866d4afb3eeee428807b7b4127c8dcfe',
          city_code: cityCode
        }
      });
      return response.data.success ? response.data.data : Promise.reject(response.data.error);
    } catch (error) {
      console.error('获取天气信息错误:', error);
      throw new Error(`获取天气失败: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSearch = async () => {
  if (!searchInput.trim()) {
    setError('请输入城市或地区名称');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const cityCode = await getCityCode(searchInput);
    const weatherRes = await getAMapWeather(cityCode);
    console.log('weatherRes:', weatherRes);

    // 新增：通过 city_code 获取经纬度
    let lng = location.lng;
    let lat = location.lat;
    let cityName = weatherRes.city_info.name || searchInput;
   

    try {
      const lnglatRes = await axios.get('http://localhost:5000/api/geocode/city-lnglat', {
        params: {
          key: '866d4afb3eeee428807b7b4127c8dcfe',
          city_code: cityCode
        }
      });
      if (lnglatRes.data.success) {
        lng = lnglatRes.data.data.longitude;
        lat = lnglatRes.data.data.latitude;
        cityName = lnglatRes.data.data.name || cityName;
      }
    } catch (e) {
      console.warn('获取经纬度失败，使用默认经纬度', e);
    }

    setLocation({
      lng,
      lat,
      name: cityName,
      address: cityName,
      province: cityName?.split('市')[0] || '未知省份'
    });

    setWeatherData(
      weatherRes.weather.casts.map(cast => ({
        date: cast.date,
        dayWeather: cast.day.weather,
        nightWeather: cast.night.weather,
        dayTemp: parseInt(cast.day.temp) || 0,
        nightTemp: parseInt(cast.night.temp) || 0,
        dayWind: `${cast.day.wind}风 ${cast.day.power}级`,
        nightWind: `${cast.night.wind}风 ${cast.night.power}级`
      }))
    );

    await fetchAirQualityData(lat, lng);

    if (mapInstance) {
      mapInstance.setCenter([lng, lat]);
      mapInstance.clearMap();
      new window.AMap.Marker({
        position: [lng, lat],
        title: cityName,
        map: mapInstance
      });
    }
  } catch (error) {
    console.error('搜索错误:', error);
    setError(error.message);
  }finally {
    setLoading(false);
  }
};
  useEffect(() => {
    let map;
    let timer;

    const initMap = async () => {
      try {
        cleanAMapResources();
        
        const AMap = await AMapLoader.load({
          key: '866d4afb3eeee428807b7b4127c8dcfe',
          version: '2.0',
          plugins: ['AMap.Marker'],
        });

        if (!mapRef.current) {
          throw new Error('地图容器未找到');
        }

        map = new AMap.Map(mapRef.current, {
          zoom: 12,
          center: [location.lng, location.lat],
          viewMode: '2D'
        });

        new AMap.Marker({
          position: [location.lng, location.lat],
          title: location.name,
          map: map
        });

        setMapInstance(map);
        setMapLoading(false);
      } catch (error) {
        console.error('地图加载失败:', error);
        setError(`地图初始化失败: ${error.message}`);
        setMapLoading(false);
      }
    };

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
    };
  }, []);


  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const cityCode = await getCityCode(location.address);
        const weatherRes = await getAMapWeather(cityCode);

        setWeatherData(
          weatherRes.weather.casts.map(cast => ({
            date: cast.date,
            dayWeather: cast.day.weather,
            nightWeather: cast.night.weather,
            dayTemp: parseInt(cast.day.temp) || 0,
            nightTemp: parseInt(cast.night.temp) || 0,
            dayWind: `${cast.day.wind}风 ${cast.day.power}级`,
            nightWind: `${cast.night.wind}风 ${cast.night.power}级`
          }))
        );
      await fetchAirQualityData(location.lat, location.lng);
      } catch (error) {
        console.error('初始化数据失败:', error);
        setError(`初始化失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f1f5f9 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2348cae4" fill-opacity="0.04"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.8,
      }
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 6, position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          mb: 4,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #0c4a6e 0%, #155e75 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          animation: `${fadeIn} 0.8s ease-out`,
        }}>
          天气与空气质量监测
        </Typography>

        {/* 搜索区域 */}
        <GlassCard sx={{ mb: 4, animation: `${slideInLeft} 0.8s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                搜索位置
              </Typography>
            }
          />
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="输入城市或地区（如：北京市朝阳区）"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  error={!!error}
                  helperText={error}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '& fieldset': {
                        border: '1px solid rgba(0, 122, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        border: '1px solid rgba(0, 122, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        border: '2px solid #007AFF',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#8E8E93',
                      fontWeight: 600,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleSearch}
                          disabled={loading}
                          sx={{
                            color: '#007AFF',
                            '&:hover': {
                              background: 'rgba(0, 122, 255, 0.1)',
                            },
                          }}
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <AppleButton
                  fullWidth
                  variant="primary"
                  onClick={handleSearch}
                  disabled={loading}
                  sx={{ height: '56px' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : '查询天气'}
                </AppleButton>
              </Grid>
            </Grid>
          </CardContent>
        </GlassCard>

        {/* 地图区域 */}
        <GlassCard sx={{ mb: 4, animation: `${fadeIn} 1s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #34C759 0%, #007AFF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                城市位置
              </Typography>
            }
            action={
              <StatusChip 
                label={location.name}
                size="small"
                status="good"
              />
            }
          />
          <CardContent>
            <Box sx={{ 
              width: '100%', 
              height: 400,
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(52, 199, 89, 0.3)',
              backgroundColor: '#fafafa'
            }}>
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
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 10,
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ color: '#34C759', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      加载地图中...
                    </Typography>
                  </Box>
                </Box>
              )}
              <div 
                ref={mapRef} 
                style={{ 
                  width: '100%',
                  height: '100%',
                  opacity: mapLoading ? 0 : 1,
                  transition: 'opacity 0.3s ease'
                }} 
              />
            </Box>
          </CardContent>
        </GlassCard>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ color: 'white', mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                正在加载天气数据...
              </Typography>
            </Box>
          </Box>
        ) : weatherData && (
          <Grid container spacing={3}>
            {/* 天气卡片区域 */}
            <Grid item xs={12}>
              <GlassCard sx={{ mb: 4, animation: `${slideInLeft} 1.2s ease-out` }}>
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      近期天气详情
                    </Typography>
                  }
                />
                <CardContent>
                  <Grid container spacing={3}>
                    {weatherData.map((day, index) => (
                      <Grid item xs={12} sm={6} md={3} key={day.date}>
                        <GlassCard sx={{ 
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 59, 48, 0.1) 100%)',
                          border: '1px solid rgba(255, 149, 0, 0.3)',
                          animation: `${fadeIn} ${1 + index * 0.1}s ease-out`,
                          '&:hover': {
                            transform: 'translateY(-4px) scale(1.02)',
                            boxShadow: '0 12px 30px rgba(255, 149, 0, 0.2)',
                          }
                        }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ 
                              fontWeight: 700, 
                              color: '#FF9500',
                              mb: 2 
                            }}>
                              {day.date}
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ color: '#1D1D1F', fontWeight: 600 }}>
                                白天: {day.dayWeather}
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#FF3B30', fontWeight: 700 }}>
                                {day.dayTemp}°C
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ color: '#1D1D1F', fontWeight: 600 }}>
                                夜间: {day.nightWeather}
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#007AFF', fontWeight: 700 }}>
                                {day.nightTemp}°C
                              </Typography>
                            </Box>
                            <StatusChip 
                              label={day.dayWind}
                              size="small"
                              status="warning"
                            />
                          </CardContent>
                        </GlassCard>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </GlassCard>
            </Grid>

  <Grid item xs={12}>
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>未来4天温度变化</Typography>
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={weatherData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            yAxisId="left"
            name="白天温度"
            unit="°C"
            tick={{ fill: '#ff4444' }}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            name="夜间温度"
            unit="°C"
            tick={{ fill: '#2196f3' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const day = payload[0].payload;
                return (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">{label}</Typography>
                    <Typography color="#ff4444">
                      白天：{day.dayWeather} {day.dayTemp}°C
                    </Typography>
                    <Typography color="#2196f3">
                      夜间：{day.nightWeather} {day.nightTemp}°C
                    </Typography>
                    <Typography variant="body2">
                      白天风：{day.dayWind}
                    </Typography>
                    <Typography variant="body2">
                      夜间风：{day.nightWind}
                    </Typography>
                  </Paper>
                );
              }
              return null;
            }}
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="dayTemp"
            stroke="#ff4444"
            name="白天温度"
            strokeWidth={3}
            dot={{ r: 5, stroke: '#ff4444', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="nightTemp"
            stroke="#2196f3"
            name="夜间温度"
            strokeWidth={3}
            dot={{ r: 5, stroke: '#2196f3', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
   </Grid>

 <TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>时间</TableCell>
        <TableCell>PM2.5</TableCell>
        <TableCell>PM10</TableCell>
        <TableCell>一氧化碳</TableCell>
        <TableCell>二氧化氮</TableCell>
        <TableCell>二氧化硫</TableCell>
        <TableCell>臭氧</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {airQualityData.times.map((time, index) => (
        <TableRow key={time}>
          <TableCell>{new Date(time).toLocaleString()}</TableCell>
          <TableCell>
            <AirQualityIndicator 
              value={Math.round(airQualityData.pm2_5[index])} 
              type="pm2_5" 
            />
          </TableCell>
          <TableCell>
            <AirQualityIndicator 
              value={Math.round(airQualityData.pm10[index])} 
              type="pm10" 
            />
          </TableCell>
          <TableCell>{airQualityData.carbon_monoxide[index].toFixed(1)} μg/m³</TableCell>
          <TableCell>{airQualityData.nitrogen_dioxide[index].toFixed(1)} μg/m³</TableCell>
          <TableCell>{airQualityData.sulphur_dioxide[index].toFixed(1)} μg/m³</TableCell>
          <TableCell>{airQualityData.ozone[index].toFixed(1)} μg/m³</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
  <Grid item xs={12} sx={{ height: 80 }} />
  </Grid>
      )}
      </Container>
    </Box>
  );
}

export default WeatherPage;