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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function BlankPage() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [lastError, setLastError] = useState(null); // 新增状态来存储详细错误

  const [selectedFile, setSelectedFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // 添加图片预览状态

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
      
      // 创建图片预览URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImageError("请选择 JPG 或 PNG 格式的图片");
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  // 在组件卸载时清理预览URL
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
      // 将图片转换为base64编码
      const fileReader = new FileReader();
      
      fileReader.onloadend = async () => {
        try {
          const base64Image = fileReader.result;
          
          // 使用Kimi视觉API进行图像识别
          const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer sk-c0oTwzXO874NWG0Ud0nh1SbRKjdhbfNSsCTa98RxyIHpUbzU`,
            },
            body: JSON.stringify({
              model: "moonshot-v1-8k-vision-preview", // 使用支持视觉的模型
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

      // 开始读取文件，转换为 base64
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

    // 验证输入
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
    setLastError(null); // 清除之前的错误

    try {
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: 'sk-b291c497c51f4a8583434f43cfa9c662', // 您的 API 密钥
        dangerouslyAllowBrowser: true // 在浏览器环境中使用时建议添加
      });

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userInput }
        ],
        model: "deepseek-chat",
        stream: false // 确保 stream 为 false，与 Python 示例一致
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
      console.error('调用API出错:', error); // 这会在浏览器控制台打印详细错误
      // 尝试提取更具体的错误信息
      let detailedErrorMessage = '抱歉，请求处理过程中出现错误，请稍后再试。';
      if (error.response) { // Axios-like error structure
        detailedErrorMessage += ` (Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)})`;
      } else if (error.message) {
        detailedErrorMessage += ` (${error.message})`;
      }
      setLastError(detailedErrorMessage); // 存储详细错误信息以供显示

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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          AI 交互页面
        </Typography>

        {/* 鱼类生长预测部分 */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            鱼类生长预测
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">
              请输入三个周期的体长数据（单位：cm）
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {['period1', 'period2', 'period3'].map((period, index) => (
                <TextField
                  key={period}
                  label={`第${index + 1}周期体长`}
                  type="number"
                  value={lengthInputs[period]}
                  onChange={(e) => handleLengthInputChange(period, e.target.value)}
                  inputProps={{ step: "0.1" }}
                />
              ))}
            </Box>
            <Button
              variant="contained"
              onClick={handlePrediction}
              disabled={!Object.values(lengthInputs).every(Boolean)}
            >
              预测下一周期
            </Button>
            {predictionError && (
              <Alert severity="error">{predictionError}</Alert>
            )}
            {predictionResult && (
              <Alert severity="success">
                预测的第四个周期体长为: {predictionResult.predicted_length.toFixed(2)} cm
              </Alert>
            )}
          </Box>
        </Paper>

        {/* 图片上传部分 */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            海洋生物图像识别
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              选择图片
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2">
                已选择: {selectedFile.name}
              </Typography>
            )}
            
            {/* 添加图片预览 */}
            {imagePreview && (
              <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="图片预览" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '4px'
                  }} 
                />
              </Box>
            )}
            
            {imageError && (
              <Alert severity="error">{imageError}</Alert>
            )}
            <Button
              variant="contained"
              onClick={handleImageUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? <CircularProgress size={24} /> : '开始识别'}
            </Button>
            {imageResult && (
              <Alert severity="success">
                识别结果: {imageResult.species || '未知物种'}
              </Alert>
            )}
          </Box>
        </Paper>

        {/* 显示详细错误信息给用户 */}
        {lastError && (
          <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="body2">错误详情: {lastError}</Typography>
          </Paper>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="请输入您的问题"
              variant="outlined"
              value={userInput}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              multiline
              rows={3}
              disabled={isLoading}
            />
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
              disabled={isLoading || !userInput.trim()}
              sx={{ float: 'right' }}
            >
              {isLoading ? <CircularProgress size={24} /> : '提交问题'}
            </Button>
          </form>
        </Paper>

        {conversations.length > 0 && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              对话历史
            </Typography>
            <List>
              {conversations.map((conv, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                    <Box sx={{ width: '100%', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        您的问题:
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {conv.question}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        DeepSeek 回复:
                      </Typography>
                      {index === conversations.length - 1 && !conv.answer && isLoading ? (
                        <CircularProgress size={20} sx={{ ml: 1 }} />
                      ) : (
                        <Typography 
                          variant="body1" 
                          paragraph 
                          sx={{ whiteSpace: 'pre-wrap', color: conv.answer.startsWith('抱歉') || conv.answer.startsWith('错误详情') ? 'error.main' : 'text.primary' }}
                        >
                          {conv.answer || '等待回复...'}
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                  {index < conversations.length - 1 && (
                    <Divider variant="middle" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default BlankPage;
