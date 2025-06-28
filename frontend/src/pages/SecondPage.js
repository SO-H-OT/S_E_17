import React, { useState, useEffect, useCallback } from 'react';
import { 
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
  TableCell,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Container,
  Button,
  ButtonGroup,
  Snackbar,
  Alert
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Label,
  BarChart,
  Bar
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

  const getColorForSpecies = (speciesName, index) => {
    if (index >= colorPalette.length) {
      const hue = (index * 137.508) % 360; 
      const saturation = 55 + (index % 4) * 8; 
      const lightness = 45 + (index % 5) * 7; 
      return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
    }
    return colorPalette[index];
  };

  // 饼图颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#A28FD0', '#FF6B6B'];
  
  // 曲线图颜色配置
  const LINE_COLORS = {
    weight: '#0088FE',
    length1: '#00C49F',
    length2: '#FFBB28',
    length3: '#FF8042'
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

  // 导出功能
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

  const handleChange = (event) => {
    setSelectedSpecies(event.target.value);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* 导出功能区域 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">鱼类数据分析</Typography>
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
      </Grid>

      <Box sx={{ p: 1 }}>
        {/* 鱼类选择下拉框 */}
        <Box sx={{ 
          marginTop: 2, 
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}>
          <FormControl sx={{ 
            width: '80%',
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
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 400,
                    width: 'calc(80% - 40px)',
                    '& .MuiMenuItem-root': {
                      py: 1.5,
                      fontSize: 14,
                      minHeight: 52
                    }
                  }
                }
              }}
            >
              {speciesList.map((species, index) => (
                <MenuItem 
                  key={index} 
                  value={species}
                  sx={{ 
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }
                  }}
                >
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

        {error && (
          <Box color="error.main" textAlign="center" my={2}>
            {error}
          </Box>
        )}

        {/* 数据展示区域 */}
        <Box sx={{ 
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          minHeight: 300
        }}>
          <Typography variant="h6" gutterBottom sx={{ width: '80%', mb: 2 }}>
            {selectedSpecies ? `${fishData?.species} 数据 (共 ${fishData?.averages.record_count || 0} 条记录)` : "请选择鱼类品种"}
          </Typography>
          
          {/* 详细数据表格 */}
          <Box sx={{ 
            width: '80%',
            mb: 3,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
          }}>
            <Box sx={{
              backgroundColor: '#f5f5f5',
              padding: '8px 16px',
              borderBottom: '1px solid #e0e0e0',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                详细数据记录
              </Typography>
              <Button
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => exportChart('data-table', '详细数据记录', 'png')}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              >
                导出表格
              </Button>
            </Box>
            
            <Box 
              id="data-table"
              className="chart-container"
              sx={{ 
                flex: 1,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#bdbdbd',
                  borderRadius: '4px'
                }
              }}
            >
              <Table sx={{ tableLayout: 'fixed', minWidth: '100%' }}>
                <TableHead>
                  <TableRow sx={{
                    '& th': {
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      padding: '8px 12px',
                      backgroundColor: '#fafafa',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }
                  }}>
                    <TableCell width="60px">序号</TableCell>
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
                    <TableRow key={index} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ padding: '8px 12px' }}>{index + 1}</TableCell>
                      <TableCell sx={{ padding: '8px 12px' }}>{record.weight?.toFixed(2) || '-'}</TableCell>
                      <TableCell sx={{ padding: '8px 12px' }}>{record.length1?.toFixed(2) || '-'}</TableCell>
                      <TableCell sx={{ padding: '8px 12px' }}>{record.length2?.toFixed(2) || '-'}</TableCell>
                      <TableCell sx={{ padding: '8px 12px' }}>{record.length3?.toFixed(2) || '-'}</TableCell>
                      <TableCell sx={{ padding: '8px 12px' }}>{record.height?.toFixed(2) || '-'}</TableCell>
                      <TableCell sx={{ padding: '8px 12px' }}>{record.width?.toFixed(2) || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{
              backgroundColor: '#f5f5f5',
              padding: '8px 16px',
              borderTop: '1px solid #e0e0e0',
              fontSize: '0.75rem',
              color: '#616161'
            }}>
              共 {fishData?.records?.length || 0} 条记录
            </Box>
          </Box>

          <Grid item xs={12} sx={{ height: 60 }} />
          
          <Box sx={{ 
            width: '80%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            mb: 4,
            alignItems: 'flex-start'
          }}>
            {/* 饼图区域 - 左侧 */}
            <Box 
              id="weight-distribution-chart"
              className="chart-container"
              sx={{ 
                flex: 1,
                height: 370,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: '8px',
                boxShadow: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: { md: '50%' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 500,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  体重分布
                  <Typography 
                    component="span" 
                    variant="body2"
                    sx={{ ml: 1, color: 'text.secondary' }}
                  >
                    (共 {weightData?.total_count || 0} 条)
                  </Typography>
                </Typography>
                <Button
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => exportChart('weight-distribution-chart', '体重分布图', 'png')}
                  variant="outlined"
                >
                  导出
                </Button>
              </Box>
              
              <Box sx={{ 
                flex: 1, 
                height: 'calc(100% - 36px)',
                position: 'relative',
                top: -8
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress size={36} />
                    </Box>
                  ) : (
                    <PieChart margin={{ top: -10, right: 0, left: 0, bottom: 10 }}>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value}条`, props.payload.name]} />
                      <Legend 
                        layout="horizontal"
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ paddingTop: 0 }}
                      />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* 平均值表格 - 右侧 */}
            <Box sx={{ 
              flex: 1,
              minWidth: { md: '45%' },
              height: 400,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                fontWeight: 500,
                height: 42,
                display: 'flex',
                alignItems: 'center'
              }}>
                {selectedSpecies ? "平均值统计:" : " "}
              </Typography>
              
              <TableContainer 
                component={Paper} 
                id="average-stats-table"
                className="chart-container"
                sx={{ 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flex: 1,
                  height: 'calc(100% - 42px)'
                }}
              >
                <Table size="small" sx={{ height: '100%' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', padding: '8px' }}>指标</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', padding: '8px' }}>数值</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', padding: '8px' }}>
                        <Button
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => exportChart('average-stats-table', '平均值统计表', 'png')}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', minWidth: 'auto', padding: '2px 8px' }}
                        >
                          导出
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fishData ? (
                      <>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>平均体重</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.weight?.toFixed(2) || '-'} g</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>平均长度1</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.length1?.toFixed(2) || '-'} cm</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>平均长度2</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.length2?.toFixed(2) || '-'} cm</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>平均长度3</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.length3?.toFixed(2) || '-'} cm</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>平均高度</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.height?.toFixed(2) || '-'} cm</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>平均宽度</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.width?.toFixed(2) || '-'} cm</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 500, padding: '8px' }}>记录总数</TableCell>
                          <TableCell sx={{ padding: '8px' }}>{fishData.averages.record_count || 0} 条</TableCell>
                          <TableCell sx={{ padding: '8px' }}></TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ 
                          textAlign: 'center', 
                          color: 'text.secondary', 
                          padding: '12px',
                          height: '100%'
                        }}>
                          选择品种后显示统计信息
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          <Grid item xs={12} sx={{ height: 40 }} />
          
          {/* 趋势分析图 */}
          <Box 
            id="trend-analysis-chart"
            className="chart-container"
            sx={{ 
              width: '80%',
              mb: 4,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: '8px',
              boxShadow: 1,
              display: 'flex',
              flexDirection: 'column',
              height: 500
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                鱼类特征趋势分析
                <Typography 
                  component="span" 
                  variant="body2"
                  sx={{ ml: 1, color: 'text.secondary' }}
                >
                  (体重与长度关系)
                </Typography>
              </Typography>
              <Button
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => exportChart('trend-analysis-chart', '趋势分析图', 'png')}
                variant="outlined"
              >
                导出
              </Button>
            </Box>
            
            <Box sx={{ flex: 1, height: 350 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress size={36} />
                </Box>
              ) : dataLoaded && lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }} 
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="id"
                      tickCount={10} 
                      interval={Math.ceil(lineChartData.length / 10)} 
                      label={{ 
                        value: '样本序号', 
                        position: 'bottom',
                        offset: 30,
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <YAxis 
                      label={{ 
                        value: '数值', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10, 
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const unit = name === 'weight' ? 'g' : 'cm';
                        return [`${value} ${unit}`, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: 20,
                        paddingBottom: 10 
                      }}
                      verticalAlign="top" 
                    />
                    
                    {/* 平均线参考线 */}
                    {fishData?.averages?.weight && (
                      <ReferenceLine 
                        y={fishData.averages.weight} 
                        stroke={LINE_COLORS.weight}
                        strokeDasharray="5 5"
                      >
                        <Label 
                          value={`平均体重: ${fishData.averages.weight.toFixed(2)}g`} 
                          position="insideTopRight"
                          fill={LINE_COLORS.weight}
                          offset={10} 
                        />
                      </ReferenceLine>
                    )}
                    
                    {/* 体重曲线 */}
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke={LINE_COLORS.weight} 
                      activeDot={{ r: 6 }}
                      name="体重(g)"
                      dot={{ r: 2 }} 
                    />
                    
                    {/* 长度1曲线 */}
                    <Line 
                      type="monotone" 
                      dataKey="length1" 
                      stroke={LINE_COLORS.length1} 
                      activeDot={{ r: 6 }}
                      name="长度1(cm)"
                      dot={{ r: 2 }}
                    />
                    
                    {/* 长度2曲线 */}
                    <Line 
                      type="monotone" 
                      dataKey="length2" 
                      stroke={LINE_COLORS.length2} 
                      activeDot={{ r: 6 }}
                      name="长度2(cm)"
                      dot={{ r: 2 }}
                    />
                    
                    {/* 长度3曲线 */}
                    <Line 
                      type="monotone" 
                      dataKey="length3" 
                      stroke={LINE_COLORS.length3} 
                      activeDot={{ r: 6 }}
                      name="长度3(cm)"
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : dataLoaded && lineChartData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    暂无足够数据绘制趋势图
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    {selectedSpecies ? "数据加载中..." : "请选择鱼类品种查看趋势分析"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

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