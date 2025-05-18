import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Divider,
  Box
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

function UserInfoPage() {
  let userInfo = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo'));
  } catch (e) {
    console.error("用户信息解析失败：", e);
  }

  if (!userInfo) {
    return (
      <Typography variant="h6" sx={{ p: 4, textAlign: 'center' }}>
        暂无用户信息，请登录后查看。
      </Typography>
    );
  }

  return (
    <Grid container justifyContent="center" sx={{ mt: 8, px: 2 }}>
      <Grid item xs={12} sm={10} md={8} lg={6}>
        <Card sx={{ boxShadow: 5, borderRadius: 4, p: 4 }}>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 80, height: 80 }}>
                <PersonIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h4" sx={{ mt: 2 }}>
                个人信息
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ px: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <strong>用户名：</strong> {userInfo.username}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <strong>年龄：</strong> {userInfo.age}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <strong>性别：</strong> {userInfo.gender}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <strong>角色：</strong> {userInfo.role}
              </Typography>
              <Typography variant="h6">
                <strong>单位：</strong> {userInfo.unit}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default UserInfoPage;


