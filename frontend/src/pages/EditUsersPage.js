import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';

const EditUser = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    username: '',
    gender: '',
    age: '',
    role: '',
    unit: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/get_user/${username}`);
        if (response.data && response.data.user) {
          setUserData(response.data.user);
          setLoading(false);
        } else {
          setError('用户数据格式错误');
          setLoading(false);
        }
      } catch (err) {
        setError('获取用户数据失败');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!currentUser || currentUser.role !== 'admin') {
      alert('只有管理员才能修改用户信息');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/users/${username}`, {
        ...userData,
        operator_role: currentUser.role
      });

      if (currentUser.username === username) {
        const updatedUserInfo = {
          ...currentUser,
          gender: userData.gender,
          age: userData.age,
          role: userData.role,
          unit: userData.unit
        };
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      }

      alert('用户信息已更新');
      navigate('/user'); 
    } catch (error) {
      alert('更新失败: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>修改用户信息</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="用户名"
                name="username"
                fullWidth
                value={userData.username}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="性别"
                name="gender"
                fullWidth
                value={userData.gender}
                onChange={handleChange}
              >
                <MenuItem value="男">男</MenuItem>
                <MenuItem value="女">女</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="年龄"
                name="age"
                type="number"
                fullWidth
                value={userData.age}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="角色"
                name="role"
                fullWidth
                value={userData.role}
                onChange={handleChange}
              >
                <MenuItem value="admin">管理员</MenuItem>
                <MenuItem value="user">普通用户</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="单位"
                name="unit"
                fullWidth
                value={userData.unit}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth color="primary">
                保存修改
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditUser;



