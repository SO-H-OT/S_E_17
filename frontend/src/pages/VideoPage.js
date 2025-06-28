import React, { useRef, useState } from 'react';
import { 
  Container, Paper, Typography, CircularProgress, Box, Card, 
  CardContent, CardHeader, Alert, IconButton, LinearProgress 
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  PlayArrow, Pause, VolumeUp, VolumeOff, Fullscreen, 
  FullscreenExit, VideoLibrary, Refresh 
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

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(0, 122, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 122, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 20px rgba(0, 122, 255, 0.3);
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

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  animation: `${glow} 3s ease-in-out infinite`,
  '&:hover': {
    transform: 'scale(1.01)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  },
  transition: 'all 0.3s ease',
}));

const ControlButton = styled(IconButton)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  color: '#007AFF',
  margin: '0 4px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(0, 122, 255, 0.1)',
    transform: 'scale(1.1)',
    boxShadow: '0 8px 25px rgba(0, 122, 255, 0.3)',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

function VideoPage() {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleCanPlay = () => {
    setLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleError = () => {
    setError('视频加载失败，请检查网络连接或稍后重试');
    setLoading(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((currentTime / duration) * 100);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #dbeafe 50%, #e0f2fe 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2381c784" fill-opacity="0.04"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.8,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(129, 199, 132, 0.05) 0%, transparent 70%)',
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          mb: 4,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)',
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
          <VideoLibrary sx={{ fontSize: 40, color: '#007AFF' }} />
          🎬 海洋监测视频播放器
        </Typography>

        <GlassCard sx={{ mb: 3 }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                📽️ 当前播放：11月21日监测视频
              </Typography>
            }
            action={
              <ControlButton onClick={handleRetry} disabled={loading}>
                <Refresh />
              </ControlButton>
            }
          />
          <CardContent>
            <VideoContainer sx={{ minHeight: '500px' }}>
              {loading && (
                <LoadingContainer>
                  <CircularProgress 
                    size={60} 
                    sx={{ 
                      color: '#007AFF',
                      mb: 2,
                      animation: `${shimmer} 2s infinite linear`,
                    }} 
                  />
                  <Typography variant="body1" sx={{ 
                    color: '#007AFF',
                    fontWeight: 600,
                    mb: 1,
                  }}>
                    正在加载视频...
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#8E8E93',
                    textAlign: 'center',
                  }}>
                    请稍候，视频内容正在准备中
                  </Typography>
                </LoadingContainer>
              )}
              
              {error && (
                <LoadingContainer>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      background: 'rgba(255, 59, 48, 0.1)',
                      border: '1px solid rgba(255, 59, 48, 0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      color: '#FF3B30',
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    {error}
                  </Alert>
                  <ControlButton onClick={handleRetry} sx={{ mt: 1 }}>
                    <Refresh />
                  </ControlButton>
                </LoadingContainer>
              )}

              <video
                ref={videoRef}
                width="100%"
                height="auto"
                onCanPlay={handleCanPlay}
                onError={handleError}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ 
                  maxHeight: '70vh',
                  display: loading || error ? 'none' : 'block',
                  borderRadius: '12px',
                  outline: 'none',
                }}
              >
                <source src="http://localhost:5000/api/video/11月21日.mp4" type="video/mp4" />
                您的浏览器不支持视频播放
              </video>

              {/* 视频控制栏 */}
              {!loading && !error && (
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <ControlButton onClick={togglePlay}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </ControlButton>
                  
                  <ControlButton onClick={toggleMute}>
                    {isMuted ? <VolumeOff /> : <VolumeUp />}
                  </ControlButton>

                  <Box sx={{ flex: 1, mx: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.3)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    minWidth: '60px',
                    textAlign: 'center',
                  }}>
                    {Math.floor(progress * duration / 100 / 60)}:{String(Math.floor(progress * duration / 100 % 60)).padStart(2, '0')}
                  </Typography>

                  <ControlButton onClick={toggleFullscreen}>
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </ControlButton>
                </Box>
              )}
            </VideoContainer>
          </CardContent>
        </GlassCard>

        {/* 视频信息卡片 */}
        <GlassCard>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}>
              📊 视频信息
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 3,
            }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                  视频格式
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                  MP4
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                  录制日期
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                  2024年11月21日
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                  视频时长
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
                  {duration ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '--:--'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#8E8E93', fontWeight: 600 }}>
                  播放状态
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: isPlaying ? '#34C759' : '#FF9500',
                }}>
                  {isPlaying ? '播放中' : '已暂停'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </GlassCard>
      </Container>
    </Box>
  );
}

export default VideoPage;
