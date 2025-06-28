import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Table, TableHead, TableRow, TableCell, 
  TableBody, Paper, TableContainer, Button, Box, ButtonGroup, 
  CircularProgress, Snackbar, Alert, Card, CardContent, CardHeader,
  Avatar, Chip, IconButton, Grid, Tooltip
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { 
  Download, GetApp, Edit, Delete, People, AdminPanelSettings, 
  Person, SupervisorAccount, Business, Refresh, TrendingUp
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

const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '20px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
  },
}));

const AppleButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 16px',
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
  ...(variant === 'danger' && {
    background: 'linear-gradient(135deg, #FF3B30 0%, #D70015 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #D70015 0%, #A20003 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(255, 59, 48, 0.3)',
    },
  }),
  ...(variant === 'secondary' && {
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

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  height: '100%',
  animation: `${slideInUp} 0.8s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
    animation: `${pulse} 2s ease-in-out infinite`,
  },
}));

const StatusChip = styled(Chip)(({ roletype }) => ({
  borderRadius: '20px',
  fontWeight: 700,
  fontSize: '0.8rem',
  ...(roletype === 'admin' && {
    background: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
    color: 'white',
  }),
  ...(roletype === 'user' && {
    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
    color: 'white',
  }),
  ...(roletype === 'moderator' && {
    background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
    color: 'white',
  }),
}));

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 导出相关状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [showExportAlert, setShowExportAlert] = useState(false);

  // 统计数据
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    userCount: 0,
    avgAge: 0
  });

  const navigate = useNavigate();

  // 获取用户数据
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const userData = response.data.data;
        setUsers(userData);
        
        // 计算统计数据
        const adminCount = userData.filter(user => user.role === 'admin').length;
        const userCount = userData.filter(user => user.role === 'user').length;
        const ages = userData.map(user => parseInt(user.age)).filter(age => !isNaN(age));
        const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;
        
        setStats({
          totalUsers: userData.length,
          adminCount,
          userCount,
          avgAge
        });
      } else {
        setUsers([]);
        console.error('API返回的数据格式不符合预期:', response.data);
        setError('获取用户数据格式不正确');
      }
    } catch (err) {
      setUsers([]);
      setError('获取用户数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 删除用户
  const handleDelete = async (username) => {
    const currentUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!currentUser || currentUser.role !== 'admin') {
      setExportMessage('只有管理员才能删除用户');
      setShowExportAlert(true);
      return;
    }

    if (window.confirm(`确定要删除用户 ${username} 吗？此操作不可撤销。`)) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/users/${username}`, {
          data: {
            username: currentUser.username,
            role: currentUser.role
          }
        });
        setExportMessage(response.data.message);
        setShowExportAlert(true);
        fetchUsers();
      } catch (error) {
        if (error.response && error.response.data?.message) {
          setExportMessage(error.response.data.message);
        } else {
          setExportMessage('删除失败，请稍后重试');
        }
        setShowExportAlert(true);
      }
    }
  };

  // 修改用户
  const handleEdit = (username) => {
    const currentUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!currentUser || currentUser.role !== 'admin') {
      setExportMessage('只有管理员才能修改用户信息');
      setShowExportAlert(true);
      return;
    }
    navigate(`/edit-user/${username}`);
  };

  // 导出处理函数
  const handleExportUsers = async (format) => {
    const currentUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!currentUser || currentUser.role !== 'admin') {
      setExportMessage('只有管理员才能导出用户数据');
      setShowExportAlert(true);
      return;
    }

    setIsExporting(true);
    try {
      await apiService.exportUsers(format);
      setExportMessage(`用户数据已成功导出为 ${format.toUpperCase()} 格式`);
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings sx={{ fontSize: 16 }} />;
      case 'moderator':
        return <SupervisorAccount sx={{ fontSize: 16 }} />;
      default:
        return <Person sx={{ fontSize: 16 }} />;
    }
  };

  const getGenderAvatar = (gender, username) => {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];
    const colorIndex = username.charCodeAt(0) % colors.length;
    return (
      <Avatar sx={{ 
        bgcolor: colors[colorIndex], 
        width: 32, 
        height: 32,
        fontSize: '0.9rem',
        fontWeight: 700,
      }}>
        {username.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f7fa 50%, #eceff1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f7fa 50%, #eceff1 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2326c6da" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.7,
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          mb: 4,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f766e 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          animation: `${fadeIn} 0.8s ease-out`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <People sx={{ fontSize: 40, color: '#007AFF' }} />
          👥 用户管理中心
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: 'white' }} />
          </Box>
        ) : (
          <>
            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <People sx={{ 
                      fontSize: 40, 
                      color: '#007AFF',
                      mb: 1,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      总用户数
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AdminPanelSettings sx={{ 
                      fontSize: 40, 
                      color: '#FF3B30',
                      mb: 1,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      {stats.adminCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      管理员
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Person sx={{ 
                      fontSize: 40, 
                      color: '#34C759',
                      mb: 1,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      {stats.userCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      普通用户
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <TrendingUp sx={{ 
                      fontSize: 40, 
                      color: '#AF52DE',
                      mb: 1,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D92 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      {stats.avgAge}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      平均年龄
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
            </Grid>

            {/* 用户列表 */}
            <GlassCard>
              <CardHeader
                title={
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    📋 用户信息列表
                  </Typography>
                }
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="刷新数据">
                      <IconButton onClick={fetchUsers} disabled={loading}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                    <ButtonGroup disabled={isExporting}>
                      <AppleButton 
                        variant="secondary"
                        startIcon={<Download />}
                        onClick={() => handleExportUsers('csv')}
                        size="small"
                      >
                        CSV
                      </AppleButton>
                      <AppleButton 
                        variant="secondary"
                        startIcon={<GetApp />}
                        onClick={() => handleExportUsers('excel')}
                        size="small"
                      >
                        Excel
                      </AppleButton>
                    </ButtonGroup>
                    {isExporting && <CircularProgress size={20} sx={{ ml: 1 }} />}
                  </Box>
                }
              />
              <CardContent>
                <TableContainer sx={{ 
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  maxHeight: 600,
                  overflow: 'auto',
                }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {[
                          '用户', '性别', '年龄', '角色', '单位', '操作'
                        ].map((header, index) => (
                          <TableCell 
                            key={header}
                            align={header === '操作' ? 'center' : 'left'}
                            sx={{ 
                              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              animation: `${slideInUp} 0.6s ease-out ${index * 0.1}s both`,
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length > 0 ? (
                        users.map((user, index) => (
                          <TableRow 
                            key={user.username}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                                transform: 'scale(1.01)',
                              },
                              transition: 'all 0.2s ease',
                              animation: `${slideInUp} 0.8s ease-out ${index * 0.05}s both`,
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {getGenderAvatar(user.gender, user.username)}
                                <Typography sx={{ fontWeight: 600, color: '#1D1D1F' }}>
                                  {user.username}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={user.gender === 'male' ? '👨 男' : '👩 女'}
                                size="small"
                                sx={{
                                  background: user.gender === 'male' 
                                    ? 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)'
                                    : 'linear-gradient(135deg, #FF2D92 0%, #AF52DE 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1D1D1F' }}>
                              {user.age} 岁
                            </TableCell>
                            <TableCell>
                              <StatusChip 
                                icon={getRoleIcon(user.role)}
                                label={user.role === 'admin' ? '管理员' : '普通用户'}
                                size="small"
                                roletype={user.role}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#8E8E93', fontWeight: 500 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Business sx={{ fontSize: 16, color: '#8E8E93' }} />
                                {user.unit}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Tooltip title="编辑用户">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEdit(user.username)}
                                    sx={{
                                      color: '#007AFF',
                                      '&:hover': {
                                        backgroundColor: 'rgba(0, 122, 255, 0.1)',
                                        transform: 'scale(1.1)',
                                      },
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="删除用户">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(user.username)}
                                    sx={{
                                      color: '#FF3B30',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                        transform: 'scale(1.1)',
                                      },
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <Typography variant="body1" sx={{ 
                              color: '#8E8E93',
                              fontWeight: 600,
                            }}>
                              暂无用户数据
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </GlassCard>
          </>
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
            severity={exportMessage.includes('失败') || exportMessage.includes('只有管理员') ? 'error' : 'success'}
            sx={{ 
              width: '100%',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              fontWeight: 600,
            }}
          >
            {exportMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default UserListPage;




