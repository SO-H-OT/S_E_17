import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Button, TextField, MenuItem,
  Tabs, Tab, Box, Alert, CircularProgress, Divider, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  CloudUpload, Add, Delete, Preview, Save, FileUpload
} from '@mui/icons-material';
import { apiService } from '../services/api';

// 数据类型定义
const DATA_TYPES = {
  WATER_QUALITY: 'water_quality',
  FISH_DATA: 'fish_data'
};

// 水质数据字段定义
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

// 鱼类数据字段定义
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
    if (field.type === 'select') {
      return (
        <TextField
          key={field.key}
          select
          label={field.label}
          value={manualData[field.key] || ''}
          onChange={(e) => handleManualDataChange(field.key, e.target.value)}
          required={field.required}
          fullWidth
          margin="normal"
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
        label={field.label}
        type={field.type}
        value={manualData[field.key] || ''}
        onChange={(e) => handleManualDataChange(field.key, e.target.value)}
        required={field.required}
        fullWidth
        margin="normal"
        InputLabelProps={field.type === 'datetime-local' ? { shrink: true } : {}}
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        数据上传管理
      </Typography>

      {/* 使用说明 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
           数据上传和验证指南
        </Typography>
        <Typography variant="body2" component="div">
          <strong>上传数据后，可通过以下方式验证：</strong>
          <strong>支持格式：</strong>手动输入、CSV文件批量上传
        </Typography>
      </Alert>

      {/* 数据类型选择 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          选择数据类型
        </Typography>
        <TextField
          select
          value={dataType}
          onChange={(e) => {
            setDataType(e.target.value);
            setManualData({});
            setManualDataList([]);
            setCsvData([]);
          }}
          fullWidth
        >
          <MenuItem value={DATA_TYPES.WATER_QUALITY}>水质监测数据</MenuItem>
          <MenuItem value={DATA_TYPES.FISH_DATA}>鱼类数据</MenuItem>
        </TextField>
      </Paper>

      {/* 选项卡 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="手动输入数据" icon={<Add />} />
          <Tab label="CSV文件上传" icon={<CloudUpload />} />
          <Tab label="最近上传的数据" icon={<FileUpload />} />
        </Tabs>

        {/* 手动输入数据面板 */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                输入{dataType === DATA_TYPES.WATER_QUALITY ? '水质监测' : '鱼类'}数据
              </Typography>
              
              <Box component="form">
                {getCurrentFields().map(field => renderFormField(field))}
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddManualData}
                    disabled={loading}
                  >
                    添加到列表
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                数据列表 ({manualDataList.length} 条)
              </Typography>
              
              {manualDataList.length > 0 && (
                <>
                  <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 2 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {getCurrentFields().slice(0, 3).map(field => (
                            <TableCell key={field.key}>{field.label}</TableCell>
                          ))}
                          <TableCell>操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {manualDataList.map((item) => (
                          <TableRow key={item.id}>
                            {getCurrentFields().slice(0, 3).map(field => (
                              <TableCell key={field.key}>
                                {item[field.key] || '-'}
                              </TableCell>
                            ))}
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveManualData(item.id)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleSubmitManualData}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={20} /> : '提交数据'}
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
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
  );
}

export default DataUploadPage; 