import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, ScatterChart, Scatter,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { apiService } from '../services/api';

function SecondPage() {
  const [fishData, setFishData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取鱼类数据
  useEffect(() => {
    apiService.getFishStatistics()
      .then(response => setFishData(response.data))
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* 鱼类数据图表 */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>鱼类数据分析</Typography>
        </Grid>

        {/* 鱼类数量分布图 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">鱼类数量分布</Typography>
            <PieChart width={400} height={300}>
              <Pie 
                data={fishData?.species_count ? Object.entries(fishData.species_count).map(([name, value]) => ({
                  name, value
                })) : []}
                dataKey="value"
                nameKey="name"
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </Paper>
        </Grid>

        {/* 平均重量对比图 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">各类鱼平均重量</Typography>
            <BarChart width={400} height={300} 
              data={fishData?.weight_avg ? Object.entries(fishData.weight_avg).map(([name, value]) => ({
                name, value: Math.round(value)
              })) : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </Paper>
        </Grid>

        {/* 鱼类年龄分布图表*/}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">鱼类年龄分布</Typography>
            <BarChart width={400} height={300} data={[
              {age: '0-1', count: 120},
              {age: '1-2', count: 200},
              {age: '2-3', count: 150},
              {age: '3-4', count: 80},
              {age: '4-5', count: 40},
              {age: '5+', count: 15}
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#4CAF50" 
                name="鱼类数量" 
              />
            </BarChart>
          </Paper>
        </Grid>

        {/* 体型比例图 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">鱼类体型比例</Typography>
            <BarChart width={400} height={300}
              data={fishData?.proportion ? Object.entries(fishData.proportion).map(([name, value]) => ({
                name, value: Math.round(value * 100) / 100
              })) : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ffc658" />
            </BarChart>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SecondPage;
