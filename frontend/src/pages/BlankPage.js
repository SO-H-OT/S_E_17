import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  Divider, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Fab,
  LinearProgress
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  CloudUpload, Send, Psychology, ImageSearch, Analytics, 
  SmartToy, TrendingUp, Camera, Chat, AutoAwesome, Insights
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

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
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
  borderRadius: '20px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  animation: `${slideInUp} 0.8s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
    animation: `${pulse} 2s ease-in-out infinite`,
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
  ...(variant === 'success' && {
    background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
    color: 'white',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(135deg, #28A745 0%, #1F7A32 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(52, 199, 89, 0.3)',
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
}));

const SmartTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      border: '1px solid rgba(0, 122, 255, 0.3)',
    },
    '&:hover fieldset': {
      border: '1px solid rgba(0, 122, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      border: '2px solid #007AFF',
      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#8E8E93',
    fontWeight: 600,
    '&.Mui-focused': {
      color: '#007AFF',
    },
  },
  '& .MuiInputBase-input': {
    color: '#1D1D1F',
    fontWeight: 500,
  },
}));

const MessageBubble = styled(Box)(({ isuser }) => ({
  background: isuser 
    ? 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)'
    : 'rgba(255, 255, 255, 0.9)',
  color: isuser ? 'white' : '#1D1D1F',
  padding: '12px 16px',
  borderRadius: isuser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  maxWidth: '80%',
  alignSelf: isuser ? 'flex-end' : 'flex-start',
  marginBottom: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  border: isuser ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
  animation: `${slideInUp} 0.3s ease-out`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  animation: `${shimmer} 2s infinite linear`,
  backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
  backgroundSize: '200% 100%',
}));

function BlankPage() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [lastError, setLastError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [lengthInputs, setLengthInputs] = useState({
    period1: '',
    period2: '',
    period3: ''
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setSelectedFile(file);
      setImageError(null);
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImageError("请选择 JPG 或 PNG 格式的图片");
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImageError(null);

    try {
      const fileReader = new FileReader();
      
      fileReader.onloadend = async () => {
        try {
          const base64Image = fileReader.result;
          
          const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer sk-c0oTwzXO874NWG0Ud0nh1SbRKjdhbfNSsCTa98RxyIHpUbzU`,
            },
            body: JSON.stringify({
              model: "moonshot-v1-8k-vision-preview",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: {
                        url: base64Image
                      }
                    },
                    {
                      type: "text",
                      text: "这张图片中是什么海洋生物？请进行识别并简要描述其特点。注意只输出文本内容，不要使用md格式的修饰。"
                    }
                  ]
                }
              ],
              temperature: 0.3
            })
          });

          if (!response.ok) {
            throw new Error(`识别失败! 状态码: ${response.status}`);
          }

          const result = await response.json();
          console.log("Kimi 识别响应:", result);

          if (result.choices && result.choices.length > 0) {
            setImageResult({
              species: result.choices[0].message.content,
            });
          } else {
            throw new Error('识别结果解析失败');
          }
        } catch (error) {
          console.error('处理失败:', error);
          setImageError('处理失败: ' + (error.message || '未知错误'));
        } finally {
          setIsUploading(false);
        }
      };

      fileReader.onerror = () => {
        setImageError('文件读取失败');
        setIsUploading(false);
      };

      fileReader.readAsDataURL(selectedFile);
    } catch (error) {
      setImageError('上传失败: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleLengthInputChange = (period, value) => {
    setLengthInputs(prev => ({
      ...prev,
      [period]: value
    }));
  };

  const handlePrediction = async () => {
    setPredictionError(null);
    setPredictionResult(null);

    const values = Object.values(lengthInputs);
    if (!values.every(v => v && !isNaN(v))) {
      setPredictionError("请输入三个有效的数字");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/predict-length', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periods: [
            parseFloat(lengthInputs.period1),
            parseFloat(lengthInputs.period2),
            parseFloat(lengthInputs.period3)
          ]
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPredictionResult(result.data);
      } else {
        setPredictionError(result.error);
      }
    } catch (error) {
      setPredictionError('预测失败: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) return;
    
    const newConversation = {
      question: userInput,
      answer: '',
      timestamp: new Date().toISOString()
    };
    
    setConversations(prev => [...prev, newConversation]);
    setIsLoading(true);
    setLastError(null);

    try {
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: 'sk-b291c497c51f4a8583434f43cfa9c662',
        dangerouslyAllowBrowser: true
      });

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userInput }
        ],
        model: "deepseek-chat",
        stream: false
      });
      
      if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
        setConversations(prevConversations => {
          const updatedConversations = [...prevConversations];
          updatedConversations[updatedConversations.length - 1].answer = 
            completion.choices[0].message.content;
          return updatedConversations;
        });
      } else {
        console.error('API响应格式无效:', completion);
        setLastError('API响应格式无效，未找到有效的回复内容。');
        throw new Error('无法获取有效回复或回复格式不正确');
      }
    } catch (error) {
      console.error('调用API出错:', error);
      let detailedErrorMessage = '抱歉，请求处理过程中出现错误，请稍后再试。';
      if (error.response) {
        detailedErrorMessage += ` (Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)})`;
      } else if (error.message) {
        detailedErrorMessage += ` (${error.message})`;
      }
      setLastError(detailedErrorMessage);

      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        updatedConversations[updatedConversations.length - 1].answer = detailedErrorMessage;
        return updatedConversations;
      });
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f7fafc 0%, #e6fffa 50%, #f0fff4 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2338bdf8" fill-opacity="0.04"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.8,
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          mb: 4,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #134e4a 0%, #1e40af 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          animation: `${fadeIn} 0.8s ease-out`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <SmartToy sx={{ fontSize: 40, color: '#007AFF', animation: `${float} 3s ease-in-out infinite` }} />
          🤖 AI 智能交互中心
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* AI 对话功能 */}
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Chat sx={{ 
                  fontSize: 40, 
                  color: '#007AFF',
                  mb: 2,
                  animation: `${float} 3s ease-in-out infinite`,
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}>
                  智能对话
                </Typography>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                  与 DeepSeek AI 进行自然语言交流
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>

          {/* 图像识别功能 */}
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <ImageSearch sx={{ 
                  fontSize: 40, 
                  color: '#34C759',
                  mb: 2,
                  animation: `${float} 3s ease-in-out infinite 0.5s`,
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}>
                  图像识别
                </Typography>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                  海洋生物智能识别与分析
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>

          {/* 生长预测功能 */}
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TrendingUp sx={{ 
                  fontSize: 40, 
                  color: '#FF9500',
                  mb: 2,
                  animation: `${float} 3s ease-in-out infinite 1s`,
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}>
                  生长预测
                </Typography>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                  鱼类生长趋势智能预测
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* 鱼类生长预测部分 */}
          <Grid item xs={12} lg={6}>
            <GlassCard>
              <CardHeader
                avatar={
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
                    animation: `${pulse} 2s ease-in-out infinite`,
                  }}>
                    <Analytics />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FF9500 0%, #FF6D00 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    📈 鱼类生长预测
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                    基于AI模型的智能生长趋势分析
                  </Typography>
                }
              />
              <CardContent>
                <Typography variant="body2" sx={{ mb: 3, color: '#8E8E93', fontWeight: 500 }}>
                  请输入三个周期的体长数据（单位：cm）
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {['period1', 'period2', 'period3'].map((period, index) => (
                    <Grid item xs={12} sm={4} key={period}>
                      <SmartTextField
                        fullWidth
                        label={`第${index + 1}周期体长`}
                        type="number"
                        value={lengthInputs[period]}
                        onChange={(e) => handleLengthInputChange(period, e.target.value)}
                        inputProps={{ step: "0.1" }}
                        size="small"
                      />
                    </Grid>
                  ))}
                </Grid>
                <AppleButton
                  variant="success"
                  onClick={handlePrediction}
                  disabled={!Object.values(lengthInputs).every(Boolean)}
                  startIcon={<Insights />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  开始预测
                </AppleButton>
                {predictionError && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: '12px',
                      background: 'rgba(255, 59, 48, 0.1)',
                      border: '1px solid rgba(255, 59, 48, 0.2)',
                    }}
                  >
                    {predictionError}
                  </Alert>
                )}
                {predictionResult && (
                  <Alert 
                    severity="success"
                    sx={{ 
                      borderRadius: '12px',
                      background: 'rgba(52, 199, 89, 0.1)',
                      border: '1px solid rgba(52, 199, 89, 0.2)',
                    }}
                  >
                    🎯 预测结果：第四个周期体长为 <strong>{predictionResult.predicted_length.toFixed(2)} cm</strong>
                  </Alert>
                )}
              </CardContent>
            </GlassCard>
          </Grid>

          {/* 图片上传部分 */}
          <Grid item xs={12} lg={6}>
            <GlassCard>
              <CardHeader
                avatar={
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                    animation: `${pulse} 2s ease-in-out infinite`,
                  }}>
                    <Camera />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    🔍 海洋生物图像识别
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                    基于 Kimi 视觉模型的智能识别
                  </Typography>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <AppleButton
                    variant="secondary"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    选择图片文件
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                    />
                  </AppleButton>
                  
                  {selectedFile && (
                    <Chip 
                      label={`已选择: ${selectedFile.name}`}
                      sx={{
                        background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  
                  {imagePreview && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      mb: 2,
                    }}>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="图片预览"
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      />
                    </Box>
                  )}
                  
                  {imageError && (
                    <Alert 
                      severity="error"
                      sx={{ 
                        borderRadius: '12px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.2)',
                      }}
                    >
                      {imageError}
                    </Alert>
                  )}
                  
                  <AppleButton
                    variant="success"
                    onClick={handleImageUpload}
                    disabled={!selectedFile || isUploading}
                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                    fullWidth
                  >
                    {isUploading ? '识别中...' : '开始识别'}
                  </AppleButton>
                  
                  {imageResult && (
                    <Alert 
                      severity="success"
                      sx={{ 
                        borderRadius: '12px',
                        background: 'rgba(52, 199, 89, 0.1)',
                        border: '1px solid rgba(52, 199, 89, 0.2)',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        🐟 识别结果：
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {imageResult.species || '未知物种'}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>

        {/* AI 对话部分 */}
        <GlassCard sx={{ mt: 3 }}>
          <CardHeader
            avatar={
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                animation: `${pulse} 2s ease-in-out infinite`,
              }}>
                <Psychology />
              </Avatar>
            }
            title={
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                💬 AI 智能对话
              </Typography>
            }
            subheader={
              <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 500 }}>
                与 DeepSeek AI 模型进行智能交流
              </Typography>
            }
          />
          <CardContent>
            {lastError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '12px',
                  background: 'rgba(255, 59, 48, 0.1)',
                  border: '1px solid rgba(255, 59, 48, 0.2)',
                }}
              >
                <Typography variant="body2">
                  <strong>错误详情：</strong>{lastError}
                </Typography>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <SmartTextField
                fullWidth
                label="请输入您的问题"
                variant="outlined"
                value={userInput}
                onChange={handleInputChange}
                multiline
                rows={3}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <AppleButton 
                  variant="primary"
                  type="submit"
                  disabled={isLoading || !userInput.trim()}
                  startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Send />}
                >
                  {isLoading ? '思考中...' : '发送问题'}
                </AppleButton>
              </Box>
            </Box>

            {conversations.length > 0 && (
              <GlassCard sx={{ 
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(15px)',
                maxHeight: '400px',
                overflow: 'auto',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ 
                    mb: 3,
                    fontWeight: 700,
                    color: '#1D1D1F',
                  }}>
                    📝 对话历史
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {conversations.map((conv, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        {/* 用户消息 */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                          <MessageBubble isuser={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              您的问题
                            </Typography>
                            <Typography variant="body1">
                              {conv.question}
                            </Typography>
                          </MessageBubble>
                        </Box>
                        
                        {/* AI回复 */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                          {index === conversations.length - 1 && !conv.answer && isLoading ? (
                            <LoadingContainer>
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#8E8E93' }}>
                                AI 正在思考中...
                              </Typography>
                            </LoadingContainer>
                          ) : (
                            <MessageBubble isuser={0}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#007AFF' }}>
                                DeepSeek AI
                              </Typography>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  whiteSpace: 'pre-wrap',
                                  color: conv.answer.startsWith('抱歉') || conv.answer.startsWith('错误详情') ? '#FF3B30' : '#1D1D1F',
                                }}
                              >
                                {conv.answer || '等待回复...'}
                              </Typography>
                            </MessageBubble>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </GlassCard>
            )}
          </CardContent>
        </GlassCard>
      </Container>
    </Box>
  );
}

export default BlankPage;
