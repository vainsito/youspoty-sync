import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { youtubeService } from '../services/api';

const YouTubeCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSent = useRef(false); // ✅ persiste entre renders

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');

    if (code && !hasSent.current) {
      hasSent.current = true; // 👈 asegurás que solo se mande una vez

      youtubeService.connect(code)
        .then(() => {
          window.history.replaceState({}, document.title, '/dashboard');
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('YouTube auth failed:', err);
        });
    }
  }, [location, navigate]);

  return <div>Conectando con YouTube...</div>;
};

export default YouTubeCallback;
