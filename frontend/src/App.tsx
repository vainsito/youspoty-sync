import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SpotifyCallback from './pages/SpotifyCallback';
import NotFound from './pages/NotFound';
import YouTubeCallback from 'pages/YoutubeCallback';
import Profile from './pages/Profile';

console.log('API_URL:', process.env.REACT_APP_API_URL);

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
              <Route path="/auth/youtube/callback" element={<YouTubeCallback />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App; 