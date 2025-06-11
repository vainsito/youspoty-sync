import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { youtubeService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const YouTubeCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { loading } = useAuth(); // Espera a que AuthContext cargue

  useEffect(() => {
    if (loading) return; // No ejecutar mientras el auth context esté cargando

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`YouTube authentication failed: ${errorParam}`);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      return;
    }

    const handleAuth = async () => {
      try {
        await youtubeService.connect(code); // Pasa el código de autorización a youtubeService
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to authenticate with YouTube. Please try again.');
      }
    };

    handleAuth();
  }, [searchParams, navigate, loading]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3
      }}
    >
      {error ? (
        <>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1">
            You will be redirected to the login page shortly...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">
            Connecting to YouTube...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default YouTubeCallback;
