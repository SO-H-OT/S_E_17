import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Button, TextField, MenuItem,
  Tabs, Tab, Box, Alert, CircularProgress, Divider, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardHeader, Chip
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  CloudUpload, Add, Delete, Preview, Save, FileUpload
} from '@mui/icons-material';
import { apiService } from '../services/api';

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

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
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
  padding: '10px 20px',
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
  ...(variant === 'warning' && {
    background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #FF6D00 0%, #E65100 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(255, 149, 0, 0.3)',
    },
  }),
  ...(variant === 'secondary' && {
    background: 'linear-gradient(135deg, #8E8E93 0%, #6D6D70 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #6D6D70 0%, #48484A 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(142, 142, 147, 0.3)',
    },
  }),
  ...(variant === 'outlined' && {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    color: '#007AFF',
    '&:hover': {
      background: 'rgba(0, 122, 255, 0.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 122, 255, 0.15)',
    },
  }),
}));

const StatusChip = styled(Chip)(({ status }) => ({
  borderRadius: '20px',
  fontWeight: 600,
  ...(status === 'success' && {
    background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
    color: 'white',
  }),
  ...(status === 'warning' && {
    background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
    color: 'white',
  }),
  ...(status === 'info' && {
    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
    color: 'white',
  }),
  ...(status === 'default' && {
    background: 'linear-gradient(135deg, #8E8E93 0%, #6D6D70 100%)',
    color: 'white',
  }),
  ...(status === 'secondary' && {
    background: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)',
    color: 'white',
  }),
}));

const AppleTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
    height: 3,
    borderRadius: '2px',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    color: '#8E8E93',
    borderRadius: '12px 12px 0 0',
    margin: '0 4px',
    transition: 'all 0.3s ease',
    '&.Mui-selected': {
      background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(88, 86, 214, 0.1) 100%)',
      color: '#007AFF',
    },
    '&:hover': {
      background: 'rgba(0, 122, 255, 0.05)',
    },
  },
}));

const DATA_TYPES = {
  WATER_QUALITY: 'water_quality',
  FISH_DATA: 'fish_data'
};

const WATER_QUALITY_FIELDS = [
  { key: 'province', label: '省份', type: 'text', required: true },
  { key: 'basin', label: '流域', type: 'text', required: true },
  { key: 'section_name', label: '断面名称', type: 'text', required: true },
  { key: 'monitor_time', label: '监测时间', type: 'datetime-local', required: false },
  { key: 'water_quality_category', label: '水质类别', type: 'select', required: false, 
    options: ['I', 'II', 'III', 'IV', 'V', '劣V'] },
  { key: 'water_temperature', label: '水温(°C)', type: 'number', required: false },
  { key: 'pH', label: 'pH值', type: 'number', required: false },
  { key: 'dissolved_oxygen', label: '溶解氧(mg/L)', type: 'number', required: false },
  { key: 'conductivity', label: '电导率(μS/cm)', type: 'number', required: false },
  { key: 'turbidity', label: '浊度(NTU)', type: 'number', required: false },
  { key: 'permanganate_index', label: '高锰酸盐指数(mg/L)', type: 'number', required: false },
  { key: 'ammonia_nitrogen', label: '氨氮(mg/L)', type: 'number', required: false },
  { key: 'total_phosphorus', label: '总磷(mg/L)', type: 'number', required: false },
  { key: 'total_nitrogen', label: '总氮(mg/L)', type: 'number', required: false },
  { key: 'chlorophyll_a', label: '叶绿素α(μg/L)', type: 'number', required: false },
  { key: 'algae_density', label: '藻密度(万个/L)', type: 'number', required: false },
  { key: 'station_status', label: '站点情况', type: 'text', required: false }
];

const FISH_DATA_FIELDS = [
  { key: 'species', label: '鱼类种类', type: 'text', required: true },
  { key: 'weight', label: '重量(g)', type: 'number', required: true },
  { key: 'length1', label: '身长(cm)', type: 'number', required: true },
  { key: 'length2', label: '标准长度(cm)', type: 'number', required: false },
  { key: 'length3', label: '全长(cm)', type: 'number', required: false },
  { key: 'height', label: '高度(cm)', type: 'number', required: true },
  { key: 'width', label: '宽度(cm)', type: 'number', required: false }
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function DataUploadPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [dataType, setDataType] = useState(DATA_TYPES.WATER_QUALITY);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // 手动输入数据相关状态
  const [manualData, setManualData] = useState({});
  const [manualDataList, setManualDataList] = useState([]);

  // CSV上传相关状态
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });

  // 数据查看相关状态
  const [recentData, setRecentData] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 获取当前数据类型的字段定义
  const getCurrentFields = () => {
    return dataType === DATA_TYPES.WATER_QUALITY ? WATER_QUALITY_FIELDS : FISH_DATA_FIELDS;
  };

  // 处理通知
  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // 手动输入数据处理
  const handleManualDataChange = (field, value) => {
    setManualData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddManualData = () => {
    const fields = getCurrentFields();
    const requiredFields = fields.filter(field => field.required);
    
    // 验证必填字段
    const missingFields = requiredFields.filter(field => !manualData[field.key]);
    if (missingFields.length > 0) {
      showNotification(`请填写必填字段：${missingFields.map(f => f.label).join(', ')}`, 'error');
      return;
    }

    setManualDataList(prev => [...prev, { ...manualData, id: Date.now() }]);
    setManualData({});
    showNotification('数据已添加到列表', 'success');
  };

  const handleRemoveManualData = (id) => {
    setManualDataList(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmitManualData = async () => {
    if (manualDataList.length === 0) {
      showNotification('请先添加数据', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.uploadData(dataType, manualDataList);
      if (response.success) {
        showNotification(
          `✅ 成功上传 ${manualDataList.length} 条${dataType === DATA_TYPES.WATER_QUALITY ? '水质' : '鱼类'}数据！点击"最近上传的数据"标签查看。`, 
          'success'
        );
        
        // 触发异常检测事件（通知首页）
        if (dataType === DATA_TYPES.WATER_QUALITY) {
          localStorage.setItem('dataUploadSuccess', JSON.stringify({
            timestamp: Date.now(),
            dataType: 'water_quality',
            count: manualDataList.length
          }));
        }
        
        setManualDataList([]);
        // 如果用户在查看数据页面，自动刷新
        if (activeTab === 2) {
          setTimeout(() => fetchRecentData(), 1000);
        }
      } else {
        showNotification('上传失败：' + response.error, 'error');
      }
    } catch (error) {
      showNotification('上传失败：' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // CSV文件处理
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).filter(row => row.length === headers.length && row.some(cell => cell.trim()));
        
        const parsedData = data.map((row, index) => {
          const obj = { id: index };
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i] ? row[i].trim() : '';
          });
          return obj;
        });

        setCsvData(parsedData);
        showNotification(`CSV文件解析完成，共 ${parsedData.length} 条数据`, 'success');
      };
      reader.readAsText(file);
    } else {
      showNotification('请选择有效的CSV文件', 'error');
    }
  };

  const handleSubmitCsvData = async () => {
    if (csvData.length === 0) {
      showNotification('请先上传CSV文件', 'warning');
      return;
    }

    setLoading(true);
    setUploadProgress({ uploaded: 0, total: csvData.length });

    try {
      const response = await apiService.uploadCsvData(dataType, csvData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (response.success) {
        showNotification(
          `✅ 批量上传成功！共上传 ${csvData.length} 条${dataType === DATA_TYPES.WATER_QUALITY ? '水质' : '鱼类'}数据。点击"最近上传的数据"标签查看。`, 
          'success'
        );
        
        // 触发异常检测事件（通知首页）
        if (dataType === DATA_TYPES.WATER_QUALITY) {
          localStorage.setItem('dataUploadSuccess', JSON.stringify({
            timestamp: Date.now(),
            dataType: 'water_quality',
            count: csvData.length
          }));
        }
        
        setCsvFile(null);
        setCsvData([]);
        setUploadProgress({ uploaded: 0, total: 0 });
        // 如果用户在查看数据页面，自动刷新
        if (activeTab === 2) {
          setTimeout(() => fetchRecentData(), 1000);
        }
      } else {
        showNotification('上传失败：' + response.error, 'error');
      }
    } catch (error) {
      showNotification('上传失败：' + error.message, 'error');
    } finally {
      setLoading(false);
      setUploadProgress({ uploaded: 0, total: 0 });
    }
  };

  // 获取最近上传的数据
  const fetchRecentData = async () => {
    setLoadingRecent(true);
    try {
      const response = await apiService.getRecentUploadedData(dataType);
      
      if (response.success) {
        setRecentData(response.data);
      } else {
        showNotification('获取最近数据失败：' + response.error, 'error');
      }
    } catch (error) {
      showNotification('获取最近数据失败：' + error.message, 'error');
    } finally {
      setLoadingRecent(false);
    }
  };

  // 当数据类型改变时重新获取数据
  useEffect(() => {
    if (activeTab === 2) {
      fetchRecentData();
    }
  }, [dataType, activeTab]);

  const renderFormField = (field) => {
    const commonStyles = {
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '& fieldset': {
          border: '1px solid rgba(0, 122, 255, 0.3)',
        },
        '&:hover fieldset': {
          border: '1px solid rgba(0, 122, 255, 0.5)',
        },
        '&.Mui-focused fieldset': {
          border: '2px solid #007AFF',
          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
        },
      },
      '& .MuiInputLabel-root': {
        color: '#8E8E93',
        fontWeight: 600,
        '&.Mui-focused': {
          color: '#007AFF',
        },
      },
      '& .MuiInputBase-input': {
        color: '#1D1D1F',
        fontWeight: 500,
      },
      mb: 2,
    };

    if (field.type === 'select') {
      return (
        <TextField
          key={field.key}
          select
          label={field.label + (field.required ? ' *' : '')}
          value={manualData[field.key] || ''}
          onChange={(e) => handleManualDataChange(field.key, e.target.value)}
          required={field.required}
          fullWidth
          sx={commonStyles}
        >
          {field.options?.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        key={field.key}
        label={field.label + (field.required ? ' *' : '')}
        type={field.type}
        value={manualData[field.key] || ''}
        onChange={(e) => handleManualDataChange(field.key, e.target.value)}
        required={field.required}
        fullWidth
        sx={commonStyles}
        InputLabelProps={field.type === 'datetime-local' ? { shrink: true } : {}}
      />
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e6fffa 50%, #eff6ff 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%232dd4bf" fill-opacity="0.04"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.8,
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          mb: 4,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #166534 0%, #0f766e 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          animation: `${fadeIn} 0.8s ease-out`,
        }}>
          数据上传管理中心
        </Typography>

        {/* 使用说明 */}
        <GlassCard sx={{ mb: 4, animation: `${slideInLeft} 0.6s ease-out` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <StatusChip 
                label="📋 使用指南"
                size="small"
                status="info"
              />
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                数据上传和验证指南
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#1D1D1F', fontWeight: 500 }}>
              <strong>支持格式：</strong>手动输入单条数据、CSV文件批量上传 | 
              <strong>验证方式：</strong>上传后可在"最近上传的数据"标签页查看验证结果
            </Typography>
          </CardContent>
        </GlassCard>

        {/* 数据类型选择 */}
        <GlassCard sx={{ mb: 4, animation: `${slideInLeft} 0.8s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #34C759 0%, #007AFF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                选择数据类型
              </Typography>
            }
            action={
              <StatusChip 
                label={dataType === DATA_TYPES.WATER_QUALITY ? '🌊 水质数据' : '🐠 鱼类数据'}
                size="small"
                status="info"
              />
            }
          />
          <CardContent>
            <TextField
              select
              label="数据类型"
              value={dataType}
              onChange={(e) => {
                setDataType(e.target.value);
                setManualData({});
                setManualDataList([]);
                setCsvData([]);
              }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '& fieldset': {
                    border: '1px solid rgba(52, 199, 89, 0.3)',
                  },
                  '&:hover fieldset': {
                    border: '1px solid rgba(52, 199, 89, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    border: '2px solid #34C759',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#8E8E93',
                  fontWeight: 600,
                },
              }}
            >
              <MenuItem value={DATA_TYPES.WATER_QUALITY}>🌊 水质监测数据</MenuItem>
              <MenuItem value={DATA_TYPES.FISH_DATA}>🐠 鱼类生长数据</MenuItem>
            </TextField>
          </CardContent>
        </GlassCard>

      {/* 选项卡 */}
      <Paper sx={{ mb: 3 }}>
        <AppleTabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="手动输入数据" icon={<Add />} />
          <Tab label="CSV文件上传" icon={<CloudUpload />} />
          <Tab label="最近上传的数据" icon={<FileUpload />} />
        </AppleTabs>

        {/* 手动输入数据面板 */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ animation: `${slideInLeft} 1s ease-out` }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        输入{dataType === DATA_TYPES.WATER_QUALITY ? '水质监测' : '鱼类'}数据
                      </Typography>
                    }
                    action={
                      <StatusChip 
                        label="手动录入"
                        size="small"
                        status="warning"
                      />
                    }
                  />
                  <CardContent>
                    <Box component="form">
                      {getCurrentFields().map(field => renderFormField(field))}
                      
                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <AppleButton
                          variant="success"
                          startIcon={<Add />}
                          onClick={handleAddManualData}
                          disabled={loading}
                          sx={{ minWidth: 180 }}
                        >
                          {loading ? <CircularProgress size={20} color="inherit" /> : '添加到列表'}
                        </AppleButton>
                      </Box>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <GlassCard sx={{ animation: `${slideInRight} 1s ease-out` }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        数据列表
                      </Typography>
                    }
                    action={
                      <StatusChip 
                        label={`${manualDataList.length} 条`}
                        size="small"
                        status={manualDataList.length > 0 ? "success" : "default"}
                      />
                    }
                  />
                  <CardContent>
                    {manualDataList.length === 0 ? (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        px: 2,
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#8E8E93',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }}>
                          暂无数据，请先添加数据
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <TableContainer 
                          component={Paper} 
                          sx={{ 
                            maxHeight: 400, 
                            mb: 2,
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            overflow: 'hidden',
                          }}
                        >
                          <Table stickyHeader size="small">
                            <TableHead>
                              <TableRow>
                                {getCurrentFields().slice(0, 3).map(field => (
                                  <TableCell 
                                    key={field.key}
                                    sx={{ 
                                      background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    {field.label}
                                  </TableCell>
                                ))}
                                <TableCell sx={{ 
                                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                }}>
                                  操作
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {manualDataList.map((item, index) => (
                                <TableRow 
                                  key={item.id}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: 'rgba(0, 122, 255, 0.1)',
                                    },
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {getCurrentFields().slice(0, 3).map(field => (
                                    <TableCell 
                                      key={field.key}
                                      sx={{ 
                                        color: '#1D1D1F',
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {item[field.key] || '-'}
                                    </TableCell>
                                  ))}
                                  <TableCell>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveManualData(item.id)}
                                      sx={{
                                        color: '#FF3B30',
                                        '&:hover': {
                                          backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                          transform: 'scale(1.1)',
                                        },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <AppleButton
                            variant="secondary"
                            onClick={() => {
                              setManualDataList([]);
                              showNotification('数据列表已清空', 'info');
                            }}
                            startIcon={<Delete />}
                            size="small"
                          >
                            清空列表
                          </AppleButton>
                          <AppleButton
                            variant="primary"
                            startIcon={<Save />}
                            onClick={handleSubmitManualData}
                            disabled={loading}
                            sx={{ minWidth: 120 }}
                          >
                            {loading ? <CircularProgress size={20} color="inherit" /> : '提交数据'}
                          </AppleButton>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </GlassCard>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* CSV文件上传面板 */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                上传CSV文件
              </Typography>
              
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-file-input"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="csv-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FileUpload />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  选择CSV文件
                </Button>
              </label>

              {csvFile && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  已选择文件: {csvFile.name}
                </Alert>
              )}

              {csvData.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    数据概览 ({csvData.length} 条记录)
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Preview />}
                    onClick={() => setShowPreviewDialog(true)}
                    sx={{ mb: 2, mr: 1 }}
                  >
                    预览数据
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudUpload />}
                    disabled={loading}
                    onClick={handleSubmitCsvData}
                  >
                    {loading ? <CircularProgress size={20} /> : '开始上传'}
                  </Button>

                  {uploadProgress.total > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        上传进度: {uploadProgress.uploaded} / {uploadProgress.total}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                CSV格式说明
              </Typography>
              
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  {dataType === DATA_TYPES.WATER_QUALITY ? '水质数据' : '鱼类数据'}CSV文件格式要求：
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>必填字段：</strong>
                  <ul>
                    {getCurrentFields()
                      .filter(field => field.required)
                      .map(field => (
                        <li key={field.key}>{field.label}</li>
                      ))}
                  </ul>
                  <strong>可选字段：</strong>
                  <ul>
                    {getCurrentFields()
                      .filter(field => !field.required)
                      .slice(0, 5)
                      .map(field => (
                        <li key={field.key}>{field.label}</li>
                      ))}
                  </ul>
                  {getCurrentFields().filter(field => !field.required).length > 5 && (
                    <li>等等...</li>
                  )}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 最近上传的数据面板 */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  最近上传的{dataType === DATA_TYPES.WATER_QUALITY ? '水质' : '鱼类'}数据
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={fetchRecentData}
                    disabled={loadingRecent}
                    startIcon={loadingRecent ? <CircularProgress size={20} /> : <Preview />}
                  >
                    刷新数据
                  </Button>
                </Box>
              </Box>

              {loadingRecent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {recentData.length > 0 ? (
                    <>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        找到 {recentData.length} 条最近上传的数据记录
                      </Alert>
                      
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {getCurrentFields().slice(0, 6).map(field => (
                                <TableCell key={field.key}>{field.label}</TableCell>
                              ))}
                              <TableCell>上传时间</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentData.map((row, index) => (
                              <TableRow key={index}>
                                {getCurrentFields().slice(0, 6).map(field => (
                                  <TableCell key={field.key}>
                                    {row[field.key] || '-'}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  {row.upload_time ? new Date(row.upload_time).toLocaleString() : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {recentData.length >= 20 && (
                        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                          只显示最近20条记录
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Alert severity="info">
                      暂无最近上传的{dataType === DATA_TYPES.WATER_QUALITY ? '水质' : '鱼类'}数据
                    </Alert>
                  )}
                </>
              )}
            </Grid>

            {/* 数据统计信息 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                数据库统计信息
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (dataType === DATA_TYPES.WATER_QUALITY) {
                      window.open('/', '_blank');
                    } else {
                      window.open('/second', '_blank');
                    }
                  }}
                >
                  查看{dataType === DATA_TYPES.WATER_QUALITY ? '水质' : '鱼类'}数据页面
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (dataType === DATA_TYPES.WATER_QUALITY) {
                      apiService.exportWaterQuality('csv');
                    } else {
                      apiService.exportFishData('csv');
                    }
                  }}
                >
                  导出当前数据
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* 数据预览对话框 */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>数据预览</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {csvData.length > 0 && Object.keys(csvData[0])
                    .filter(key => key !== 'id')
                    .slice(0, 6)
                    .map(key => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {Object.keys(row)
                      .filter(key => key !== 'id')
                      .slice(0, 6)
                      .map(key => (
                        <TableCell key={key}>{row[key]}</TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
}

export default DataUploadPage; 