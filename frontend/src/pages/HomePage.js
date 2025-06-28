import React, { useState, useEffect, useCallback } from 'react';
import { 
   Container, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Box, Card, 
  CardContent, Grid, Select, MenuItem, FormControl, InputLabel,
  Button, ButtonGroup, CircularProgress, Alert, Snackbar,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Fab, CardHeader
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { Download, GetApp, Image as ImageIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import { exportChart, exportAllChartsInPage } from '../utils/chartExport';

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
  padding: '8px 20px',
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
  animation: `${pulse} 2s infinite`,
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

const WaterQualityChart = ({ data }) => {
  const handleExportChart = () => {
    exportChart('water-quality-trend-chart', '水质质量趋势图', 'png');
  };

  return (
    <GlassCard id="water-quality-trend-chart" className="chart-container" sx={{ p: 3, height: 400 }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            水质质量趋势
          </Typography>
        }
        action={
          <AppleButton
            size="small"
            startIcon={<ImageIcon />}
            onClick={handleExportChart}
            variant="outlined"
          >
            导出图表
          </AppleButton>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0, height: 'calc(100% - 80px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 122, 255, 0.1)" />
            <XAxis dataKey="date" stroke="#8E8E93" />
            <YAxis stroke="#8E8E93" />
            <Tooltip
              content={({ payload }) => {
                if (payload && payload.length) {
                  const { section_name, dissolved_oxygen, ammonia_nitrogen, ph, total_phosphorus, temperature } = payload[0].payload;
                  return (
                    <GlassCard sx={{ p: 2, minWidth: 200 }}>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#007AFF', fontWeight: 600 }}><strong>溶解氧:</strong> {dissolved_oxygen}</Typography>
                        <Typography variant="body2" sx={{ color: '#34C759', fontWeight: 600 }}><strong>氨氮:</strong> {ammonia_nitrogen}</Typography>
                        <Typography variant="body2" sx={{ color: '#FF9500', fontWeight: 600 }}><strong>pH值:</strong> {ph}</Typography>
                        <Typography variant="body2" sx={{ color: '#FF6B6B', fontWeight: 600 }}><strong>总磷:</strong> {total_phosphorus}</Typography>
                        <Typography variant="body2" sx={{ color: '#5856D6', fontWeight: 600 }}><strong>水温:</strong> {temperature}</Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#8E8E93' }}><strong>监测点:</strong> {section_name}</Typography>
                      </Box>
                    </GlassCard>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="dissolved_oxygen" stroke="#007AFF" strokeWidth={3} name="溶解氧" />
            <Line type="monotone" dataKey="ammonia_nitrogen" stroke="#34C759" strokeWidth={3} name="氨氮" />
            <Line type="monotone" dataKey="ph" stroke="#FF9500" strokeWidth={3} name="pH值" />
            <Line type="monotone" dataKey="total_phosphorus" stroke="#FF6B6B" strokeWidth={3} name="总磷" />
            <Line type="monotone" dataKey="temperature" stroke="#5856D6" strokeWidth={3} name="水温" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </GlassCard>
  );
};

const WaterQualityDistribution = ({ data }) => {
  const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];

  // 直接过滤掉 value 为 0 的项
  const filteredData = data.filter(entry => entry.value > 0);

  const handleExportChart = () => {
    exportChart('water-quality-distribution-chart', '水质分布图', 'png');
  };

  return (
    <GlassCard id="water-quality-distribution-chart" className="chart-container" sx={{ p: 3, height: 400 }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #34C759 0%, #007AFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            水质分布
          </Typography>
        }
        action={
          <AppleButton
            size="small"
            startIcon={<ImageIcon />}
            onClick={handleExportChart}
            variant="outlined"
          >
            导出图表
          </AppleButton>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0, height: 'calc(100% - 80px)' }}>
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
      </CardContent>
    </GlassCard>
  );
};

const WaterQualityStatusCard = ({ title, value, status, unit }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'good': 
        return { 
          color: '#34C759', 
          background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
          label: '良好',
          icon: '✓'
        };
      case 'warning': 
        return { 
          color: '#FF9500', 
          background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
          label: '警告',
          icon: '⚠'
        };
      case 'danger': 
        return { 
          color: '#FF3B30', 
          background: 'linear-gradient(135deg, #FF3B30 0%, #D70015 100%)',
          label: '危险',
          icon: '✗'
        };
      default: 
        return { 
          color: '#007AFF', 
          background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
          label: '正常',
          icon: 'ℹ'
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <GlassCard sx={{ 
      minWidth: 200, 
      height: 140,
      position: 'relative',
      overflow: 'hidden',
      animation: `${slideInLeft} 0.6s ease-out`,
    }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 60,
          height: 60,
          background: statusInfo.background,
          borderRadius: '0 0 0 60px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          pl: 2,
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
          {statusInfo.icon}
        </Typography>
      </Box>
      <CardContent sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ 
          color: statusInfo.color, 
          fontWeight: 700,
          mb: 1,
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {value} {unit}
        </Typography>
        <StatusChip 
          label={statusInfo.label}
          size="small"
          status={status}
        />
      </CardContent>
    </GlassCard>
  );
};

function HomePage() {
  const [waterQualityData, setWaterQualityData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(mockCurrentStatus);
  const [error, setError] = useState(null);

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
 
  const [selectedDate, setSelectedDate] = useState('2020-05');
  const [newSelectedDate, setNewSelectedDate] = useState('2020-05');
  
  // 新增：可用时间段状态
  const [availablePeriods, setAvailablePeriods] = useState([]);

  const [provinceBasinList, setProvinceBasinList] = useState([]);
  const [selectedProvinceBasin, setSelectedProvinceBasin] = useState('');
  const [newProvinceBasinList, setNewProvinceBasinList] = useState([]);
  const [newSelectedProvinceBasin, setNewSelectedProvinceBasin] = useState('');

  const [newFullWaterQualityData, setNewFullWaterQualityData] = useState([]);

  // 导出相关状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [showExportAlert, setShowExportAlert] = useState(false);

  // 警报和异常检测相关状态
  const [alertMessages, setAlertMessages] = useState([]);
  const [abnormalRows, setAbnormalRows] = useState(new Set());
  const [showAbnormalOnly, setShowAbnormalOnly] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // 水质标准设置相关状态
  const [standardsDialogOpen, setStandardsDialogOpen] = useState(false);
  const [editableStandards, setEditableStandards] = useState({});
  const [userRole, setUserRole] = useState(null);

  // 默认水质标准（用于重置）
  const DEFAULT_STANDARDS = {
    water_temperature: { min: 0, max: 35, unit: "°C" },
    pH: { min: 6.0, max: 9.0, unit: "" },
    dissolved_oxygen: { min: 5.0, max: 15.0, unit: "mg/L" },
    conductivity: { min: 50, max: 2000, unit: "μS/cm" },
    turbidity: { min: 0, max: 10, unit: "NTU" },
    permanganate_index: { min: 0, max: 6, unit: "mg/L" },
    ammonia_nitrogen: { min: 0, max: 1.0, unit: "mg/L" },
    total_phosphorus: { min: 0, max: 0.2, unit: "mg/L" },
    total_nitrogen: { min: 0, max: 2.0, unit: "mg/L" },
    chlorophyll_a: { min: 0, max: 30, unit: "mg/m³" },
    algae_density: { min: 0, max: 1000000, unit: "cells/L" },
  };

  // 水质标准定义（现在可以动态修改）
  const [WATER_QUALITY_STANDARDS, setWATER_QUALITY_STANDARDS] = useState(DEFAULT_STANDARDS);

  // 检查数值异常
  const checkValueStatus = useCallback((key, value) => {
    if (
      !WATER_QUALITY_STANDARDS[key] ||
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "normal";
    }

    const { min, max } = WATER_QUALITY_STANDARDS[key];
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return "normal";

    // 严重超标（超出范围20%以上）
    if (numValue < min * 0.8 || numValue > max * 1.2) {
      return "danger";
    }
    // 轻微超标
    if (numValue < min || numValue > max) {
      return "warning";
    }

    return "normal";
  }, [WATER_QUALITY_STANDARDS]);

  // 获取字段中文名称
  const getFieldName = useCallback((key) => {
    const fieldNames = {
      water_temperature: '水温',
      pH: 'pH值',
      dissolved_oxygen: '溶解氧',
      conductivity: '电导率',
      turbidity: '浑浊度',
      permanganate_index: '高锰酸盐指数',
      ammonia_nitrogen: '氨氮',
      total_phosphorus: '总磷',
      total_nitrogen: '总氮',
      chlorophyll_a: '叶绿素a',
      algae_density: '藻类密度'
    };
    return fieldNames[key] || key;
  }, []);

  // 检查表格数据异常
  const checkTableDataAnomalies = useCallback((data) => {
    const alerts = [];
    const abnormalRowsSet = new Set();

    data.forEach((item, index) => {
      const rowAlerts = [];
      
      // 检查各个数值字段
      Object.keys(WATER_QUALITY_STANDARDS).forEach(key => {
        const status = checkValueStatus(key, item[key]);
        
        if (status === 'warning' || status === 'danger') {
          abnormalRowsSet.add(index);
          const alertInfo = {
            id: `${index}-${key}-${Date.now()}`,
            rowIndex: index,
            field: key,
            fieldName: getFieldName(key),
            value: item[key],
            unit: WATER_QUALITY_STANDARDS[key].unit,
            status: status,
            sectionName: item.section_name,
            monitorTime: item.monitor_time,
            timestamp: new Date().toLocaleString(),
            standard: WATER_QUALITY_STANDARDS[key]
          };
          rowAlerts.push(alertInfo);
        }
      });

      // 检查站点状态
      if (item.station_status && item.station_status !== '正常' && item.station_status !== 'normal') {
        abnormalRowsSet.add(index);
        rowAlerts.push({
          id: `${index}-status-${Date.now()}`,
          rowIndex: index,
          field: 'station_status',
          fieldName: '站点状态',
          value: item.station_status,
          unit: '',
          status: 'warning',
          sectionName: item.section_name,
          monitorTime: item.monitor_time,
          timestamp: new Date().toLocaleString()
        });
      }

      alerts.push(...rowAlerts);
    });

    setAbnormalRows(abnormalRowsSet);
    setAlertMessages(prev => [...alerts, ...prev].slice(0, 100)); // 保留最新100条警报
  }, [checkValueStatus, getFieldName, WATER_QUALITY_STANDARDS]);

  // 获取可用时间段
  const fetchAvailablePeriods = async () => {
    try {
      const response = await apiService.getWaterQualityPeriods();
      if (response.success) {
        // 将年月格式化为 YYYY-MM 字符串
        const periodStrings = response.data
          .map(period => `${period.year}-${period.month.toString().padStart(2, '0')}`)
          .sort(); // 按时间顺序排序
        
        console.log('获取到的可用时间段:', periodStrings);
        setAvailablePeriods(periodStrings);
        
        // 如果当前选择的时间段不在可用列表中，设置为最新的时间段
        if (periodStrings.length > 0) {
          const latestPeriod = periodStrings[periodStrings.length - 1];
          if (!periodStrings.includes(selectedDate)) {
            setSelectedDate(latestPeriod);
          }
          if (!periodStrings.includes(newSelectedDate)) {
            setNewSelectedDate(latestPeriod);
          }
        }
      } else {
        console.error('获取可用时间段失败:', response.error);
      }
    } catch (error) {
      console.error('获取可用时间段时出错:', error);
    }
  };

  // 获取字段中文名称（扩展版本）
  const getFieldDisplayName = (key) => {
    const displayNames = {
      water_temperature: '水温',
      pH: 'pH值',
      dissolved_oxygen: '溶解氧',
      conductivity: '电导率',
      turbidity: '浑浊度',
      permanganate_index: '高锰酸盐指数',
      ammonia_nitrogen: '氨氮',
      total_phosphorus: '总磷',
      total_nitrogen: '总氮',
      chlorophyll_a: '叶绿素a',
      algae_density: '藻类密度'
    };
    return displayNames[key] || key;
  };

  // 打开标准设置对话框
  const openStandardsDialog = () => {
    setEditableStandards(JSON.parse(JSON.stringify(WATER_QUALITY_STANDARDS)));
    setStandardsDialogOpen(true);
  };

  // 处理标准值变更
  const handleStandardChange = (key, field, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === '') {
      setEditableStandards(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value === '' ? '' : numValue
        }
      }));
    }
  };

  // 重置为默认标准
  const resetToDefault = () => {
    setEditableStandards(JSON.parse(JSON.stringify(DEFAULT_STANDARDS)));
  };

  // 保存标准设置
  const saveStandards = async () => {
    try {
      // 验证数据格式
      const isValid = Object.values(editableStandards).every(standard => 
        standard.min !== undefined && 
        standard.max !== undefined && 
        !isNaN(standard.min) && 
        !isNaN(standard.max) &&
        standard.min >= 0 &&
        standard.max >= standard.min
      );

      if (!isValid) {
        alert('请检查输入的数值，确保最小值和最大值都是有效数字，且最小值不大于最大值');
        return;
      }

      // 保存到localStorage
      localStorage.setItem('waterQualityStandards', JSON.stringify(editableStandards));
      
      // 更新当前标准
      setWATER_QUALITY_STANDARDS(editableStandards);
      
      setStandardsDialogOpen(false);
      
      // 重新检查当前数据的异常状态
      if (newFullWaterQualityData.length > 0) {
        checkTableDataAnomalies(newFullWaterQualityData);
      }

      alert('水质标准已保存成功！');
    } catch (error) {
      console.error('保存标准失败：', error);
      alert('保存失败，请重试');
    }
  };

  // 监控表格数据变化
  useEffect(() => {
    if (newFullWaterQualityData && newFullWaterQualityData.length > 0) {
      checkTableDataAnomalies(newFullWaterQualityData);
    }
  }, [newFullWaterQualityData, checkTableDataAnomalies]);

  // 新增：实时检测最新录入数据的异常
  const checkLatestDataAnomalies = async () => {
    try {
      // 获取最近录入的数据
      const response = await fetch('http://localhost:5000/api/recent-data?limit=20&data_type=water_quality');
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('检测最新数据异常:', result.data);
        checkTableDataAnomalies(result.data);
        
        // 如果发现异常，显示通知
        const hasAnomalies = result.data.some(item => {
          return Object.keys(WATER_QUALITY_STANDARDS).some(key => {
            const status = checkValueStatus(key, item[key]);
            return status === 'warning' || status === 'danger';
          });
        });
        
        if (hasAnomalies) {
          setExportMessage('⚠️ 检测到最新录入数据中有异常值，请查看异常警报！');
          setShowExportAlert(true);
        }
      }
    } catch (error) {
      console.error('检测最新数据异常失败:', error);
    }
  };

  // 定期检测最新数据异常（每30秒检查一次）
  useEffect(() => {
    const interval = setInterval(checkLatestDataAnomalies, 30000);
    
    // 页面加载时也检查一次
    checkLatestDataAnomalies();
    
    return () => clearInterval(interval);
  }, [WATER_QUALITY_STANDARDS, checkValueStatus]);

  // 新增：手动刷新并检测最新数据
  const refreshAndCheckLatestData = async () => {
    try {
      // 1. 刷新可用时间段
      await fetchAvailablePeriods();
      
      // 2. 检测最新数据异常
      await checkLatestDataAnomalies();
      
      // 3. 如果当前不是最新时间段，提示用户切换
      const response = await apiService.getWaterQualityPeriods();
      if (response.success && response.data.length > 0) {
        const latestPeriod = response.data
          .map(period => `${period.year}-${period.month.toString().padStart(2, '0')}`)
          .sort()
          .pop();
          
        if (latestPeriod && latestPeriod !== newSelectedDate) {
          setExportMessage(`💡 发现新时间段 ${latestPeriod}，建议切换查看最新数据`);
          setShowExportAlert(true);
          
          // 可选：自动切换到最新时间段
          // setNewSelectedDate(latestPeriod);
        }
      }
      
      setExportMessage('数据已刷新并完成异常检测');
      setShowExportAlert(true);
    } catch (error) {
      console.error('刷新数据失败:', error);
      setExportMessage('刷新数据失败: ' + error.message);
      setShowExportAlert(true);
    }
  };

  // 过滤显示的数据
  const filteredData = showAbnormalOnly 
    ? newFullWaterQualityData.filter((_, index) => abnormalRows.has(index))
    : newFullWaterQualityData;

  // 清除所有警报
  const clearAllAlerts = () => {
    setAlertMessages([]);
  };

  // 查看警报详情
  const viewAlertDetails = (alert) => {
    setSelectedAlert(alert);
    setAlertDialogOpen(true);
  };

  // 获取用户角色
  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      setUserRole(userInfo?.role || null);
    } catch (e) {
      console.error('解析用户信息失败：', e);
      setUserRole(null);
    }
  }, []);

  // 从localStorage加载自定义标准
  useEffect(() => {
    try {
      const savedStandards = localStorage.getItem('waterQualityStandards');
      if (savedStandards) {
        const parsed = JSON.parse(savedStandards);
        setWATER_QUALITY_STANDARDS(parsed);
      }
    } catch (e) {
      console.error('加载自定义标准失败：', e);
    }
  }, []);

  // 在页面加载时获取可用时间段
  useEffect(() => {
    fetchAvailablePeriods();
  }, []);

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
      const [province, basin, section_name] = selectedLocation.split('|');

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
          setWaterQualityData([]);
        }
      } catch (error) {
        console.error('获取水质数据失败', error);
        setWaterQualityData([]);
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
          setNewFullWaterQualityData([]);
        }
      } catch (error) {
        console.error('获取完整水质数据失败', error);
        setNewFullWaterQualityData([]);
      }
    };

    fetchNewFullWaterQualityData();
  }, [newSelectedProvinceBasin, newSelectedDate]);

  // 导出处理函数
  const handleExportWaterQuality = async (format) => {
    setIsExporting(true);
    try {
      const [year, month] = selectedDate.split('-');
      const [province, basin] = selectedProvinceBasin ? selectedProvinceBasin.split('|') : [null, null];
      
      await apiService.exportWaterQuality(year, month, province, basin, format);
      setExportMessage(`水质数据已成功导出为 ${format.toUpperCase()} 格式`);
      setShowExportAlert(true);
    } catch (error) {
      setExportMessage('导出失败: ' + error.message);
      setShowExportAlert(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportComprehensiveReport = async (format = 'pdf') => {
    setIsExporting(true);
    console.log(`开始导出综合报告，格式: ${format}`);
    
    try {
      const [year, month] = selectedDate.split('-');
      console.log(`参数: year=${year}, month=${month}, format=${format}`);
      
      const result = await apiService.exportComprehensiveReport(year, month, format);
      console.log('导出成功:', result);
      
      setExportMessage(`综合报告已成功导出为 ${format.toUpperCase()} 格式`);
      setShowExportAlert(true);
    } catch (error) {
      console.error('导出失败详情:', error);
      console.error('错误堆栈:', error.stack);
      
      setExportMessage('导出失败: ' + error.message);
      setShowExportAlert(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowExportAlert(false);
  };

  // 新增：跨时间段检测所有最新数据异常
  const checkAllPeriodsForAnomalies = async () => {
    try {
      console.log('开始跨时间段异常检测...');
      
      // 获取所有可用时间段
      const periodsResponse = await apiService.getWaterQualityPeriods();
      if (!periodsResponse.success) {
        throw new Error('获取时间段失败');
      }
      
      const periods = periodsResponse.data;
      if (periods.length === 0) {
        console.log('没有找到可用的时间段');
        return;
      }
      
      // 检测最近3个时间段的数据（避免检测过多数据）
      const recentPeriods = periods
        .map(p => ({ 
          period: `${p.year}-${p.month.toString().padStart(2, '0')}`,
          year: p.year,
          month: p.month
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-3); // 只检测最近3个时间段
      
      console.log('检测时间段:', recentPeriods.map(p => p.period));
      
      let totalAnomalies = 0;
      
      for (const { period, year, month } of recentPeriods) {
        try {
          // 获取该时间段的数据
          const response = await fetch(
            `http://localhost:5000/api/water-quality/full_data?year=${year}&month=${month.toString().padStart(2, '0')}`
          );
          const result = await response.json();
          
          if (result.success && result.data && result.data.length > 0) {
            // 只检查最近的10条数据
            const recentData = result.data.slice(-10);
            
            const periodAnomalies = [];
            recentData.forEach((item, index) => {
              Object.keys(WATER_QUALITY_STANDARDS).forEach(key => {
                const status = checkValueStatus(key, item[key]);
                
                if (status === 'warning' || status === 'danger') {
                  const alertInfo = {
                    id: `${period}-${index}-${key}-${Date.now()}`,
                    rowIndex: index,
                    field: key,
                    fieldName: getFieldName(key),
                    value: item[key],
                    unit: WATER_QUALITY_STANDARDS[key].unit,
                    status: status,
                    sectionName: item.section_name,
                    monitorTime: item.monitor_time,
                    timestamp: new Date().toLocaleString(),
                    standard: WATER_QUALITY_STANDARDS[key],
                    period: period  // 添加时间段信息
                  };
                  periodAnomalies.push(alertInfo);
                }
              });
            });
            
            if (periodAnomalies.length > 0) {
              totalAnomalies += periodAnomalies.length;
              // 将新发现的异常添加到警报列表
              setAlertMessages(prev => [...periodAnomalies, ...prev].slice(0, 100));
              console.log(`${period} 时间段发现 ${periodAnomalies.length} 个异常`);
            }
          }
        } catch (error) {
          console.error(`检测 ${period} 时间段异常失败:`, error);
        }
      }
      
      if (totalAnomalies > 0) {
        setExportMessage(`🚨 跨时间段检测发现 ${totalAnomalies} 个异常！请查看异常警报详情`);
        setShowExportAlert(true);
      } else {
        setExportMessage('✅ 跨时间段检测完成，未发现异常数据');
        setShowExportAlert(true);
      }
      
    } catch (error) {
      console.error('跨时间段异常检测失败:', error);
      setExportMessage('跨时间段异常检测失败: ' + error.message);
      setShowExportAlert(true);
    }
  };

  // 新增：监听数据上传事件（通过localStorage事件）
  useEffect(() => {
    const handleDataUpload = (event) => {
      if (event.key === 'dataUploadSuccess') {
        console.log('检测到数据上传成功，开始异常检测...');
        setTimeout(() => {
          checkLatestDataAnomalies();
          checkAllPeriodsForAnomalies();
        }, 2000); // 延迟2秒确保数据已保存
        
        // 清除事件标志
        localStorage.removeItem('dataUploadSuccess');
      }
    };
    
    window.addEventListener('storage', handleDataUpload);
    
    return () => {
      window.removeEventListener('storage', handleDataUpload);
    };
  }, [WATER_QUALITY_STANDARDS, checkValueStatus]);

  if (error) return <div>Error: {error}</div>;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f1f5f9 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2338bdf8" fill-opacity="0.04"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.7,
      }
    }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 6, position: 'relative', zIndex: 1 }}>
        {/* 标题和管理员设置按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            mb: 0,
            animation: `${fadeIn} 0.8s ease-out`,
          }}>
            智慧海洋牧场数据中心
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <AppleButton
              variant="success"
              onClick={refreshAndCheckLatestData}
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <RestoreIcon />}
              disabled={isExporting}
            >
              实时检测
            </AppleButton>
            {userRole === 'admin' && (
              <AppleButton
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={openStandardsDialog}
              >
                设置水质标准
              </AppleButton>
            )}
          </Box>
        </Box>

        {/* 管理员浮动设置按钮 */}
        {userRole === 'admin' && (
          <Fab
            aria-label="设置水质标准"
            onClick={openStandardsDialog}
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24, 
              zIndex: 1000,
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              boxShadow: '0 8px 25px rgba(0, 122, 255, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0051D5 0%, #4C44B8 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 35px rgba(0, 122, 255, 0.6)',
              },
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <SettingsIcon sx={{ color: 'white' }} />
          </Fab>
        )}

        {/* 异常警报区域 */}
        {alertMessages.length > 0 && (
          <GlassCard sx={{ mb: 4, animation: `${slideInLeft} 0.8s ease-out` }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    异常警报
                  </Typography>
                  <StatusChip 
                    label={`${alertMessages.length} 条警报`}
                    size="small"
                    status="danger"
                  />
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <AppleButton
                    variant="outlined"
                    onClick={refreshAndCheckLatestData}
                    startIcon={<CircularProgress size={16} sx={{ display: isExporting ? 'block' : 'none' }} />}
                    disabled={isExporting}
                    size="small"
                  >
                    刷新检测
                  </AppleButton>
                  <AppleButton
                    variant="outlined"
                    onClick={clearAllAlerts}
                    size="small"
                  >
                    清除警报
                  </AppleButton>
                </Box>
              }
            />
            <CardContent>
              <Box sx={{ maxHeight: 200, overflow: 'auto', pr: 1 }}>
                {alertMessages.slice(0, 10).map((alert, index) => (
                  <GlassCard
                    key={alert.id}
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      background: alert.status === 'danger' 
                        ? 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
                      border: `1px solid ${alert.status === 'danger' ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 149, 0, 0.3)'}`,
                      animation: `${fadeIn} ${0.3 + index * 0.1}s ease-out`,
                      '&:hover': {
                        transform: 'translateX(8px)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                      }
                    }}
                    onClick={() => viewAlertDetails(alert)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1D1D1F' }}>
                            {alert.sectionName} - {alert.fieldName}: {alert.value}{alert.unit}
                            {alert.status === 'danger' ? ' (严重超标)' : ' (轻微超标)'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                            {new Date(alert.monitorTime).toLocaleString()}
                          </Typography>
                        </Box>
                        <AppleButton
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAlertMessages(prev => prev.filter(a => a.id !== alert.id));
                          }}
                          sx={{ ml: 2, minWidth: 'auto', px: 1 }}
                        >
                          删除
                        </AppleButton>
                      </Box>
                    </CardContent>
                  </GlassCard>
                ))}
              </Box>
            </CardContent>
          </GlassCard>
        )}

        {/* 区域选择和标题 */}
        <GlassCard sx={{ mb: 4, animation: `${fadeIn} 1s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                最近水质展示
              </Typography>
            }
          />
          <CardContent>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#8E8E93', fontWeight: 600 }}>选择区域</InputLabel>
              <Select
                value={selectedLocation}
                label="选择区域"
                onChange={(e) => setSelectedLocation(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid rgba(0, 122, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '2px solid #007AFF',
                  },
                }}
              >
                {locations.map((loc, index) => (
                  <MenuItem key={index} value={`${loc.province}|${loc.basin}|${loc.section_name}`}>
                    {loc.province} - {loc.basin} - {loc.section_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </GlassCard>

        {/* 当前水质状态卡片 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ 
            mb: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            实时水质状态
          </Typography>
          
          <Grid container spacing={3} justifyContent="center">
            {Object.entries(currentStatus).map(([key, info], index) => (
              <Grid item xs={12} sm={6} md={2.4} key={key}>
                <Box sx={{ animation: `${slideInLeft} ${0.5 + index * 0.1}s ease-out` }}>
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
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 数据可视化控制面板 */}
        <GlassCard sx={{ mb: 4, animation: `${fadeIn} 1.2s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #34C759 0%, #007AFF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                水质数据可视化
              </Typography>
            }
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isExporting && <CircularProgress size={20} />}
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#8E8E93', fontWeight: 600 }}>选择时间</InputLabel>
                  <Select
                    value={selectedDate}
                    label="选择时间"
                    onChange={(e) => setSelectedDate(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(52, 199, 89, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(52, 199, 89, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #34C759',
                      },
                    }}
                  >
                    {availablePeriods.length > 0 ? (
                      availablePeriods.map((date) => (
                        <MenuItem key={date} value={date}>
                          {date}
                        </MenuItem>
                      ))
                    ) : (
                      // 备用硬编码选项（如果API失败）
                      [
                        '2020-05', '2020-06', '2020-07', '2020-08', '2020-09', '2020-10',
                        '2020-11', '2020-12', '2021-01', '2021-02', '2021-03', '2021-04','2025-05'
                      ].map((date) => (
                        <MenuItem key={date} value={date}>
                          {date}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#8E8E93', fontWeight: 600 }}>选择区域</InputLabel>
                  <Select
                    value={selectedProvinceBasin}
                    label="选择区域"
                    onChange={(e) => setSelectedProvinceBasin(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(88, 86, 214, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(88, 86, 214, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #5856D6',
                      },
                    }}
                  >
                    {provinceBasinList.map((loc, index) => (
                      <MenuItem key={index} value={`${loc.province}|${loc.basin}`}>
                        {loc.province} - {loc.basin}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* 导出按钮组 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              <AppleButton 
                startIcon={<Download />}
                onClick={() => handleExportWaterQuality('csv')}
                disabled={isExporting}
                variant="outlined"
              >
                导出CSV
              </AppleButton>
              <AppleButton 
                startIcon={<GetApp />}
                onClick={() => handleExportWaterQuality('excel')}
                disabled={isExporting}
                variant="outlined"
              >
                导出Excel
              </AppleButton>
              <AppleButton 
                startIcon={<GetApp />}
                onClick={() => handleExportComprehensiveReport('pdf')}
                disabled={isExporting}
                variant="primary"
              >
                PDF报告
              </AppleButton>
              <AppleButton 
                startIcon={<GetApp />}
                onClick={() => handleExportComprehensiveReport('excel')}
                disabled={isExporting}
                variant="success"
              >
                Excel报告
              </AppleButton>
              <AppleButton 
                startIcon={<ImageIcon />}
                onClick={() => exportAllChartsInPage('水质监测')}
                disabled={isExporting}
                variant="warning"
              >
                导出所有图表
              </AppleButton>
            </Box>
          </CardContent>
        </GlassCard>


        {/* 图表展示区 */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Box sx={{ animation: `${slideInLeft} 1.4s ease-out` }}>
                <WaterQualityChart data={waterQualityData} />
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ animation: `${slideInLeft} 1.6s ease-out` }}>
                <WaterQualityDistribution data={distributionData} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      
        {/* 历史数据控制面板 */}
        <GlassCard sx={{ mb: 4, animation: `${fadeIn} 1.8s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                历史水质数据
              </Typography>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#8E8E93', fontWeight: 600 }}>选择时间</InputLabel>
                  <Select
                    value={newSelectedDate} // 使用新的状态变量
                    label="选择时间"
                    onChange={(e) => setNewSelectedDate(e.target.value)} // 更新新的状态变量
                    sx={{
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(255, 149, 0, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(255, 149, 0, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #FF9500',
                      },
                    }}
                  >
                    {availablePeriods.length > 0 ? (
                      availablePeriods.map((date) => (
                        <MenuItem key={date} value={date}>
                          {date}
                        </MenuItem>
                      ))
                    ) : (
                      // 备用硬编码选项（如果API失败）
                      [
                        '2020-05', '2020-06', '2020-07', '2020-08', '2020-09', '2020-10',
                        '2020-11', '2020-12', '2021-01', '2021-02', '2021-03', '2021-04', '2025-05'
                      ].map((date) => (
                        <MenuItem key={date} value={date}>
                          {date}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#8E8E93', fontWeight: 600 }}>选择区域</InputLabel>
                  <Select
                    value={newSelectedProvinceBasin}
                    label="选择区域"
                    onChange={(e) => setNewSelectedProvinceBasin(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(255, 59, 48, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #FF3B30',
                      },
                    }}
                  >
                    {newProvinceBasinList.map((loc, index) => (
                      <MenuItem key={index} value={`${loc.province}|${loc.basin}`}>
                        {loc.province} - {loc.basin}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </GlassCard>

        {/* 历史数据表格 */}
        <GlassCard sx={{ mb: 4, animation: `${fadeIn} 2s ease-out` }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                历史水质数据详情
              </Typography>
            }
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <AppleButton 
                  startIcon={<Download />}
                  onClick={() => handleExportWaterQuality('csv')}
                  disabled={isExporting}
                  variant="outlined"
                  size="small"
                >
                  导出CSV
                </AppleButton>
                <AppleButton 
                  startIcon={<GetApp />}
                  onClick={() => handleExportWaterQuality('excel')}
                  disabled={isExporting}
                  variant="outlined"
                  size="small"
                >
                  导出Excel
                </AppleButton>
              </Box>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer sx={{ 
              maxHeight: 600,
              borderRadius: '0 0 16px 16px',
              '&::-webkit-scrollbar': {
                width: 8,
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                borderRadius: 4,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0051D5, #4C44B8)',
                },
              },
            }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {[
                      '日期', '断面名称', '水质类别', '水温 (°C)', 'pH值', '溶解氧 (mg/L)',
                      '电导率 (μS/cm)', '浑浊度 (NTU)', '高锰酸盐指数', '氨氮 (mg/L)',
                      '总磷 (mg/L)', '总氮 (mg/L)', '叶绿素 a (mg/m³)', '藻类密度 (cells/L)', '站点状态'
                    ].map((header, index) => (
                      <TableCell 
                        key={header}
                        sx={{ 
                          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(88, 86, 214, 0.1) 100%)',
                          backdropFilter: 'blur(10px)',
                          fontWeight: 700,
                          color: '#1D1D1F',
                          borderBottom: '2px solid rgba(0, 122, 255, 0.3)',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newFullWaterQualityData.map((item, index) => (
                    <TableRow 
                      key={index}
                      sx={{
                        '&:nth-of-type(odd)': {
                          background: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:nth-of-type(even)': {
                          background: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover': {
                          background: 'rgba(0, 122, 255, 0.1)',
                          transform: 'scale(1.02)',
                          transition: 'all 0.2s ease',
                        },
                        animation: `${fadeIn} ${0.5 + index * 0.05}s ease-out`,
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#007AFF' }}>
                        {new Date(item.monitor_time).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1D1D1F' }}>
                        {item.section_name}
                      </TableCell>
                      <TableCell>
                        <StatusChip 
                          label={item.water_quality_category}
                          size="small"
                          status={
                            item.water_quality_category?.includes('优') || item.water_quality_category?.includes('I') ? 'good' :
                            item.water_quality_category?.includes('良') || item.water_quality_category?.includes('II') ? 'good' :
                            item.water_quality_category?.includes('III') ? 'warning' : 'danger'
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.water_temperature}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.pH}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.dissolved_oxygen}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.conductivity}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.turbidity}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.permanganate_index}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.ammonia_nitrogen}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.total_phosphorus}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.total_nitrogen}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.chlorophyll_a}</TableCell>
                      <TableCell sx={{ color: '#1D1D1F', fontWeight: 500 }}>{item.algae_density}</TableCell>
                      <TableCell>
                        <StatusChip 
                          label={item.station_status || '正常'}
                          size="small"
                          status="good"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </GlassCard>

       <Box sx={{ marginTop: 18, marginBottom: 18 }}>
          {/* 这里是你的卡片或其他内容 */}
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
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              background: exportMessage.includes('失败') 
                ? 'linear-gradient(135deg, rgba(255, 59, 48, 0.9) 0%, rgba(255, 107, 107, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(52, 199, 89, 0.9) 0%, rgba(40, 167, 69, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              color: 'white',
              fontWeight: 600,
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
              '& .MuiAlert-icon': {
                color: 'white',
              },
              '& .MuiAlert-action': {
                color: 'white',
              },
            }}
          >
            {exportMessage}
          </Alert>
        </Snackbar>

      {/* 水质标准设置对话框 */}
      <Dialog 
        open={standardsDialogOpen} 
        onClose={() => setStandardsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SettingsIcon />
          水质标准设置
          <Chip 
            label="管理员权限" 
            size="small" 
            sx={{ ml: 'auto', backgroundColor: 'warning.main', color: 'white' }}
          />
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            设置各项水质指标的正常范围。超出范围的数据将被标记为异常。
          </Typography>

          <Grid container spacing={3}>
            {Object.entries(editableStandards).map(([key, standard]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {getFieldDisplayName(key)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="最小值"
                      type="number"
                      size="small"
                      value={standard.min}
                      onChange={(e) => handleStandardChange(key, 'min', e.target.value)}
                      InputProps={{
                        endAdornment: standard.unit && (
                          <Typography variant="caption" color="text.secondary">
                            {standard.unit}
                          </Typography>
                        )
                      }}
                      inputProps={{ 
                        step: key === 'pH' ? 0.1 : 1,
                        min: 0
                      }}
                    />
                    
                    <TextField
                      label="最大值"
                      type="number"
                      size="small"
                      value={standard.max}
                      onChange={(e) => handleStandardChange(key, 'max', e.target.value)}
                      InputProps={{
                        endAdornment: standard.unit && (
                          <Typography variant="caption" color="text.secondary">
                            {standard.unit}
                          </Typography>
                        )
                      }}
                      inputProps={{ 
                        step: key === 'pH' ? 0.1 : 1,
                        min: standard.min || 0
                      }}
                    />
                    
                    <Typography variant="caption" color="text.secondary">
                      范围: {standard.min} - {standard.max} {standard.unit}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>说明：</strong>
              <br />• 轻微超标：超出标准范围但在范围的20%以内
              <br />• 严重超标：超出标准范围20%以上
              <br />• 修改后的标准将立即应用于当前数据的异常检测
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={resetToDefault}
            color="warning"
          >
            恢复默认
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            onClick={() => setStandardsDialogOpen(false)}
            color="inherit"
          >
            取消
          </Button>
          
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveStandards}
            color="primary"
          >
            保存设置
          </Button>
        </DialogActions>
      </Dialog>

      {/* 警报详情对话框 */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          警报详情
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.sectionName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>监测指标：</strong> {selectedAlert.fieldName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>当前值：</strong> {selectedAlert.value} {selectedAlert.unit}
              </Typography>
              {selectedAlert.standard && (
                <Typography variant="body1" gutterBottom>
                  <strong>标准范围：</strong> {selectedAlert.standard.min} - {selectedAlert.standard.max} {selectedAlert.unit}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                <strong>异常等级：</strong> 
                <span style={{ color: selectedAlert.status === 'danger' ? '#f44336' : '#ff9800' }}>
                  {selectedAlert.status === 'danger' ? ' 严重超标' : ' 轻微超标'}
                </span>
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>监测时间：</strong> {new Date(selectedAlert.monitorTime).toLocaleString()}
              </Typography>
              <Typography variant="body1">
                <strong>警报时间：</strong> {selectedAlert.timestamp}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>

      </Container>
    </Box>
  );
}

export default HomePage;