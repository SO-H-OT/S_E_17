import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const navigate = useNavigate();  // 初始化 navigate

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      // 正确处理后端返回的数据格式：{success: true, data: [...用户数组]}
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        setUsers([]);
        console.error('API返回的数据格式不符合预期:', response.data);
        setError('获取用户数据格式不正确');
      }
    } catch (err) {
      setUsers([]);
      setError('获取用户数据失败: ' + err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 删除用户
  const handleDelete = async (username) => {
    const currentUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!currentUser || currentUser.role !== 'admin') {
      alert('只有管理员才能删除用户');
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/users/${username}`, {
        data: {
          username: currentUser.username,
          role: currentUser.role
        }
      });
      alert(response.data.message);
      fetchUsers();  // 刷新用户列表
    } catch (error) {
      if (error.response && error.response.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('删除失败，请稍后重试');
      }
    }
  };

  // 修改用户（示意跳转）
  const handleEdit = (username) => {
    const currentUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!currentUser || currentUser.role !== 'admin') {
      alert('只有管理员才能修改用户信息');
      return;
    }

    alert(`跳转到修改页面，用户用户名: ${username}`);
    // 跳转到编辑页面
    navigate(`/edit-user/${username}`);
  };

  if (error) return <div>{error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>用户信息列表</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用户名</TableCell>
              <TableCell>性别</TableCell>
              <TableCell>年龄</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>单位</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map(user => (
                <TableRow key={user.username}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.gender}</TableCell>
                  <TableCell>{user.age}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.unit}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleEdit(user.username)}
                      >
                        修改
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(user.username)}
                      >
                        删除
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">暂无用户数据</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default UserListPage;




