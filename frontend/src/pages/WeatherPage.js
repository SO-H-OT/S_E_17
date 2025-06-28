import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, CircularProgress, Button,
  TextField, InputAdornment, IconButton, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import AMapLoader from '@amap/amap-jsapi-loader';

const AirQualityIndicator = ({ value, type }) => {
  let color = '#4CAF50'; // 绿色-良好
  let level = '优';

  if (type === 'pm2_5') {
    if (value > 75) { color = '#F44336'; level = '严重污染'; }
    else if (value > 50) { color = '#FF9800'; level = '中度污染'; }
  } 

  return (
    <Box display="flex" alignItems="center">
      <Box width={20} height={20} bgcolor={color} borderRadius="50%" mr={1}/>
      <Typography variant="body2">
        {value} ({level})
      </Typography>
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        天气预报 
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={9}>
            <TextField
              fullWidth
              label="输入城市或地区（如：北京市朝阳区）"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              error={!!error}
              helperText={error}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              sx={{ height: '56px' }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '查询天气'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>城市位置</Typography>
          <Box sx={{ 
            width: '100%', 
            height: 400,
            position: 'relative',
            border: '1px solid #eee',
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
                alignItems: 'center'
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : weatherData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>近期天气详情</Typography>
              <Grid container spacing={2}>
                {weatherData.map((day) => (
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
  );
}

export default WeatherPage;