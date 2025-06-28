import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Typography, Box, Grid, Card, CardContent,
  CardHeader, Chip, CircularProgress, Alert
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Store, LocalOffer, Assessment } from '@mui/icons-material';
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
  borderRadius: '20px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
  },
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
    animation: `${float} 3s ease-in-out infinite`,
  },
}));

const StatusChip = styled(Chip)(({ pricetype }) => ({
  borderRadius: '20px',
  fontWeight: 700,
  fontSize: '0.8rem',
  ...(pricetype === 'high' && {
    background: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
    color: 'white',
  }),
  ...(pricetype === 'medium' && {
    background: 'linear-gradient(135deg, #FF9500 0%, #FFCC02 100%)',
    color: 'white',
  }),
  ...(pricetype === 'low' && {
    background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
    color: 'white',
  }),
}));

function MarketOnlinePage() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    avgPrice: 0,
    categories: 0,
    priceRange: { min: 0, max: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getOnlineMarketData();
        if (response.success && response.data && response.data.list) {
          const data = response.data.list;
          setMarketData(data);
          
          // 计算统计数据
          const prices = data.map(item => parseFloat(item.avgPrice)).filter(p => !isNaN(p));
          const categories = [...new Set(data.map(item => item.prodCat))];
          
          setStats({
            totalProducts: data.length,
            avgPrice: prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : 0,
            categories: categories.length,
            priceRange: {
              min: prices.length ? Math.min(...prices).toFixed(2) : 0,
              max: prices.length ? Math.max(...prices).toFixed(2) : 0
            }
          });
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPriceType = (price) => {
    const p = parseFloat(price);
    if (p > 20) return 'high';
    if (p > 10) return 'medium';
    return 'low';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafb 0%, #e3f2fd 50%, #f5f7fa 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2390caf9" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.6,
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          mb: 4,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          animation: `${fadeIn} 0.8s ease-out`,
        }}>
          🛒 新发地市场实时价格监控
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
                    <Store sx={{ 
                      fontSize: 40, 
                      color: '#007AFF',
                      mb: 1,
                      animation: `${float} 3s ease-in-out infinite`,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      商品总数
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <TrendingUp sx={{ 
                      fontSize: 40, 
                      color: '#34C759',
                      mb: 1,
                      animation: `${float} 3s ease-in-out infinite 0.5s`,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      ¥{stats.avgPrice}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      平均价格
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <LocalOffer sx={{ 
                      fontSize: 40, 
                      color: '#FF9500',
                      mb: 1,
                      animation: `${float} 3s ease-in-out infinite 1s`,
                    }} />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      {stats.categories}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      商品类别
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Assessment sx={{ 
                      fontSize: 40, 
                      color: '#AF52DE',
                      mb: 1,
                      animation: `${float} 3s ease-in-out infinite 1.5s`,
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D92 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}>
                      ¥{stats.priceRange.min} - ¥{stats.priceRange.max}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                      价格区间
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
            </Grid>

            {/* 数据表格 */}
            <GlassCard sx={{ mb: 4 }}>
              <CardHeader
                title={
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    📊 实时价格详情
                  </Typography>
                }
              />
              <CardContent>
                <TableContainer sx={{ 
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  maxHeight: 500,
                  overflow: 'auto',
                }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {[
                          '商品名称', '类别', '最低价', '最高价', '平均价', 
                          '产地', '规格', '单位'
                        ].map((header, index) => (
                          <TableCell 
                            key={header}
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
                      {marketData.map((item, index) => (
                        <TableRow 
                          key={item.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(0, 122, 255, 0.1)',
                              transform: 'scale(1.01)',
                            },
                            transition: 'all 0.2s ease',
                            animation: `${slideInUp} 0.8s ease-out ${index * 0.05}s both`,
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#1D1D1F' }}>
                            {item.prodName}
                          </TableCell>
                          <TableCell>
                            <StatusChip 
                              label={item.prodCat}
                              size="small"
                              pricetype="medium"
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#34C759' }}>
                            ¥{item.lowPrice}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#FF3B30' }}>
                            ¥{item.highPrice}
                          </TableCell>
                          <TableCell>
                            <StatusChip 
                              label={`¥${item.avgPrice}`}
                              size="small"
                              pricetype={getPriceType(item.avgPrice)}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#8E8E93' }}>
                            {item.place}
                          </TableCell>
                          <TableCell sx={{ color: '#8E8E93' }}>
                            {item.specInfo}
                          </TableCell>
                          <TableCell sx={{ color: '#8E8E93' }}>
                            {item.unitInfo}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </GlassCard>

            {/* 价格统计图 */}
            <GlassCard>
              <CardHeader
                title={
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    📈 价格分布图表
                  </Typography>
                }
              />
              <CardContent>
                <Box sx={{ 
                  width: '100%', 
                  height: 400,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  p: 2,
                }}>
                  <ResponsiveContainer>
                    <BarChart data={marketData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(142, 142, 147, 0.3)" />
                      <XAxis 
                        dataKey="prodName" 
                        tick={{ fontSize: 12, fill: '#1D1D1F' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#1D1D1F' }} />
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="lowPrice" fill="#34C759" name="最低价" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="highPrice" fill="#FF3B30" name="最高价" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgPrice" fill="#007AFF" name="平均价" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </GlassCard>
          </>
        )}
      </Container>
    </Box>
  );
}

export default MarketOnlinePage;
