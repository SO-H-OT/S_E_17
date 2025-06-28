import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Container,
  Fade,
  Avatar,
  useScrollTrigger,
  Slide
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Home,
  Analytics,
  CloudUpload,
  Store,
  Cloud,
  PlayCircle,
  People,
  PersonOutline,
  SmartToy,
  ExitToApp,
  Waves
} from '@mui/icons-material';
import HomePage from './pages/HomePage';
import SecondPage from './pages/SecondPage';
import MarketOnlinePage from './pages/MarketOnlinePage';
import WeatherPage from './pages/WeatherPage';
import VideoPage from './pages/VideoPage';
import UserListPage from './pages/UserListPage';
import EditUser from './pages/EditUsersPage';
import BlankPage from './pages/BlankPage';
import UserInfoPage from './pages/UserInfoPage';
import DataUploadPage from './pages/DataUploadPage';

// 海洋系动画定义
const waveAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const fadeInSlide = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// 海洋系导航栏
const OceanAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 25%, #81d4fa 50%, #4fc3f7 75%, #29b6f6 100%)',
  backgroundSize: '400% 400%',
  animation: `${waveAnimation} 8s ease-in-out infinite`,
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(41, 182, 246, 0.15)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.6,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
    transform: 'translateX(-100%)',
    animation: `${fadeInSlide} 3s ease-in-out infinite`,
  }
}));

// 海洋系品牌标题
const OceanBrand = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  fontSize: '1.5rem',
  background: 'linear-gradient(135deg, #0c4a6e 0%, #155e75 50%, #0e7490 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  position: 'relative',
  zIndex: 2,
  whiteSpace: 'nowrap',
  flexDirection: 'row',
  writingMode: 'horizontal-tb',
  animation: `${fadeInSlide} 1s ease-out`,
  '&:hover': {
    transform: 'scale(1.05)',
    transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  }
}));

// 海洋系导航按钮
const OceanNavButton = styled(Button)(({ theme, active }) => ({
  borderRadius: '25px',
  padding: '10px 24px',
  margin: '0 2px',
  minWidth: '120px',
  fontWeight: 600,
  fontSize: '0.9rem',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  zIndex: 2,
  background: active 
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
    : 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: active ? '#0c4a6e' : '#0e7490',
  boxShadow: active 
    ? '0 4px 15px rgba(255, 255, 255, 0.3)'
    : '0 2px 8px rgba(14, 116, 144, 0.1)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%)',
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 8px 25px rgba(255, 255, 255, 0.4)',
    color: '#0c4a6e',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '0',
      height: '0',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.5)',
      transform: 'translate(-50%, -50%)',
      animation: `${ripple} 0.6s linear`,
    }
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  }
}));

// 退出按钮特殊样式
const LogoutButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: '10px 24px',
  margin: '0 2px',
  minWidth: '120px',
  fontWeight: 600,
  fontSize: '0.9rem',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  zIndex: 2,
  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#dc2626',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.25)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
  }
}));

// 隐藏滚动时的导航栏
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    threshold: 100,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function App() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/');
  };

  // 获取并解析角色信息
  let role = null;
  let username = null;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    role = userInfo?.role || null;
    username = userInfo?.username || null;
  } catch (e) {
    console.error('解析用户信息失败：', e);
  }

  // 获取当前路径来确定活跃状态
  const currentPath = window.location.pathname;

  // 生成用户头像颜色
  const getAvatarGradient = (username) => {
    if (!username) return ['#29b6f6', '#0288d1'];
    const gradients = [
      ['#29b6f6', '#0288d1'],
      ['#26c6da', '#0097a7'],
      ['#66bb6a', '#388e3c'],
      ['#42a5f5', '#1976d2'],
      ['#ab47bc', '#7b1fa2']
    ];
    const index = username.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const avatarColors = getAvatarGradient(username);

  return (
    <Router>
      <HideOnScroll>
        <OceanAppBar position="fixed" elevation={0}>
          <Container maxWidth="xl">
            <Toolbar sx={{ 
              py: 1, 
              px: { xs: 0, sm: 2 },
              minHeight: '70px',
              position: 'relative',
              zIndex: 2
            }}>
                             {/* 品牌标识 */}
               <OceanBrand sx={{ flexGrow: 1, mr: 2 }}>
                 <Waves sx={{ 
                   fontSize: 32, 
                   color: '#0c4a6e',
                   animation: `${waveAnimation} 2s ease-in-out infinite`,
                 }} />
                 智慧海洋牧场系统
               </OceanBrand>

              {/* 导航菜单 */}
                             <Box sx={{ 
                 display: { xs: 'none', md: 'flex' }, 
                 alignItems: 'center',
                 gap: 1,
                 position: 'relative',
                 zIndex: 2
               }}>
                 <Fade in timeout={800}>
                   <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
                    <OceanNavButton 
                      href="/" 
                      startIcon={<Home />}
                      active={currentPath === '/'}
                    >
                      首页
                    </OceanNavButton>
                    
                    <OceanNavButton 
                      href="/second"
                      startIcon={<Analytics />}
                      active={currentPath === '/second'}
                    >
                      数据分析
                    </OceanNavButton>
                    
                    <OceanNavButton 
                      href="/upload"
                      startIcon={<CloudUpload />}
                      active={currentPath === '/upload'}
                    >
                      数据上传
                    </OceanNavButton>
                    
                    <OceanNavButton 
                      href="/market-online"
                      startIcon={<Store />}
                      active={currentPath === '/market-online'}
                    >
                      在线市场
                    </OceanNavButton>
                    
                    <OceanNavButton 
                      href="/weather"
                      startIcon={<Cloud />}
                      active={currentPath === '/weather'}
                    >
                      天气预报
                    </OceanNavButton>
                    
                    <OceanNavButton 
                      href="/video"
                      startIcon={<PlayCircle />}
                      active={currentPath === '/video'}
                    >
                      视频播放
                    </OceanNavButton>

                    {/* 仅 admin 可见 */}
                    {role === 'admin' && (
                      <OceanNavButton 
                        href="/user"
                        startIcon={<People />}
                        active={currentPath === '/user'}
                      >
                        用户列表
                      </OceanNavButton>
                    )}

                    {/* admin 和 user 都可见 */}
                    {(role === 'admin' || role === 'user') && (
                      <OceanNavButton 
                        href="/userinfo"
                        startIcon={<PersonOutline />}
                        active={currentPath === '/userinfo'}
                      >
                        个人信息
                      </OceanNavButton>
                    )}

                    <OceanNavButton 
                      href="/blank"
                      startIcon={<SmartToy />}
                      active={currentPath === '/blank'}
                    >
                      AI交互
                    </OceanNavButton>
                  </Box>
                </Fade>

                                 {/* 用户头像和退出按钮 */}
                 <Box sx={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: 2, 
                   ml: 1,
                   pl: 2,
                   borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                   flexShrink: 0
                 }}>
                  {username && (
                    <Fade in timeout={1000}>
                      <Avatar sx={{ 
                        background: `linear-gradient(135deg, ${avatarColors[0]} 0%, ${avatarColors[1]} 100%)`,
                        width: 40, 
                        height: 40,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                        }
                      }}>
                        {username.charAt(0).toUpperCase()}
                      </Avatar>
                    </Fade>
                  )}
                  
                  <LogoutButton 
                    startIcon={<ExitToApp />}
                    onClick={handleLogout}
                  >
                    退出登录
                  </LogoutButton>
                </Box>
              </Box>
            </Toolbar>
          </Container>
        </OceanAppBar>
      </HideOnScroll>

      {/* 为固定导航栏添加顶部边距 */}
      <Box sx={{ height: 70 }} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/second" element={<SecondPage />} />
        <Route path="/upload" element={<DataUploadPage />} />
        <Route path="/market-online" element={<MarketOnlinePage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/user" element={<UserListPage />} />
        <Route path="/edit-user/:username" element={<EditUser />} />
        <Route path="/blank" element={<BlankPage />} />
        <Route path="/userinfo" element={<UserInfoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
