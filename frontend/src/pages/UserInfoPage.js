import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Divider,
  Box,
  Chip,
  Paper,
  IconButton,
  Button
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Person, AdminPanelSettings, Business, Cake, Wc, 
  Edit, Security, Settings, Logout, Badge 
} from '@mui/icons-material';

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

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
  },
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
  backdropFilter: 'blur(25px)',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '28px',
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${slideInUp} 0.8s ease-out`,
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: '0 35px 70px rgba(0, 0, 0, 0.15)',
    animation: `${pulse} 2s ease-in-out infinite`,
  },
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  padding: '20px',
  transition: 'all 0.3s ease',
  animation: `${slideInUp} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px)',
    background: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
  },
}));

const AppleButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
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
}));

const StatusChip = styled(Chip)(({ roletype }) => ({
  borderRadius: '20px',
  fontWeight: 700,
  fontSize: '0.9rem',
  padding: '8px 16px',
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

function UserInfoPage() {
  let userInfo = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo'));
  } catch (e) {
    console.error("用户信息解析失败：", e);
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings sx={{ fontSize: 20 }} />;
      case 'moderator':
        return <Security sx={{ fontSize: 20 }} />;
      default:
        return <Person sx={{ fontSize: 20 }} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return ['#FF3B30', '#FF9500'];
      case 'moderator':
        return ['#34C759', '#30D158'];
      default:
        return ['#007AFF', '#5856D6'];
    }
  };

  const getAvatarGradient = (username) => {
    const gradients = [
      ['#007AFF', '#5856D6'],
      ['#34C759', '#30D158'],
      ['#FF9500', '#FF6D00'],
      ['#AF52DE', '#FF2D92'],
      ['#FF3B30', '#D70015']
    ];
    const index = username ? username.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  if (!userInfo) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fafbfc 0%, #e1f5fe 50%, #f3e5f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2329b6f6" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.6,
        }
      }}>
        <GlassCard sx={{ p: 4, textAlign: 'center', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          <Person sx={{ fontSize: 80, color: '#8E8E93', mb: 2 }} />
          <Typography variant="h6" sx={{ 
            color: '#8E8E93',
            fontWeight: 600,
          }}>
            暂无用户信息，请登录后查看
          </Typography>
        </GlassCard>
      </Box>
    );
  }

  const avatarGradient = getAvatarGradient(userInfo.username);
  const roleColors = getRoleColor(userInfo.role);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fafbfc 0%, #e1f5fe 50%, #f3e5f5 100%)',
      position: 'relative',
      padding: '40px 0',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2329b6f6" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.6,
      }
    }}>
      <Grid container justifyContent="center" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid item xs={12} sm={10} md={8} lg={6} xl={5}>
          <ProfileCard sx={{ p: 4 }}>
            <CardContent>
              {/* 头像和基本信息 */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${avatarGradient[0]} 0%, ${avatarGradient[1]} 100%)`,
                  width: 120, 
                  height: 120,
                  fontSize: '3rem',
                  fontWeight: 800,
                  mb: 3,
                  animation: `${float} 3s ease-in-out infinite`,
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
                }}>
                  {userInfo.username.charAt(0).toUpperCase()}
                </Avatar>
                
                <Typography variant="h4" sx={{ 
                  mb: 2,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1D1D1F 0%, #48484A 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center',
                }}>
                  {userInfo.username}
                </Typography>

                <StatusChip 
                  icon={getRoleIcon(userInfo.role)}
                  label={userInfo.role === 'admin' ? '👑 系统管理员' : '👤 普通用户'}
                  roletype={userInfo.role}
                  sx={{ mb: 3 }}
                />

                <Typography variant="body1" sx={{ 
                  color: '#8E8E93',
                  fontWeight: 500,
                  textAlign: 'center',
                  mb: 3,
                }}>
                  欢迎回来！您的个人信息概览如下
                </Typography>
              </Box>

              <Divider sx={{ 
                mb: 4, 
                background: 'linear-gradient(90deg, transparent 0%, rgba(142, 142, 147, 0.3) 50%, transparent 100%)',
                height: 2,
              }} />

              {/* 详细信息 */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoCard elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <IconButton sx={{ 
                        background: `linear-gradient(135deg, ${roleColors[0]} 0%, ${roleColors[1]} 100%)`,
                        color: 'white',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}>
                        <Badge />
                      </IconButton>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                        用户名
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      color: '#48484A',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      ml: 7,
                    }}>
                      {userInfo.username}
                    </Typography>
                  </InfoCard>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <InfoCard elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <IconButton sx={{ 
                        background: 'linear-gradient(135deg, #FF2D92 0%, #AF52DE 100%)',
                        color: 'white',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}>
                        <Wc />
                      </IconButton>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                        性别
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      color: '#48484A',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      ml: 7,
                    }}>
                      {userInfo.gender === 'male' ? '👨 男性' : '👩 女性'}
                    </Typography>
                  </InfoCard>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <InfoCard elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <IconButton sx={{ 
                        background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
                        color: 'white',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}>
                        <Cake />
                      </IconButton>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                        年龄
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      color: '#48484A',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      ml: 7,
                    }}>
                      {userInfo.age} 岁
                    </Typography>
                  </InfoCard>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <InfoCard elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <IconButton sx={{ 
                        background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                        color: 'white',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}>
                        <Business />
                      </IconButton>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                        所属单位
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      color: '#48484A',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      ml: 7,
                    }}>
                      {userInfo.unit}
                    </Typography>
                  </InfoCard>
                </Grid>
              </Grid>

              {/* 操作按钮 */}
              <Box sx={{ 
                mt: 4, 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <AppleButton 
                  variant="primary"
                  startIcon={<Edit />}
                  sx={{ minWidth: 140 }}
                >
                  编辑资料
                </AppleButton>
                <AppleButton 
                  variant="secondary"
                  startIcon={<Settings />}
                  sx={{ minWidth: 140 }}
                >
                  账户设置
                </AppleButton>
                <AppleButton 
                  variant="danger"
                  startIcon={<Logout />}
                  sx={{ minWidth: 140 }}
                  onClick={() => {
                    if (window.confirm('确定要退出登录吗？')) {
                      localStorage.removeItem('userInfo');
                      window.location.href = '/login';
                    }
                  }}
                >
                  退出登录
                </AppleButton>
              </Box>
            </CardContent>
          </ProfileCard>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UserInfoPage;


