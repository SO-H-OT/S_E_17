import React, { useState } from "react";
import { TextField, Button, Container, Typography, Paper, Box } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';

import axios from "axios";

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    gender: "",
    age: "",
    role: "",
    unit: "",
  });
  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username: formData.username,
        password: formData.password,
      });
      if (response.data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        // 使用直接的页面跳转确保刷新状态
        window.location.replace('/');
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage("登录失败，请重试");
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/register",
        formData
      );
      if (response.data.success) {
        setIsLogin(true);
        setMessage("注册成功，您可以登录了");
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage("注册失败，请重试");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #e3f2fd, #ffffff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ padding: 4, borderRadius: 3 }}>
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            {isLogin ? "登录系统" : "注册账号"}
          </Typography>

          <TextField
            label="用户名"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />

          <TextField
            label="密码"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />

          {!isLogin && (
            <>
              <TextField
                label="性别"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />

              <TextField
                label="年龄"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />

             <TextField
                select
                label="角色"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              >
                <MenuItem value="admin">admin</MenuItem>
                <MenuItem value="user">user</MenuItem>
              </TextField>

              <TextField
                label="单位"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </>
          )}

          {message && (
            <Typography
              variant="body2"
              color="error"
              align="center"
              sx={{ mt: 1 }}
            >
              {message}
            </Typography>
          )}

          <Button
            onClick={isLogin ? handleLogin : handleRegister}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, py: 1.5 }}
          >
            {isLogin ? "立即登录" : "立即注册"}
          </Button>

          <Button
            onClick={() => setIsLogin(!isLogin)}
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
          >
            {isLogin ? "没有账号？点击注册" : "已有账号？点击登录"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;


