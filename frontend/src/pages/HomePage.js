import React, { useState, useEffect } from 'react';
import { 
  Container, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Box, Card, 
  CardContent, Grid ,Select,MenuItem,FormControl, InputLabel
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

// 模拟历史水质数据（折线图 + 表格）
const mockWaterQualityData = [
  { date: '2025-05-01', ph: 7.1, turbidity: 3.5, oxygen: 8.2 },
  { date: '2025-05-02', ph: 6.9, turbidity: 4.1, oxygen: 7.8 },
  { date: '2025-05-03', ph: 7.3, turbidity: 2.9, oxygen: 8.6 },
  { date: '2025-05-04', ph: 7.0, turbidity: 3.8, oxygen: 8.0 },
  { date: '2025-05-05', ph: 7.2, turbidity: 3.0, oxygen: 8.3 },
];

// 模拟饼图数据
const mockDistributionData = [
  { category: '良好', value: 40 },
  { category: '一般', value: 35 },
  { category: '较差', value: 15 },
  { category: '危险', value: 10 },
];

const mockCurrentStatus = {
  dissolved_oxygen: { value: 8.5, status: 'good', unit: 'mg/L' },
  ammonia_nitrogen: { value: 0.3, status: 'warning', unit: 'mg/L' },
  ph: { value: 7.2, status: 'good', unit: '' },
  total_phosphorus: { value: 0.1, status: 'good', unit: 'mg/L' },
  temperature: { value: 25.3, status: 'good', unit: '°C' }, // 温度指标
};

// 水质数据图表组件（保留原样）
const WaterQualityChart = ({ data }) => {
  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, height: 350 }}>
      <Typography variant="h6" gutterBottom>水质质量趋势</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            content={({ payload }) => {
              if (payload && payload.length) {
                const { section_name, dissolved_oxygen, ammonia_nitrogen, ph, total_phosphorus, temperature } = payload[0].payload;
                return (
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, boxShadow: 3 }}>
                    
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: '#8884d8' }}><strong>溶解氧:</strong> {dissolved_oxygen}</Typography>
                      <Typography variant="body2" sx={{ color: '#82ca9d' }}><strong>氨氮:</strong> {ammonia_nitrogen}</Typography>
                      <Typography variant="body2" sx={{ color: '#ff7300' }}><strong>pH值:</strong> {ph}</Typography>
                      <Typography variant="body2" sx={{ color: '#ffbb28' }}><strong>总磷:</strong> {total_phosphorus}</Typography>
                      <Typography variant="body2" sx={{ color: '#ff8042' }}><strong>水温:</strong> {temperature}</Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}><strong>监测点:</strong> {section_name}</Typography>
                    </Box>
                  </Box>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="dissolved_oxygen" stroke="#8884d8" name="溶解氧" />
          <Line type="monotone" dataKey="ammonia_nitrogen" stroke="#82ca9d" name="氨氮" />
          <Line type="monotone" dataKey="ph" stroke="#ff7300" name="pH值" />
          <Line type="monotone" dataKey="total_phosphorus" stroke="#ffbb28" name="总磷" />
          <Line type="monotone" dataKey="temperature" stroke="#ff8042" name="水温" />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};


// 水质分布饼图组件（保留原样）
const WaterQualityDistribution = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#A28FD0'];

  // 直接过滤掉 value 为 0 的项
  const filteredData = data.filter(entry => entry.value > 0);

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, height: 350 }}>
      <Typography variant="h6" gutterBottom>水质分布</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="category"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};


// 水质状态卡片组件（保留原样）
const WaterQualityStatusCard = ({ title, value, status, unit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'danger': return '#f44336';
      default: return '#2196f3';
    }
  };

  return (
    
    <Card sx={{ minWidth: 200, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="h4" sx={{ color: getStatusColor(status) }}>
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

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
 
  const [selectedDate, setSelectedDate] = useState('2020-05');
  const [newSelectedDate, setNewSelectedDate] = useState('2020-05');

  const [provinceBasinList, setProvinceBasinList] = useState([]);
  const [selectedProvinceBasin, setSelectedProvinceBasin] = useState('');
  const [newProvinceBasinList, setNewProvinceBasinList] = useState([]);
  const [newSelectedProvinceBasin, setNewSelectedProvinceBasin] = useState('');

  const [newFullWaterQualityData, setNewFullWaterQualityData] = useState([]);

  // 获取区域列表
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/water-quality/province-basin-sectionname-list');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          
          setLocations(data.data);
          setSelectedLocation(`${data.data[0].province}|${data.data[0].basin}|${data.data[0].section_name}`);
        }
      } catch (err) {
        console.error('获取区域列表失败', err);
      }
    };
    fetchLocations();
  }, []);

  // 根据选择区域请求水质数据
  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (!selectedLocation) return;
      const [province, basin,section_name] = selectedLocation.split('|');

      try {
        const response = await fetch(`http://localhost:5000/api/water-quality/current?province=${province}&basin=${basin}&section_name=${section_name}`);
        const result = await response.json();
        if (result.success) {
          setCurrentStatus(result.data);
        } else {
          throw new Error(result.error || '请求失败');
        }
      } catch (error) {
        setError(error.message);
      }
    };

    fetchCurrentStatus();
  }, [selectedLocation]);

  useEffect(() => {
  const fetchProvinceBasinList = async () => {
    if (!selectedDate) return;

    const [year, month] = selectedDate.split('-');

    try {
      const res = await fetch(`http://localhost:5000/api/water-quality/province-basin-list?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setProvinceBasinList(JSON.parse(JSON.stringify(data.data)));
        setSelectedProvinceBasin(`${data.data[0].province}|${data.data[0].basin}`);
      }
    } catch (err) {
      console.error('获取省流域列表失败', err);
    }
  };

  fetchProvinceBasinList();
}, [selectedDate]);


useEffect(() => {
  const fetchNewProvinceBasinList = async () => {
    if (!newSelectedDate) return;

    const [year, month] = newSelectedDate.split('-');

    try {
      const res = await fetch(`http://localhost:5000/api/water-quality/province-basin-list?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setNewProvinceBasinList(JSON.parse(JSON.stringify(data.data)));
        setNewSelectedProvinceBasin(`${data.data[0].province}|${data.data[0].basin}`);
      }
    } catch (err) {
      console.error('获取新的省流域列表失败', err);
    }
  };

  fetchNewProvinceBasinList();
}, [newSelectedDate]);



useEffect(() => {
  const fetchWaterQualityData = async () => {
    if (!selectedProvinceBasin || !selectedDate) return;

    const [province, basin] = selectedProvinceBasin.split('|');
    const [year, month] = selectedDate.split('-');

    try {
      const res = await fetch(
        `http://localhost:5000/api/water-quality/current_data?year=${year}&month=${month}&province=${province}&basin=${basin}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setWaterQualityData(data.data);
      } else {
        console.warn('请求成功但数据格式不正确');
        setWaterQualityData([]);  // 确保设置为空数组
      }
    } catch (error) {
      console.error('获取水质数据失败', error);
      setWaterQualityData([]);  // 确保设置为空数组
    }
  };

  fetchWaterQualityData();
}, [selectedProvinceBasin, selectedDate]);

useEffect(() => {
  const fetchCategoryDistribution = async () => {
    if (!selectedProvinceBasin || !selectedDate) return;

    const [province, basin] = selectedProvinceBasin.split('|');
    const [year, month] = selectedDate.split('-');

    try {
      const res = await fetch(
        `http://localhost:5000/api/water-quality/category-statistics?year=${year}&month=${month}&province=${province}&basin=${basin}`
      );
      const result = await res.json();

      if (result.success && result.data) {
        const transformed = Object.entries(result.data)
          .map(([category, count]) => ({ category, value: count }));

        setDistributionData(transformed);
        console.log(distributionData);
      } else {
        setDistributionData([]);
      }
    } catch (error) {
      console.error('获取水质等级分布失败', error);
      setDistributionData([]);
    }
  };

  fetchCategoryDistribution();
}, [selectedProvinceBasin, selectedDate]);

useEffect(() => {
  const fetchNewFullWaterQualityData = async () => {
    if (!newSelectedProvinceBasin || !newSelectedDate) return;

    const [province, basin] = newSelectedProvinceBasin.split('|');
    const [year, month] = newSelectedDate.split('-');

    try {
      const res = await fetch(
        `http://localhost:5000/api/water-quality/full_data?year=${year}&month=${month}&province=${province}&basin=${basin}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setNewFullWaterQualityData(data.data);
      } else {
        console.warn('请求成功但数据格式不正确');
        setNewFullWaterQualityData([]);  // 确保设置为空数组
      }
    } catch (error) {
      console.error('获取完整水质数据失败', error);
      setNewFullWaterQualityData([]);  // 确保设置为空数组
    }
  };

  fetchNewFullWaterQualityData();
}, [newSelectedProvinceBasin, newSelectedDate]);


  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>水质监测系统</Typography>

     <Box sx={{ marginTop: 4, marginBottom: 4 }}>
      {/* 这里是你的卡片或其他内容 */}
    </Box>
    <Typography variant="h5" gutterBottom>最近水质展示</Typography>
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel>选择区域</InputLabel>
      <Select
        value={selectedLocation}
        label="选择区域"
        onChange={(e) => setSelectedLocation(e.target.value)}
      >
        {locations.map((loc, index) => (
          <MenuItem key={index} value={`${loc.province}|${loc.basin}|${loc.section_name}`}>
            {loc.province} - {loc.basin} - {loc.section_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

      {/* 当前水质状态卡片 */}
        <Box sx={{ mb: 2 }}>
        
        <Grid container spacing={2} sx={{ mb: 4 }} justifyContent="space-between">
          {Object.entries(currentStatus).map(([key, info]) => (
            <Grid item xs={12} sm={6} md={2.4} key={key}>
              <WaterQualityStatusCard 
                title={
                  key === 'dissolved_oxygen' ? '溶解氧' :
                  key === 'ammonia_nitrogen' ? '氨氮' :
                  key === 'ph' ? 'pH值' :
                  key === 'total_phosphorus' ? '总磷' :
                  key === 'temperature' ? '温度' :
                  key
                }
                value={info.value}
                status={info.status}
                unit={info.unit}
              />
            </Grid>
          ))}
        </Grid>
      </Box>



      <Typography variant="h5" gutterBottom>水质数据可视化</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>选择时间</InputLabel>
        <Select
          value={selectedDate}
          label="选择时间"
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {[
            '2020-05', '2020-06', '2020-07', '2020-08', '2020-09', '2020-10',
            '2020-11', '2020-12', '2021-01', '2021-02', '2021-03', '2021-04','2025-05'
          ].map((date) => (
            <MenuItem key={date} value={date}>
              {date}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

            {/* 区域选择下拉框（仅省份 + 流域） */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>选择区域</InputLabel>
        <Select
          value={selectedProvinceBasin}
          label="选择区域"
          onChange={(e) => setSelectedProvinceBasin(e.target.value)}
        >
          {provinceBasinList.map((loc, index) => (
            <MenuItem key={index} value={`${loc.province}|${loc.basin}`}>
              {loc.province} - {loc.basin}
            </MenuItem>
          ))}
        </Select>
      </FormControl>


      {/* 图表展示区 */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <WaterQualityChart data={waterQualityData} />
          </Grid>
          <Grid item xs={12} md={5}>
            <WaterQualityDistribution data={distributionData} />
          </Grid>
        </Grid>
      </Box>
      
        <Box sx={{ marginTop: 10, marginBottom: 10 }}>
          {/* 这里是你的卡片或其他内容 */}
        </Box>
      <Typography variant="h5" gutterBottom>历史水质数据</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel>选择时间</InputLabel>
      <Select
        value={newSelectedDate} // 使用新的状态变量
        label="选择时间"
        onChange={(e) => setNewSelectedDate(e.target.value)} // 更新新的状态变量
      >
        {[
          '2020-05', '2020-06', '2020-07', '2020-08', '2020-09', '2020-10',
          '2020-11', '2020-12', '2021-01', '2021-02', '2021-03', '2021-04', '2025-05'
        ].map((date) => (
          <MenuItem key={date} value={date}>
            {date}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>选择区域</InputLabel>
        <Select
          value={newSelectedProvinceBasin}
          label="选择区域"
          onChange={(e) => setNewSelectedProvinceBasin(e.target.value)} 
        >
          {newProvinceBasinList.map((loc, index) => (
            <MenuItem key={index} value={`${loc.province}|${loc.basin}`}>
              {loc.province} - {loc.basin}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 历史数据表格 */}
      <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>历史水质数据</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>日期</TableCell>
              <TableCell>断面名称</TableCell>
              <TableCell>水质类别</TableCell>
              <TableCell>水温 (°C)</TableCell>
              <TableCell>pH值</TableCell>
              <TableCell>溶解氧 (mg/L)</TableCell>
              <TableCell>电导率 (μS/cm)</TableCell>
              <TableCell>浑浊度 (NTU)</TableCell>
              <TableCell>高锰酸盐指数</TableCell>
              <TableCell>氨氮 (mg/L)</TableCell>
              <TableCell>总磷 (mg/L)</TableCell>
              <TableCell>总氮 (mg/L)</TableCell>
              <TableCell>叶绿素 a (mg/m³)</TableCell>
              <TableCell>藻类密度 (cells/L)</TableCell>
              <TableCell>站点状态</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {newFullWaterQualityData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(item.monitor_time).toLocaleDateString()}</TableCell>
                <TableCell>{item.section_name}</TableCell>
                <TableCell>{item.water_quality_category}</TableCell>
                <TableCell>{item.water_temperature}</TableCell>
                <TableCell>{item.pH}</TableCell>
                <TableCell>{item.dissolved_oxygen}</TableCell>
                <TableCell>{item.conductivity}</TableCell>
                <TableCell>{item.turbidity}</TableCell>
                <TableCell>{item.permanganate_index}</TableCell>
                <TableCell>{item.ammonia_nitrogen}</TableCell>
                <TableCell>{item.total_phosphorus}</TableCell>
                <TableCell>{item.total_nitrogen}</TableCell>
                <TableCell>{item.chlorophyll_a}</TableCell>
                <TableCell>{item.algae_density}</TableCell>
                <TableCell>{item.station_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
</Box>

       <Box sx={{ marginTop: 18, marginBottom: 18 }}>
          {/* 这里是你的卡片或其他内容 */}
        </Box>

    </Container>
  );
}

export default HomePage;