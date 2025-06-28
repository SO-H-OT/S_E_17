import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Button, ButtonGroup, CircularProgress, Snackbar, Alert, Box } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, ScatterChart, Scatter, Cell,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, GetApp, Image as ImageIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import { exportChart, exportAllChartsInPage } from '../utils/chartExport';

function SecondPage() {
  const [fishData, setFishData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 导出相关状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [showExportAlert, setShowExportAlert] = useState(false);
  const colorPalette = [
    '#007AFF', 
    '#34C759', 
    '#FF9500', 
    '#FF3B30', 
    '#AF52DE', 
    '#FF2D92', 
    
    '#5856D6', 
    '#32D74B', 
    '#64D2FF', 
    '#BF5AF2', 
    '#FF6482', 
    '#FFD60A', 
    
    '#8E8E93', 
    '#6D6D70', 
    '#AEAEB2', 
    '#C7C7CC', 
    
    '#0051D5', 
    '#248A3D', 
    '#CC7A00', 
    '#D70015', 
    '#8944AB', 
    '#D30F45', 
    
    '#4A90E2', 
    '#7ED321', 
    '#F5A623', 
    '#D0021B', 
    '#9013FE', 
    '#E91E63', 
    
    '#8BC34A', 
    '#009688', 
    '#795548', 
    '#607D8B', 
    '#9C27B0', 
    '#3F51B5', 
    
    '#FF5722', 
    '#FF9800', 
    '#FFC107', 
    '#FFEB3B', 
    '#CDDC39', 
    '#8BC34A', 
    
    '#2196F3', 
    '#03A9F4', 
    '#00BCD4', 
    '#009688', 
    '#4CAF50', 
    '#8BC34A', 
    
    '#E1306C', 
    '#1DA1F2', 
    '#25D366', 
    '#FF4500', 
    '#6441A4' 
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

  useEffect(() => {
    apiService.getFishStatistics()
      .then(response => setFishData(response.data))
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* 鱼类数据图表 */}
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

        {/* 鱼类数量分布图 */}
        <Grid item xs={12} lg={6} xl={6}>
          <Paper id="fish-count-distribution-chart" className="chart-container" sx={{ p: 2, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">鱼类数量分布</Typography>
              <Button
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => exportChart('fish-count-distribution-chart', '鱼类数量分布图', 'png')}
                variant="outlined"
              >
                导出
              </Button>
            </Box>
            <PieChart width={500} height={350}>
              <Pie 
                data={fishData?.species_count ? Object.entries(fishData.species_count).map(([name, value]) => ({
                  name, value
                })) : []}
                dataKey="value"
                nameKey="name"
                cx={250}
                cy={175}
                outerRadius={90}
                label={(entry) => `${entry.name}: ${entry.value}`}
                labelLine={false}
              >
                {fishData?.species_count && Object.entries(fishData.species_count).map(([name, value], index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColorForSpecies(name, index)}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </Paper>
        </Grid>

        {/* 平均重量对比图 */}
        <Grid item xs={12} lg={6} xl={6}>
          <Paper id="fish-weight-chart" className="chart-container" sx={{ p: 2, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">各类鱼平均重量</Typography>
              <Button
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => exportChart('fish-weight-chart', '鱼类平均重量图', 'png')}
                variant="outlined"
              >
                导出
              </Button>
            </Box>
            <BarChart width={500} height={350} 
              data={fishData?.weight_avg ? Object.entries(fishData.weight_avg).map(([name, value], index) => ({
                name, value: Math.round(value), color: getColorForSpecies(name, index)
              })) : []}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                interval={0}
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {fishData?.weight_avg && Object.entries(fishData.weight_avg).map(([name, value], index) => (
                  <Cell key={`cell-${index}`} fill={getColorForSpecies(name, index)} />
                ))}
              </Bar>
            </BarChart>
          </Paper>
        </Grid>

        {/* 鱼类年龄分布图表*/}
        <Grid item xs={12} lg={6} xl={6}>
          <Paper id="fish-age-chart" className="chart-container" sx={{ p: 2, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">鱼类年龄分布</Typography>
              <Button
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => exportChart('fish-age-chart', '鱼类年龄分布图', 'png')}
                variant="outlined"
              >
                导出
              </Button>
            </Box>
            <BarChart width={500} height={350} 
              data={[
                {age: '0-1', count: 120},
                {age: '1-2', count: 200},
                {age: '2-3', count: 150},
                {age: '3-4', count: 80},
                {age: '4-5', count: 40},
                {age: '5+', count: 15}
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="age" 
                fontSize={12}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#4CAF50" 
                name="鱼类数量" 
              />
            </BarChart>
          </Paper>
        </Grid>

        {/* 体型比例图 */}
        <Grid item xs={12} lg={6} xl={6}>
          <Paper id="fish-proportion-chart" className="chart-container" sx={{ p: 2, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">鱼类体型比例</Typography>
              <Button
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => exportChart('fish-proportion-chart', '鱼类体型比例图', 'png')}
                variant="outlined"
              >
                导出
              </Button>
            </Box>
            <BarChart width={500} height={350}
              data={fishData?.proportion ? Object.entries(fishData.proportion).map(([name, value], index) => ({
                name, value: Math.round(value * 100) / 100, color: getColorForSpecies(name, index)
              })) : []}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                interval={0}
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {fishData?.proportion && Object.entries(fishData.proportion).map(([name, value], index) => (
                  <Cell key={`cell-${index}`} fill={getColorForSpecies(name, index)} />
                ))}
              </Bar>
            </BarChart>
          </Paper>
        </Grid>
      </Grid>
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
}

export default SecondPage;
