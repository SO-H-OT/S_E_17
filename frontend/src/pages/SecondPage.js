import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  ButtonGroup, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Box,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  ScatterChart, 
  Scatter, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { Download, GetApp, Image as ImageIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import { exportChart, exportAllChartsInPage } from '../utils/chartExport';

const SecondPage = () => {
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [fishData, setFishData] = useState(null);
  const [weightData, setWeightData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // 导出相关状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [showExportAlert, setShowExportAlert] = useState(false);

  // 颜色配置
  const colorPalette = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D92', 
    '#5856D6', '#32D74B', '#64D2FF', '#BF5AF2', '#FF6482', '#FFD60A', 
    '#8E8E93', '#6D6D70', '#AEAEB2', '#C7C7CC', 
    '#0051D5', '#248A3D', '#CC7A00', '#D70015', '#8944AB', '#D30F45', 
    '#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#9013FE', '#E91E63', 
    '#8BC34A', '#009688', '#795548', '#607D8B', '#9C27B0', '#3F51B5', 
    '#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39', '#8BC34A', 
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', 
    '#E1306C', '#1DA1F2', '#25D366', '#FF4500', '#6441A4' 
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#A28FD0', '#FF6B6B'];
  
  const LINE_COLORS = {
    weight: '#0088FE',
    length1: '#00C49F',
    length2: '#FFBB28',
    length3: '#FF8042'
  };

  const getColorForSpecies = (speciesName, index) => {
    if (index >= colorPalette.length) {
      const hue = (index * 137.508) % 360; 
      const saturation = 55 + (index % 4) * 8; 
      const lightness = 45 + (index % 5) * 7; 
      return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
    }
    return colorPalette[index];
  };

  // 获取鱼类品种列表
  useEffect(() => {
    const fetchSpeciesList = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/fishes/species-list');
        const data = await response.json();
        if (data.success) {
          setSpeciesList(data.data);
        } else {
          throw new Error(data.error || 'Failed to load species list');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching species list:', err);
      }
    };
    fetchSpeciesList();
  }, []);

  // 当选择品种变化时获取数据
  useEffect(() => {
    if (selectedSpecies) {
      setLoading(true);
      setFishData(null);
      setWeightData(null);
      setDataLoaded(false);
      
      // 并行获取数据以提高效率
      Promise.all([
        fetch(`http://localhost:5000/api/fishes/species-data?species=${encodeURIComponent(selectedSpecies)}`),
        fetch(`http://localhost:5000/api/fishes/weight-stats?species=${encodeURIComponent(selectedSpecies)}`)
      ])
        .then(async ([fishResponse, weightResponse]) => {
          const [fishData, weightData] = await Promise.all([
            fishResponse.json(),
            weightResponse.json()
          ]);
          
          if (fishData.success && weightData.success) {
            setFishData(fishData);
            setWeightData(weightData);
            setDataLoaded(true);
          } else {
            throw new Error(fishData.error || weightData.error || 'Failed to load data');
          }
        })
        .catch(err => {
          setError(err.message);
          console.error('Error fetching data:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedSpecies]);

  const handleChange = (event) => {
    setSelectedSpecies(event.target.value);
  };

  const handleExportFishData = async (format) => {
    setIsExporting(true);
    try {
      await apiService.exportFishData(format);
      setExportMessage(`鱼类数据已成功导出为 ${format.toUpperCase()} 格式`);
      setShowExportAlert(true);
    } catch (error) {
      setExportMessage('导出失败: ' + error.message);
      setShowExportAlert(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowExportAlert(false);
  };

  // 准备饼图数据
  const prepareChartData = useCallback(() => {
    return weightData?.chart_data || [];
  }, [weightData]);

  // 准备曲线图数据
  const prepareLineChartData = useCallback(() => {
    if (!fishData || !fishData.records || fishData.records.length === 0) {
      return [];
    }
    
    return fishData.records.map((record, index) => ({
      id: index,
      weight: record.weight !== undefined ? record.weight : 0,
      length1: record.length1 !== undefined ? record.length1 : 0,
      length2: record.length2 !== undefined ? record.length2 : 0,
      length3: record.length3 !== undefined ? record.length3 : 0
    }));
  }, [fishData]);

  const chartData = prepareChartData();
  const lineChartData = prepareLineChartData();

  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* 品种选择区域 */}
      <Box sx={{ 
        marginTop: 2, 
        marginBottom: 4,
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}>
        <FormControl sx={{ 
          width: '60%',
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }
        }}>
          <InputLabel sx={{
            fontWeight: 500,
            color: 'rgba(0, 0, 0, 0.6)'
          }}>
            选择鱼类品种
          </InputLabel>
          <Select
            value={selectedSpecies}
            label="选择鱼类品种"
            onChange={handleChange}
            sx={{
              '& .MuiSelect-select': {
                py: 1.8,
                fontSize: '0.875rem'
              }
            }}
          >
            {speciesList.map((species, index) => (
              <MenuItem key={index} value={species}>
                {species}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {selectedSpecies && (
        <Grid container spacing={3}>
          {/* 导出按钮区域 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{selectedSpecies} 数据分析</Typography>
              <Box>
                <ButtonGroup disabled={isExporting} sx={{ mr: 1 }}>
                  <Button 
                    startIcon={<Download />}
                    onClick={() => handleExportFishData('csv')}
                    size="small"
                  >
                    导出CSV
                  </Button>
                  <Button 
                    startIcon={<GetApp />}
                    onClick={() => handleExportFishData('excel')}
                    size="small"
                  >
                    导出Excel
                  </Button>
                </ButtonGroup>
                <Button 
                  startIcon={<ImageIcon />}
                  onClick={() => exportAllChartsInPage('鱼类数据')}
                  size="small"
                  variant="contained"
                  color="secondary"
                >
                  导出所有图表
                </Button>
                {isExporting && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </Box>
            </Box>
          </Grid>

          {/* 详细数据表格 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                详细数据记录 (共 {fishData?.records?.length || 0} 条)
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>序号</TableCell>
                      <TableCell>体重(g)</TableCell>
                      <TableCell>长度1(cm)</TableCell>
                      <TableCell>长度2(cm)</TableCell>
                      <TableCell>长度3(cm)</TableCell>
                      <TableCell>高度(cm)</TableCell>
                      <TableCell>宽度(cm)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fishData?.records?.map((record, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{record.weight?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{record.length1?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{record.length2?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{record.length3?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{record.height?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{record.width?.toFixed(2) || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* 饼图和统计数据 */}
          <Grid item xs={12} md={6}>
            <Paper id="fish-weight-distribution-chart" className="chart-container" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">体重分布</Typography>
                <Button
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => exportChart('fish-weight-distribution-chart', '体重分布图', 'png')}
                  variant="outlined"
                >
                  导出
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value}条`, props.payload.name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* 平均值统计 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>平均值统计</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>指标</TableCell>
                      <TableCell>数值</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fishData && (
                      <>
                        <TableRow>
                          <TableCell>平均体重</TableCell>
                          <TableCell>{fishData.averages.weight?.toFixed(2) || '-'} g</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>平均长度1</TableCell>
                          <TableCell>{fishData.averages.length1?.toFixed(2) || '-'} cm</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>平均长度2</TableCell>
                          <TableCell>{fishData.averages.length2?.toFixed(2) || '-'} cm</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>平均长度3</TableCell>
                          <TableCell>{fishData.averages.length3?.toFixed(2) || '-'} cm</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>平均高度</TableCell>
                          <TableCell>{fishData.averages.height?.toFixed(2) || '-'} cm</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>平均宽度</TableCell>
                          <TableCell>{fishData.averages.width?.toFixed(2) || '-'} cm</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>记录总数</TableCell>
                          <TableCell>{fishData.averages.record_count || 0} 条</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* 趋势分析图表 */}
          <Grid item xs={12}>
            <Paper id="fish-trend-chart" className="chart-container" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">鱼类特征趋势分析</Typography>
                <Button
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => exportChart('fish-trend-chart', '趋势分析图', 'png')}
                  variant="outlined"
                >
                  导出
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={400}>
                {dataLoaded && lineChartData.length > 0 ? (
                  <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="id"
                      label={{ value: '样本序号', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis label={{ value: '数值', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value, name) => {
                      const unit = name === 'weight' ? 'g' : 'cm';
                      return [`${value} ${unit}`, name];
                    }} />
                    <Legend />
                    
                    {fishData?.averages?.weight && (
                      <ReferenceLine 
                        y={fishData.averages.weight} 
                        stroke={LINE_COLORS.weight}
                        strokeDasharray="5 5"
                      >
                        <Label 
                          value={`平均体重: ${fishData.averages.weight.toFixed(2)}g`} 
                          position="insideTopRight"
                        />
                      </ReferenceLine>
                    )}
                    
                    <Line type="monotone" dataKey="weight" stroke={LINE_COLORS.weight} name="体重(g)" />
                    <Line type="monotone" dataKey="length1" stroke={LINE_COLORS.length1} name="长度1(cm)" />
                    <Line type="monotone" dataKey="length2" stroke={LINE_COLORS.length2} name="长度2(cm)" />
                    <Line type="monotone" dataKey="length3" stroke={LINE_COLORS.length3} name="长度3(cm)" />
                  </LineChart>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2" color="text.secondary">
                      {selectedSpecies ? "暂无足够数据绘制趋势图" : "请选择鱼类品种查看趋势分析"}
                    </Typography>
                  </Box>
                )}
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* 导出消息提示 */}
      <Snackbar
        open={showExportAlert}
        autoHideDuration={4000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={exportMessage.includes('失败') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {exportMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SecondPage;