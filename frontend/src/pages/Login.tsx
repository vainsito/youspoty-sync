import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
  Divider,
  SvgIcon,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  TextField,
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useLocation, useNavigate } from 'react-router-dom';
import { spotifyService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SpotifyAuth } from '../components/SpotifyAuth';
import { YouTubeAuth } from '../components/YouTubeAuth';

// Custom Spotify icon component
const SpotifyIcon = () => (
  <SvgIcon>
    <path
      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      fill="currentColor"
    />
  </SvgIcon>
);

const steps = [
  'Create Account / Login',
  'Connect Spotify',
  'Connect YouTube',
  'Go to Dashboard',
];

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, spotifyConnected, youtubeConnected, login, register, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [showForm, setShowForm] = useState<'login' | 'register' | null>(null);
  const [loginFields, setLoginFields] = useState({ username: '', password: '' });
  const [registerFields, setRegisterFields] = useState({ email: '', username: '', password: '' });

  useEffect(() => {
    if (user) setStep(1);
    if (user && spotifyConnected) setStep(2);
    if (user && spotifyConnected && youtubeConnected) setStep(3);
  }, [user, spotifyConnected, youtubeConnected]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(loginFields.username, loginFields.password);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(registerFields.email, registerFields.username, registerFields.password);
    } catch (err) {
      setError('Register failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - YouSpoty Sync</title>
        <meta
          name="description"
          content="Connect your Spotify and YouTube accounts to sync playlists"
        />
      </Helmet>
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome to YouSpoty Sync
          </Typography>
          <Stepper activeStep={step} alternativeLabel sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}
          {step === 0 && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                1. Create your account or log in
              </Typography>
              {!showForm && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Button fullWidth variant="contained" onClick={() => setShowForm('login')} disabled={loading || authLoading}>
                      Login
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" onClick={() => setShowForm('register')} disabled={loading || authLoading}>
                      Register
                    </Button>
                  </Grid>
                </Grid>
              )}
              {showForm === 'login' && (
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, '& .MuiFilledInput-root': { backgroundColor: 'rgba(255,255,255,0.2)' } }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        variant="filled"
                        fullWidth
                        label="Username"
                        value={loginFields.username}
                        onChange={e => setLoginFields({ ...loginFields, username: e.target.value })}
                        sx={{
                          mb: 2,
                          '& .MuiFilledInput-root': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 8,
                          },
                          '& .MuiFilledInput-input': {
                            color: '#fff',
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255,255,255,0.7)',
                          },
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        variant="filled"
                        fullWidth
                        label="Password"
                        type="password"
                        value={loginFields.password}
                        onChange={e => setLoginFields({ ...loginFields, password: e.target.value })}
                        sx={{
                          mb: 2,
                          '& .MuiFilledInput-root': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 8,
                          },
                          '& .MuiFilledInput-input': {
                            color: '#fff',
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255,255,255,0.7)',
                          },
                        }}
                        required
                      />
                    </Grid>
                  </Grid>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, mb: 1, borderRadius: 2 }}
                    disabled={loading || authLoading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Login'}
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    sx={{ mb: 1, color: 'primary.main' }}
                    onClick={() => setShowForm(null)}
                  >
                    Back
                  </Button>
                </Box>
              )}
              {showForm === 'register' && (
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 1, '& .MuiFilledInput-root': { backgroundColor: 'rgba(255,255,255,0.2)' } }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        variant="filled"
                        fullWidth
                        label="Email"
                        type="email"
                        value={registerFields.email}
                        onChange={e => setRegisterFields({ ...registerFields, email: e.target.value })}
                        sx={{
                          mb: 2,
                          '& .MuiFilledInput-root': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 8,
                          },
                          '& .MuiFilledInput-input': {
                            color: '#fff',
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255,255,255,0.7)',
                          },
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        variant="filled"
                        fullWidth
                        label="Username"
                        value={registerFields.username}
                        onChange={e => setRegisterFields({ ...registerFields, username: e.target.value })}
                        sx={{
                          mb: 2,
                          '& .MuiFilledInput-root': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 8,
                          },
                          '& .MuiFilledInput-input': {
                            color: '#fff',
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255,255,255,0.7)',
                          },
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        variant="filled"
                        fullWidth
                        label="Password"
                        type="password"
                        value={registerFields.password}
                        onChange={e => setRegisterFields({ ...registerFields, password: e.target.value })}
                        sx={{
                          mb: 2,
                          '& .MuiFilledInput-root': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 8,
                          },
                          '& .MuiFilledInput-input': {
                            color: '#fff',
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255,255,255,0.7)',
                          },
                        }}
                        required
                      />
                    </Grid>
                  </Grid>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, mb: 1, borderRadius: 2 }}
                    disabled={loading || authLoading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    sx={{ mb: 1, color: 'primary.main' }}
                    onClick={() => setShowForm(null)}
                  >
                    Back
                  </Button>
                </Box>
              )}
            </Box>
          )}
          {step === 1 && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                2. Connect your Spotify account
              </Typography>
              <SpotifyAuth />
            </Box>
          )}
          {step === 2 && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                3. Connect your YouTube account
              </Typography>
              <YouTubeAuth />
            </Box>
          )}
          {step === 3 && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                4. All set! Go to your dashboard
              </Typography>
              <Button fullWidth variant="contained" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default Login; 