import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Paper, Chip, Stack, Button, Avatar, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import SyncIcon from '@mui/icons-material/Sync';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const Profile: React.FC = () => {
  const { user, spotifyConnected, youtubeConnected, loading, logout } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#1DB954' }}>{user?.username.charAt(0).toUpperCase()}</Avatar>
            <Box>
              <Typography variant="h4" color="text.primary">{user?.username}</Typography>
              <Typography variant="body1" color="text.secondary">{user?.email}</Typography>
            </Box>
          </Stack>

          <Typography variant="h6" gutterBottom color="text.primary">Connections</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: spotifyConnected ? '#1DB954' : '#f0f0f0' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip icon={<MusicNoteIcon />} label="Spotify" color={spotifyConnected ? 'success' : 'default'} />
                </Stack>
                <Button variant="outlined" color="inherit" startIcon={<SyncIcon />}>
                  {spotifyConnected ? 'Connected' : 'Connect'}
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: youtubeConnected ? '#FF0000' : '#f0f0f0' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip icon={<PlaylistPlayIcon />} label="YouTube" color={youtubeConnected ? 'error' : 'default'} />
                </Stack>
                <Button variant="outlined" color="inherit" startIcon={<SyncIcon />}>
                  {youtubeConnected ? 'Connected' : 'Connect'}
                </Button>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button variant="contained" color="error" onClick={logout} sx={{ textTransform: 'none' }}>
              Logout
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;
