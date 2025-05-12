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
  CircularProgress 
} from '@mui/material';

function BlankPage() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [lastError, setLastError] = useState(null); // 新增状态来存储详细错误

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
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
          DeepSeek AI 交互页面
        </Typography>

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
