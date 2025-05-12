import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import HomePage from './pages/HomePage';
import SecondPage from './pages/SecondPage';
import MarketOnlinePage from './pages/MarketOnlinePage';
import WeatherPage from './pages/WeatherPage';
import VideoPage from './pages/VideoPage';
import UserListPage from './pages/UserListPage';
import EditUser from './pages/EditUsersPage';
import BlankPage from './pages/BlankPage';



function App() {

  const handleLogout = () => {
    localStorage.clear(); 
    window.location.replace('/');
  };

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            信息管理系统
          </Typography>
          <Button color="inherit" href="/">首页</Button>
          <Button color="inherit" href="/second">数据分析</Button>
          <Button color="inherit" href="/market-online">在线市场</Button>
          <Button color="inherit" href="/weather">天气预报</Button>
          <Button color="inherit" href="/video">视频播放</Button>
          <Button color="inherit" href="/user">用户列表</Button>
          <Button color="inherit" href="/blank">大模型交互</Button>
          <Button color="inherit" onClick={handleLogout}>退出登录</Button>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/second" element={<SecondPage />} />
        <Route path="/market-online" element={<MarketOnlinePage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/user" element={<UserListPage />} />
        <Route path="/edit-user/:username" element={<EditUser />} />
        <Route path="/blank" element={<BlankPage />} />
      </Routes>
    </Router>
  );
}

export default App;
