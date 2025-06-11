import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>404 Not Found - YouSpoty Sync</title>
        <meta name="description" content="Page not found" />
      </Helmet>

      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h5" gutterBottom>
            Oops! Page not found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
          >
            Go to Homepage
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default NotFound; 