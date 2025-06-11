import React, { useContext } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, styled, IconButton, Tooltip, Button } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../contexts/AuthContext'; // Importamos el contexto

// Custom logo component
const LogoContainer = styled(RouterLink)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  '& .logo-circle': {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #1DB954 30%, #FF0000 90%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    '&::after': {
      content: '""',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: '#121212',
      position: 'absolute',
    },
  },
  '& .logo-text': {
    fontWeight: 700,
    fontSize: '1.25rem',
    background: 'linear-gradient(45deg, #1DB954 30%, #FF0000 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();  // Usamos el contexto de autenticación
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;  // O un spinner si prefieres
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
            <LogoContainer to="/">
              <div className="logo-circle" />
              <Typography className="logo-text">YouSpoty Sync</Typography>
            </LogoContainer>
            <Box sx={{ flexGrow: 1 }} />
            {user ? (
              // Si el usuario está logueado, mostramos el ícono de perfil
              <Tooltip title="Profile">
                <IconButton
                  onClick={handleProfileClick}
                  sx={{ color: '#1DB954' }}
                >
                  <AccountCircleIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            ) : (
              // Si el usuario no está logueado, mostramos el botón de Login
              <Button
                component={RouterLink}
                to="/login"
                color="primary"
                variant={location.pathname === '/login' ? 'contained' : 'text'}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Login
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} YouSpoty Sync. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
