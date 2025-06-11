import React, { useEffect } from 'react';
import { youtubeService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useNavigate } from 'react-router-dom';

export const YouTubeAuth: React.FC = () => {
  const { youtubeConnected } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          await youtubeService.connect(code);
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Redirigir al dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('Error connecting YouTube:', error);
        }
      }
    };

    handleCallback();
  }, []);

  const handleConnect = async () => {
    try {
      const response = await youtubeService.getAuthUrl();
      window.location.href = response.auth_url;
    } catch (error) {
      console.error('Error getting YouTube auth URL:', error);
    }
  };

  if (youtubeConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-500 font-bold">✓</span>
        <span>YouTube conectado</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      variant="contained"
      startIcon={<YouTubeIcon />}
      fullWidth
      sx={{
        backgroundColor: '#d72929',
        '&:hover': { backgroundColor: '#c62828' },
        color: 'white',
        py: 1.5,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 'bold',
        fontSize: '1rem',
      }}
    >
      Conectar con YouTube
    </Button>
  );
};
