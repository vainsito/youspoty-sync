import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { spotifyService, youtubeService } from '../services/api'; // Asegúrate de importar tus servicios

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<any[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        // Obtener playlists de Spotify
        const spotifyData = await spotifyService.getPlaylists();
        setSpotifyPlaylists(spotifyData.items); // Asumiendo que spotifyData.items contiene las playlists

        // Obtener playlists de YouTube
        const youtubeData = await youtubeService.getPlaylists();
        if (Array.isArray(youtubeData)) {
          setYoutubePlaylists(youtubeData); // Solo asignar si es un array
        } else {
          console.error('Expected an array of playlists from YouTube API');
          setYoutubePlaylists([]); // Establecer un array vacío en caso de error
        }
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
    };

    fetchPlaylists();
  }, []);

  const PlaylistCard = ({ title, songCount, lastSynced, platform }: { 
    title: string; 
    songCount: number; 
    lastSynced: string;
    platform: 'spotify' | 'youtube';
  }) => (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      '&:hover': {
        transform: 'translateY(-4px)',
        transition: 'transform 0.2s ease-in-out',
      },
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          {platform === 'spotify' ? (
            <Chip 
              icon={<MusicNoteIcon />} 
              label="Spotify" 
              color="primary" 
              size="small"
              sx={{ bgcolor: '#1DB954' }}
            />
          ) : (
            <Chip 
              icon={<PlaylistPlayIcon />} 
              label="YouTube" 
              color="error" 
              size="small"
              sx={{ bgcolor: '#FF0000' }}
            />
          )}
        </Stack>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {songCount} songs • Last synced {lastSynced}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Tooltip title="Sync Now">
          <IconButton size="small" sx={{ color: 'white' }}>
            <SyncIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" sx={{ color: 'white' }}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" sx={{ color: 'white' }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard - YouSpoty Sync</title>
        <meta
          name="description"
          content="Manage your synchronized Spotify and YouTube playlists"
        />
      </Helmet>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab label="All Playlists" />
          <Tab label="Spotify" />
          <Tab label="YouTube" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4">Your Playlists</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log('Create new playlist')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            New Playlist
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Mostrar todas las playlists (de ambas plataformas) */}
          {spotifyPlaylists.map((playlist: any) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <PlaylistCard 
                title={playlist.name} 
                songCount={playlist.tracks?.total || 0} 
                lastSynced={playlist.snapshot_id || 'Unknown'}
                platform="spotify"
              />
            </Grid>
          ))}
          {youtubePlaylists.map((playlist: any) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <PlaylistCard 
                title={playlist.name} 
                songCount={playlist.songCount || 0} 
                lastSynced={playlist.lastSynced || 'Unknown'}
                platform="youtube"
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h4" gutterBottom>
          Spotify Playlists
        </Typography>
        <Grid container spacing={3}>
          {spotifyPlaylists.map((playlist: any) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <PlaylistCard 
                title={playlist.name} 
                songCount={playlist.tracks?.total || 0} 
                lastSynced={playlist.snapshot_id || 'Unknown'}
                platform="spotify"
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h4" gutterBottom>
          YouTube Playlists
        </Typography>
        <Grid container spacing={3}>
          {youtubePlaylists.map((playlist: any) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <PlaylistCard 
                title={playlist.name} 
                songCount={playlist.songCount || 0} 
                lastSynced={playlist.lastSynced || 'Unknown'}
                platform="youtube"
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </>
  );
};

export default Dashboard;
