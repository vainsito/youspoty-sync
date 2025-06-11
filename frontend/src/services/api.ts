import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log("Token en interceptor:", token); // Esto te ayudará a ver si el token está presente.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Error en interceptor:', error); // Más información sobre el error.
  return Promise.reject(error);
});

// Interceptor para manejar las respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;  // Si la respuesta es exitosa, se pasa normalmente
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      //localStorage.removeItem('token');  // Elimina el token del localStorage
      // Aquí podrías redirigir a la página de login, dependiendo de tu lógica de rutas
     // window.location.href = '/login'; // Redirige a la página de login
    }
    return Promise.reject(error);
  }
);



export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/token', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token); // Guarda el token
    }
    return response.data;
  },
  register: async (email: string, username: string, password: string) => {
    const response = await api.post('/users/', { email, username, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};

export const spotifyService = {
  getAuthUrl: async () => {
    const response = await api.get('/auth/spotify/url');
    return response.data;
  },
  connect: async (code: string) => {
    console.log("Código recibido:", code);
    const response = await api.post('/auth/spotify/callback', { 
      code,  // Enviamos el código recibido por Spotify
      redirect_uri: 'http://127.0.0.1:3000/auth/spotify/callback'
    });
    return response.data;
  }, 
  getPlaylists: async () => {
    const response = await api.get('/spotify/playlists');
    return response.data;
  },
  getPlaylistTracks: async (playlistId: string) => {
    const response = await api.get(`/spotify/playlist/${playlistId}/tracks`);
    return response.data;
  },
};

export const youtubeService = {
  getAuthUrl: async () => {
    const response = await api.get('/auth/youtube/url');
    return response.data;
  },
  connect: async (code: string) => {
    console.log("Código recibido:", code);
    const response = await api.post('/auth/youtube/callback', { 
      code,
      redirect_uri: 'http://127.0.0.1:3000/auth/youtube/callback'
    });
    return response.data;
  },
  getPlaylists: async () => {
    const response = await api.get('/youtube/playlists');
    return response.data;
  },
  getPlaylistItems: async (playlistId: string) => {
    const response = await api.get(`/youtube/playlist/${playlistId}/items`);
    return response.data;
  },
};

export const syncService = {
  comparePlaylists: async (spotifyPlaylistId: string, youtubePlaylistId: string) => {
    const response = await api.post('/sync/compare', { spotify_playlist_id: spotifyPlaylistId, youtube_playlist_id: youtubePlaylistId });
    return response.data;
  },
  syncSpotifyToYoutube: async (spotifyPlaylistId: string, youtubePlaylistId: string, maxSync: number = 50) => {
    const response = await api.post('/sync/spotify-to-youtube', { 
      spotify_playlist_id: spotifyPlaylistId, 
      youtube_playlist_id: youtubePlaylistId,
      max_sync: maxSync
    });
    return response.data;
  },
  syncYoutubeToSpotify: async (spotifyPlaylistId: string, youtubePlaylistId: string, maxSync: number = 50) => {
    const response = await api.post('/sync/youtube-to-spotify', { 
      spotify_playlist_id: spotifyPlaylistId, 
      youtube_playlist_id: youtubePlaylistId,
      max_sync: maxSync
    });
    return response.data;
  },
}; 