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
  Alert,
  Card,
  CardContent,
  Chip,
  Fade,
  Slide,
  alpha,
  useTheme
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
import { 
  Download, 
  GetApp, 
  Image as ImageIcon, 
  TrendingUp,
  Assessment,
  DataUsage,
  Analytics
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { exportChart, exportAllChartsInPage } from '../utils/chartExport';

const SecondPage = () => {
  const theme = useTheme();
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

  // Apple-style color palette
  const appleColors = {
    primary: '#007AFF',
    secondary: '#5856D6', 
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
    purple: '#AF52DE',
    pink: '#FF2D92',
    indigo: '#5856D6',
    teal: '#5AC8FA',
    mint: '#00C7BE',
    cyan: '#32D74B',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#1D1D1F',
    textSecondary: '#8E8E93'
  };

  const chartColors = [
    appleColors.primary,
    appleColors.success, 
    appleColors.warning,
    appleColors.purple,
    appleColors.pink,
    appleColors.info,
    appleColors.mint,
    appleColors.indigo,
    appleColors.teal,
    appleColors.cyan
  ];

  const getColorForSpecies = (speciesName, index) => {
    return chartColors[index % chartColors.length];
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

  // 导出选中品种的数据
  const handleExportSelectedSpeciesData = async (format) => {
    if (!selectedSpecies) {
      setExportMessage('请先选择鱼类品种');
      setShowExportAlert(true);
      return;
    }

    setIsExporting(true);
    try {
      await apiService.exportSpeciesData(selectedSpecies, format);
      setExportMessage(`${selectedSpecies} 数据已成功导出为 ${format.toUpperCase()} 格式`);
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

  // Apple-style glass card component
  const GlassCard = ({ children, ...props }) => (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.12)',
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Card>
  );

  // Apple-style button component
  const AppleButton = ({ children, variant = 'primary', ...props }) => {
    const variants = {
      primary: {
        background: `linear-gradient(135deg, ${appleColors.primary} 0%, ${appleColors.secondary} 100%)`,
        color: 'white',
        '&:hover': {
          background: `linear-gradient(135deg, ${alpha(appleColors.primary, 0.9)} 0%, ${alpha(appleColors.secondary, 0.9)} 100%)`,
        }
      },
      secondary: {
        background: alpha(appleColors.background, 0.6),
        color: appleColors.text,
        border: `1px solid ${alpha(appleColors.text, 0.1)}`,
        '&:hover': {
          background: alpha(appleColors.background, 0.8),
        }
      }
    };

  return (
      <Button
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 20px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          ...variants[variant],
          ...props.sx
        }}
        {...props}
      >
        {children}
      </Button>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0f7fa 50%, #f0fdfa 100%)',
        padding: '32px 24px',
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 6 }}>
      <Box sx={{ 
        display: 'flex',
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 4 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Analytics sx={{ fontSize: 40, color: appleColors.primary }} />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${appleColors.text} 0%, ${appleColors.primary} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  鱼类数据分析
                </Typography>
              </Box>
              
              {/* Export Controls */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ButtonGroup sx={{ 
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                  <AppleButton 
                    variant="secondary"
                    startIcon={<Download />}
                    onClick={() => handleExportFishData('csv')}
                    disabled={isExporting}
                    size="small"
                  >
                    导出CSV
                  </AppleButton>
                  <AppleButton 
                    variant="secondary"
                    startIcon={<GetApp />}
                    onClick={() => handleExportFishData('excel')}
                    disabled={isExporting}
                    size="small"
                  >
                    导出Excel
                  </AppleButton>
                </ButtonGroup>
                <AppleButton 
                  startIcon={<ImageIcon />}
                  onClick={() => exportAllChartsInPage('鱼类数据')}
                  size="small"
                >
                  导出图表
                </AppleButton>
                {isExporting && (
                  <CircularProgress 
                    size={24} 
                    sx={{ color: appleColors.primary }}
                  />
                )}
              </Box>
            </Box>

            {/* Species Selection */}
            <GlassCard sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <DataUsage sx={{ color: appleColors.secondary, fontSize: 32 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: appleColors.text }}>
                    选择分析对象
                  </Typography>
                  <FormControl fullWidth sx={{ maxWidth: 400 }}>
          <InputLabel sx={{
            fontWeight: 500,
                      '&.Mui-focused': { color: appleColors.primary }
          }}>
            选择鱼类品种
          </InputLabel>
          <Select
            value={selectedSpecies}
            label="选择鱼类品种"
            onChange={handleChange}
            sx={{
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(appleColors.text, 0.1),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(appleColors.primary, 0.3),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: appleColors.primary,
              }
            }}
          >
            {speciesList.map((species, index) => (
              <MenuItem 
                key={index} 
                value={species}
                sx={{ 
                            borderRadius: '8px',
                            mx: 1,
                            mb: 0.5,
                  '&:hover': {
                              backgroundColor: alpha(appleColors.primary, 0.08),
                  }
                }}
              >
                {species}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
                {selectedSpecies && (
                  <Fade in timeout={500}>
                    <Chip 
                      label={`已选择: ${selectedSpecies}`}
                      color="primary"
                      sx={{
                        background: `linear-gradient(135deg, ${appleColors.primary} 0%, ${appleColors.secondary} 100%)`,
                        color: 'white',
                        fontWeight: 500,
                        borderRadius: '16px'
                      }}
                    />
                  </Fade>
                )}
              </Box>
            </GlassCard>
          </Box>
        </Fade>

      {loading && (
          <Fade in timeout={300}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress 
                  size={48} 
                  sx={{ color: appleColors.primary, mb: 2 }}
                />
                <Typography variant="body1" color="textSecondary">
                  正在加载数据...
                </Typography>
        </Box>
            </Box>
          </Fade>
      )}

      {error && (
          <Slide direction="up" in timeout={500}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                borderRadius: '16px',
                backgroundColor: alpha(appleColors.error, 0.1),
                border: `1px solid ${alpha(appleColors.error, 0.2)}`,
                '& .MuiAlert-icon': {
                  color: appleColors.error
                }
              }}
            >
          {error}
            </Alert>
          </Slide>
        )}

        {/* Main Content */}
        {selectedSpecies && (
          <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
            <Box>
              {/* Data Overview */}
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 600, 
                    color: appleColors.text,
        display: 'flex',
        alignItems: 'center',
                    gap: 2
                  }}
                >
                  <TrendingUp sx={{ color: appleColors.success }} />
                  {fishData?.species} 数据概览
                  {fishData?.averages?.record_count && (
                    <Chip 
                      label={`${fishData.averages.record_count} 条记录`}
                      size="small"
                      sx={{
                        backgroundColor: alpha(appleColors.success, 0.1),
                        color: appleColors.success,
                        fontWeight: 500
                      }}
                    />
                  )}
        </Typography>
        
                {/* Data Table */}
                <GlassCard sx={{ mb: 4 }}>
                  <CardContent sx={{ p: 0 }}>
        <Box sx={{ 
                      p: 3,
                      borderBottom: `1px solid ${alpha(appleColors.text, 0.05)}`,
          display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.text }}>
              详细数据记录
            </Typography>
                      <ButtonGroup size="small" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                        <AppleButton
                          variant="secondary"
                          startIcon={<Download />}
                          onClick={() => handleExportSelectedSpeciesData('csv')}
                          disabled={isExporting || !selectedSpecies}
                          size="small"
                        >
                          CSV
                        </AppleButton>
                        <AppleButton
                          variant="secondary"
                          startIcon={<GetApp />}
                          onClick={() => handleExportSelectedSpeciesData('excel')}
                          disabled={isExporting || !selectedSpecies}
                          size="small"
                        >
                          Excel
                        </AppleButton>
                      </ButtonGroup>
          </Box>
          
                    <Box 
                      id="data-table"
                      className="chart-container"
                      sx={{ 
                        maxHeight: 500,
                        overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: alpha(appleColors.background, 0.3),
              borderRadius: '4px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: alpha(appleColors.primary, 0.3),
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor: alpha(appleColors.primary, 0.5)
                          }
                        }
                      }}
                    >
                      <TableContainer>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              {['序号', '体重(g)', '长度1(cm)', '长度2(cm)', '长度3(cm)', '高度(cm)', '宽度(cm)'].map((header, index) => (
                                <TableCell 
                                  key={index}
                                  sx={{
                                    fontWeight: 600,
                                    backgroundColor: alpha(appleColors.background, 0.8),
                                    backdropFilter: 'blur(10px)',
                                    borderBottom: `2px solid ${alpha(appleColors.primary, 0.1)}`,
                                    color: appleColors.text,
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {header}
                                </TableCell>
                              ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {fishData?.records?.map((record, index) => (
                              <TableRow 
                                key={index}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: alpha(appleColors.primary, 0.04),
                                  },
                                  '&:nth-of-type(odd)': {
                                    backgroundColor: alpha(appleColors.background, 0.3),
                                  }
                                }}
                              >
                                <TableCell sx={{ fontWeight: 500 }}>{index + 1}</TableCell>
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
          </Box>

          <Box sx={{
                      p: 2,
                      backgroundColor: alpha(appleColors.background, 0.3),
                      borderTop: `1px solid ${alpha(appleColors.text, 0.05)}`,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" color="textSecondary">
            共 {fishData?.records?.length || 0} 条记录
                      </Typography>
          </Box>
                  </CardContent>
                </GlassCard>
        </Box>

                             {/* Charts Section */}
               <Grid container spacing={4}>
                 {/* Weight Distribution Chart */}
                 <Grid item xs={12} lg={6}>
                   <GlassCard 
                     id="weight-distribution-chart"
                     className="chart-container"
                     sx={{ height: 'auto', minHeight: 480 }}
                   >
                     <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex',
                        justifyContent: 'space-between', 
              alignItems: 'center',
                        mb: 2 
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.text }}>
                          体重分布分析
              </Typography>
                        <AppleButton
                          variant="secondary"
                          startIcon={<ImageIcon />}
                          onClick={() => exportChart('weight-distribution-chart', '体重分布图', 'png')}
                          size="small"
                        >
                          导出
                        </AppleButton>
                      </Box>
                      
                                             <Box sx={{ height: 400, mt: 2 }}>
                         {loading ? (
            <Box sx={{ 
                             display: 'flex', 
                             justifyContent: 'center', 
                             alignItems: 'center', 
                             height: '100%' 
                           }}>
                             <CircularProgress sx={{ color: appleColors.primary }} />
                  </Box>
                ) : (
                           <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                                }}
                                formatter={(value, name) => [`${value}条`, name]} 
                              />
                    <Legend 
                                wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
              </ResponsiveContainer>
                        )}
            </Box>
                    </CardContent>
                  </GlassCard>
                </Grid>

                                 {/* Statistics Card */}
                 <Grid item xs={12} lg={6}>
                   <GlassCard sx={{ height: 'auto', minHeight: 480 }}>
                     <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex',
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 3 
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.text }}>
                          统计数据
            </Typography>
                        <ButtonGroup size="small" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                          <AppleButton
                            variant="secondary"
                            startIcon={<Download />}
                            onClick={() => handleExportSelectedSpeciesData('csv')}
                            disabled={isExporting || !selectedSpecies}
                            size="small"
                          >
                            CSV
                          </AppleButton>
                          <AppleButton
                            variant="secondary"
                            startIcon={<GetApp />}
                            onClick={() => handleExportSelectedSpeciesData('excel')}
                            disabled={isExporting || !selectedSpecies}
                            size="small"
                          >
                            Excel
                          </AppleButton>
                        </ButtonGroup>
                                             </Box>
                       
                       <Box sx={{ mt: 2 }}>
                         {fishData ? (
                           <Grid container spacing={2}>
                            {[
                              { label: '平均体重', value: fishData.averages.weight?.toFixed(2), unit: 'g', color: appleColors.primary },
                              { label: '平均长度1', value: fishData.averages.length1?.toFixed(2), unit: 'cm', color: appleColors.success },
                              { label: '平均长度2', value: fishData.averages.length2?.toFixed(2), unit: 'cm', color: appleColors.warning },
                              { label: '平均长度3', value: fishData.averages.length3?.toFixed(2), unit: 'cm', color: appleColors.purple },
                              { label: '平均高度', value: fishData.averages.height?.toFixed(2), unit: 'cm', color: appleColors.info },
                              { label: '平均宽度', value: fishData.averages.width?.toFixed(2), unit: 'cm', color: appleColors.pink },
                                                         ].map((stat, index) => (
                               <Grid item xs={6} key={index}>
                                 <Box
              sx={{ 
                                     p: 1.5,
                                     borderRadius: '12px',
                                     background: alpha(stat.color, 0.08),
                                     border: `1px solid ${alpha(stat.color, 0.15)}`,
                                     textAlign: 'center',
                                     transition: 'all 0.3s ease',
                                     '&:hover': {
                                       transform: 'translateY(-2px)',
                                       boxShadow: `0 6px 20px ${alpha(stat.color, 0.2)}`
                                     }
                                   }}
                                 >
                                   <Typography variant="caption" sx={{ color: appleColors.textSecondary, mb: 0.5, display: 'block' }}>
                                     {stat.label}
                                   </Typography>
                                   <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color }}>
                                     {stat.value || '-'}
                                     <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                       {stat.unit}
                                     </Typography>
                                   </Typography>
                                 </Box>
                               </Grid>
                             ))}
                             <Grid item xs={12}>
                               <Box
                                 sx={{
                                   p: 2,
                                   borderRadius: '12px',
                                   background: `linear-gradient(135deg, ${alpha(appleColors.primary, 0.1)} 0%, ${alpha(appleColors.secondary, 0.1)} 100%)`,
                                   border: `1px solid ${alpha(appleColors.primary, 0.2)}`,
                                   textAlign: 'center'
                                 }}
                               >
                                 <Typography variant="body2" sx={{ color: appleColors.textSecondary, mb: 1 }}>
                                   数据记录总数
                                 </Typography>
                                 <Typography variant="h5" sx={{ 
                                   fontWeight: 700,
                                   background: `linear-gradient(135deg, ${appleColors.primary} 0%, ${appleColors.secondary} 100%)`,
                                   backgroundClip: 'text',
                                   WebkitBackgroundClip: 'text',
                                   WebkitTextFillColor: 'transparent'
                                 }}>
                                   {fishData.averages.record_count || 0}
                                 </Typography>
                               </Box>
                             </Grid>
                          </Grid>
                                                 ) : (
                           <Box sx={{ 
                             display: 'flex', 
                             justifyContent: 'center', 
                             alignItems: 'center', 
                             minHeight: 200,
                             textAlign: 'center'
                           }}>
                             <Typography variant="body1" color="textSecondary">
                        选择品种后显示统计信息
                             </Typography>
                           </Box>
                  )}
          </Box>
                    </CardContent>
                  </GlassCard>
                </Grid>

                                 {/* Trend Analysis Chart */}
                 <Grid item xs={12} sx={{ mt: 2 }}>
                   <GlassCard 
                     id="trend-analysis-chart"
                     className="chart-container"
                   >
                    <CardContent>
<Box sx={{ 
  display: 'flex',
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 3 
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.text }}>
                          特征趋势分析
                          <Typography component="span" variant="body2" sx={{ ml: 1, color: appleColors.textSecondary }}>
                            体重与长度关系
    </Typography>
  </Typography>
                        <AppleButton
                          variant="secondary"
                          startIcon={<ImageIcon />}
                          onClick={() => exportChart('trend-analysis-chart', '趋势分析图', 'png')}
                          size="small"
                        >
                          导出图表
                        </AppleButton>
                      </Box>
                      
                      <Box sx={{ height: 400 }}>
    {loading ? (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            height: '100%' 
                          }}>
                            <CircularProgress sx={{ color: appleColors.primary }} />
      </Box>
    ) : dataLoaded && lineChartData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={lineChartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }} 
        >
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(appleColors.text, 0.1)} />
          <XAxis 
            dataKey="id"
            tickCount={10} 
            interval={Math.ceil(lineChartData.length / 10)} 
            label={{ 
              value: '样本序号', 
                                  position: 'insideBottom',
                                  offset: -5
            }}
                                tick={{ fill: appleColors.textSecondary }}
          />
          <YAxis 
            label={{ 
              value: '数值', 
              angle: -90, 
                                  position: 'insideLeft'
            }}
                                tick={{ fill: appleColors.textSecondary }}
          />
          <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                                }}
            formatter={(value, name) => {
              const unit = name === 'weight' ? 'g' : 'cm';
              return [`${value} ${unit}`, name];
            }}
          />
                              <Legend />
                              
          {fishData?.averages?.weight && (
            <ReferenceLine 
              y={fishData.averages.weight} 
                                  stroke={appleColors.primary}
              strokeDasharray="5 5"
                                  strokeWidth={2}
            >
              <Label 
                value={`平均体重: ${fishData.averages.weight.toFixed(2)}g`} 
                                    position="topRight"
                                    fill={appleColors.primary}
              />
            </ReferenceLine>
          )}
          
          <Line 
            type="monotone" 
            dataKey="weight" 
                                stroke={appleColors.primary} 
                                strokeWidth={3}
                                activeDot={{ r: 6, fill: appleColors.primary }}
            name="体重(g)"
                                dot={{ r: 2, fill: appleColors.primary }}
          />
          <Line 
            type="monotone" 
            dataKey="length1" 
                                stroke={appleColors.success} 
                                strokeWidth={2}
                                activeDot={{ r: 6, fill: appleColors.success }}
            name="长度1(cm)"
                                dot={{ r: 2, fill: appleColors.success }}
          />
          <Line 
            type="monotone" 
            dataKey="length2" 
                                stroke={appleColors.warning} 
                                strokeWidth={2}
                                activeDot={{ r: 6, fill: appleColors.warning }}
            name="长度2(cm)"
                                dot={{ r: 2, fill: appleColors.warning }}
          />
          <Line 
            type="monotone" 
            dataKey="length3" 
                                stroke={appleColors.purple} 
                                strokeWidth={2}
                                activeDot={{ r: 6, fill: appleColors.purple }}
            name="长度3(cm)"
                                dot={{ r: 2, fill: appleColors.purple }}
          />
        </LineChart>
      </ResponsiveContainer>
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            height: '100%',
                            textAlign: 'center'
                          }}>
                            <Typography variant="body1" color="textSecondary">
                              {selectedSpecies ? "暂无足够数据绘制趋势图" : "请选择鱼类品种查看趋势分析"}
        </Typography>
      </Box>
    )}
  </Box>
                    </CardContent>
                  </GlassCard>
                </Grid>
              </Grid>
</Box>
          </Fade>
        )}

        {/* Success/Error Messages */}
        <Snackbar
          open={showExportAlert}
          autoHideDuration={4000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity={exportMessage.includes('失败') ? 'error' : 'success'}
            sx={{ 
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              background: exportMessage.includes('失败') 
                ? alpha(appleColors.error, 0.9) 
                : alpha(appleColors.success, 0.9),
              color: 'white'
            }}
          >
            {exportMessage}
          </Alert>
        </Snackbar>
      </Container>
      </Box>
  );
};

export default SecondPage;