import React, { useEffect } from 'react';
import { spotifyService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // ícono opcional

export const SpotifyAuth: React.FC = () => {
  const { spotifyConnected, user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          await spotifyService.connect(code);
          // Limpiar la URL después de la autenticación
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('Error connecting Spotify:', error);
        }
      }
    };

    handleCallback();
  }, []);

  if (spotifyConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-500">✓</span>
        <span>Spotify Connected</span>
      </div>
    );
  }

  const handleConnect = async () => {
    try {
      const response = await spotifyService.getAuthUrl();
      window.location.href = response.auth_url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      variant="contained"
      startIcon={<MusicNoteIcon />}
      fullWidth
      sx={{
        backgroundColor: '#1DB954',
        '&:hover': { backgroundColor: '#1ed760' },
        color: 'white',
        py: 1.5,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 'bold',
        fontSize: '1rem',
      }}
    >
      Connect Spotify
    </Button>

  );
};
