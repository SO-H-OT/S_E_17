import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  Container, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Box, Button, 
  Card, CardContent, Grid
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// 水质数据图表组件
const WaterQualityChart = ({ data }) => {
  return (
    <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>水质质量趋势</Typography>
      <LineChart width={800} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="ph" stroke="#8884d8" name="pH值" />
        <Line type="monotone" dataKey="turbidity" stroke="#82ca9d" name="浑浊度" />
        <Line type="monotone" dataKey="oxygen" stroke="#ff7300" name="溶解氧" />
      </LineChart>
    </Box>
  );
};

// 水质分布饼图组件
const WaterQualityDistribution = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>水质分布</Typography>
      <PieChart width={400} height={300}>
        <Pie
          data={data}
          cx={200}
          cy={150}
          labelLine={true}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="category"
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {
            data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
          }
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </Box>
  );
};

// 水质状态卡片组件
const WaterQualityStatusCard = ({ title, value, status, unit }) => {
  // 根据状态确定颜色
  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'danger': return '#f44336';
      default: return '#2196f3';
    }
  };

  return (
    <Card sx={{ minWidth: 200, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ color: getStatusColor(status) }}>
          {value} {unit}
        </Typography>
        <Typography variant="body2" sx={{ color: getStatusColor(status) }}>
          状态: {status === 'good' ? '良好' : status === 'warning' ? '警告' : '危险'}
        </Typography>
      </CardContent>
    </Card>
  );
};

function HomePage() {
  const [waterQualityData, setWaterQualityData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [currentStatus, setCurrentStatus] = useState({});
  const [error, setError] = useState(null);

  // 模拟的水质数据
  const mockWaterQualityData = [
    { date: '1月1日', ph: 7.2, turbidity: 3.5, oxygen: 8.1 },
    { date: '1月2日', ph: 7.4, turbidity: 3.2, oxygen: 8.3 },
    { date: '1月3日', ph: 7.3, turbidity: 3.8, oxygen: 8.0 },
    { date: '1月4日', ph: 7.1, turbidity: 4.0, oxygen: 7.9 },
    { date: '1月5日', ph: 7.5, turbidity: 3.6, oxygen: 8.2 },
    { date: '1月6日', ph: 7.2, turbidity: 3.3, oxygen: 8.4 },
    { date: '1月7日', ph: 7.0, turbidity: 3.7, oxygen: 8.5 }
  ];

  const mockDistributionData = [
    { category: "优质", value: 40 },
    { category: "良好", value: 30 },
    { category: "一般", value: 15 },
    { category: "较差", value: 10 },
    { category: "差", value: 5 }
  ];

  const mockCurrentStatus = {
    ph: { value: 7.3, status: 'good', unit: 'pH' },
    turbidity: { value: 3.6, status: 'warning', unit: 'NTU' },
    oxygen: { value: 8.2, status: 'good', unit: 'mg/L' },
    temperature: { value: 22.5, status: 'good', unit: '°C' }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 这里应该使用实际API调用，现在使用模拟数据
        // const waterQualityResponse = await apiService.getWaterQualityData();
        // const distributionResponse = await apiService.getWaterDistributionData();
        // const currentStatusResponse = await apiService.getCurrentWaterStatus();
        
        setWaterQualityData(mockWaterQualityData);
        setDistributionData(mockDistributionData);
        setCurrentStatus(mockCurrentStatus);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>水质监测系统</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <WaterQualityStatusCard 
            title="pH值" 
            value={currentStatus.ph?.value} 
            status={currentStatus.ph?.status} 
            unit={currentStatus.ph?.unit} 
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WaterQualityStatusCard 
            title="浑浊度" 
            value={currentStatus.turbidity?.value} 
            status={currentStatus.turbidity?.status} 
            unit={currentStatus.turbidity?.unit} 
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WaterQualityStatusCard 
            title="溶解氧" 
            value={currentStatus.oxygen?.value} 
            status={currentStatus.oxygen?.status} 
            unit={currentStatus.oxygen?.unit} 
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <WaterQualityStatusCard 
            title="水温" 
            value={currentStatus.temperature?.value} 
            status={currentStatus.temperature?.status} 
            unit={currentStatus.temperature?.unit} 
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <WaterQualityChart data={waterQualityData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <WaterQualityDistribution data={distributionData} />
        </Grid>
      </Grid>

      {/* 水质数据表格 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>历史水质数据</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>pH值</TableCell>
                <TableCell>浑浊度 (NTU)</TableCell>
                <TableCell>溶解氧 (mg/L)</TableCell>
                <TableCell>水温 (°C)</TableCell>
                <TableCell>评估</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {waterQualityData.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.ph}</TableCell>
                  <TableCell>{record.turbidity}</TableCell>
                  <TableCell>{record.oxygen}</TableCell>
                  <TableCell>{mockWaterQualityData[index % mockWaterQualityData.length].ph + 15}</TableCell>
                  <TableCell>{record.ph > 7.0 && record.oxygen > 8.0 ? '良好' : '一般'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default HomePage;