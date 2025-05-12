import React, { useRef, useState } from 'react';
import { Container, Paper, Typography, CircularProgress } from '@mui/material';

function VideoPage() {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError('视频加载失败');
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>视频播放</Typography>
      <Paper sx={{ p: 2, position: 'relative', minHeight: '400px' }}>
        {loading && (
          <CircularProgress 
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
        {error && (
          <Typography 
            color="error" 
            sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {error}
          </Typography>
        )}
        <video
          ref={videoRef}
          width="100%"
          height="auto"
          controls
          onCanPlay={handleCanPlay}
          onError={handleError}
          style={{ 
            maxHeight: '70vh',
            display: loading ? 'none' : 'block'
          }}
        >
          <source src="http://localhost:5000/api/video/11月21日.mp4" type="video/mp4" />
          您的浏览器不支持视频播放
        </video>
      </Paper>
    </Container>
  );
}

export default VideoPage;
