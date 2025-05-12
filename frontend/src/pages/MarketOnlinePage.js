import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Typography, Box, Grid 
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../services/api';

function MarketOnlinePage() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getOnlineMarketData();
        if (response.success && response.data && response.data.list) {
          setMarketData(response.data.list);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>新发地市场实时价格</Typography>
      
      {/* 数据表格 */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>商品名称</TableCell>
              <TableCell>类别</TableCell>
              <TableCell>最低价</TableCell>
              <TableCell>最高价</TableCell>
              <TableCell>平均价</TableCell>
              <TableCell>产地</TableCell>
              <TableCell>规格</TableCell>
              <TableCell>单位</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marketData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.prodName}</TableCell>
                <TableCell>{item.prodCat}</TableCell>
                <TableCell>{item.lowPrice}</TableCell>
                <TableCell>{item.highPrice}</TableCell>
                <TableCell>{item.avgPrice}</TableCell>
                <TableCell>{item.place}</TableCell>
                <TableCell>{item.specInfo}</TableCell>
                <TableCell>{item.unitInfo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 价格统计图 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>价格分布</Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={marketData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="prodName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lowPrice" fill="#8884d8" name="最低价" />
                  <Bar dataKey="highPrice" fill="#82ca9d" name="最高价" />
                  <Bar dataKey="avgPrice" fill="#ffc658" name="平均价" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default MarketOnlinePage;
