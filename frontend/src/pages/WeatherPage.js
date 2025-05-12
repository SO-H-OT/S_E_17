import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, CircularProgress 
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../services/api';

function WeatherPage() {
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weatherRes, airQualityRes] = await Promise.all([
          apiService.getWeatherData(),
          apiService.getAirQualityData()
        ]);
        
        if (weatherRes.success && weatherRes.data) {
          const hourlyData = weatherRes.data.hourly.time.map((time, index) => ({
            time: time.split('T')[1],
            temperature: weatherRes.data.hourly.temperature_2m[index],
            humidity: weatherRes.data.hourly.relative_humidity_2m[index]
          }));
          setWeatherData(hourlyData);
        }

        if (airQualityRes.success && airQualityRes.data) {
          const hourlyData = airQualityRes.data.hourly.time.map((time, index) => ({
            time: time.split('T')[1],
            pm10: airQualityRes.data.hourly.pm10[index],
            pm25: airQualityRes.data.hourly.pm2_5[index],
            co: airQualityRes.data.hourly.carbon_monoxide[index],
            no2: airQualityRes.data.hourly.nitrogen_dioxide[index],
            so2: airQualityRes.data.hourly.sulphur_dioxide[index],
            o3: airQualityRes.data.hourly.ozone[index]
          }));
          setAirQualityData(hourlyData);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>天气预报</Typography>
      
      <Grid container spacing={3}>
        {/* 温度图表 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>24小时温度变化</Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={weatherData?.slice(0, 24)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" name="温度" unit="°C" />
                  <YAxis yAxisId="right" orientation="right" name="湿度" unit="%" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ff4444" 
                    name="温度" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#2196f3" 
                    name="湿度" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 空气质量图表 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>24小时空气质量</Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={airQualityData?.slice(0, 24)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pm10" stroke="#ff4444" name="PM10" />
                  <Line type="monotone" dataKey="pm25" stroke="#2196f3" name="PM2.5" />
                  <Line type="monotone" dataKey="o3" stroke="#4caf50" name="臭氧" />
                  <Line type="monotone" dataKey="no2" stroke="#ff9800" name="二氧化氮" />
                  <Line type="monotone" dataKey="so2" stroke="#9c27b0" name="二氧化硫" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default WeatherPage;
