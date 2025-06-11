import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SyncIcon from '@mui/icons-material/Sync';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>YouSpoty Sync - Synchronize your Spotify and YouTube playlists</title>
        <meta
          name="description"
          content="Easily sync your playlists between Spotify and YouTube. Keep your music in sync across platforms."
        />
      </Helmet>

      <Box
        sx={{
          pt: 8,
          pb: 6,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Typography
            component="h1"
            variant="h2"
            color="text.primary"
            gutterBottom
          >
            Sync Your Music
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Seamlessly synchronize your playlists between Spotify and YouTube.
            Keep your favorite music in perfect harmony across platforms.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: 8 }} maxWidth="md">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MusicNoteIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h2">
                  Import Playlists
                </Typography>
                <Typography>
                  Import your existing playlists from Spotify or YouTube with just a few clicks.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SyncIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h2">
                  Automatic Sync
                </Typography>
                <Typography>
                  Keep your playlists in sync automatically. Changes made on one platform reflect on the other.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PlaylistAddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h2">
                  Create New
                </Typography>
                <Typography>
                  Create new playlists that work across both platforms simultaneously.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Home; 