import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  spotifyConnected: boolean;
  youtubeConnected: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');  // Recupera el token de localStorage
    console.log("Token encontrado:", token);  // Mensaje de debug para asegurarte que se recuperó correctamente
    if (token) {
      console.log("Iniciando verificación de autenticación...");
      checkAuth();  // Si el token está presente, verifica si el usuario está autenticado
    } else {
      console.log("No se encontró token.");
      setLoading(false);  // Si no hay token, simplemente termina el proceso de carga
    }
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      setSpotifyConnected(data.spotify_connected);
      setYoutubeConnected(data.youtube_connected);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        console.error('Token no válido');
        localStorage.removeItem('token');  // Elimina el token si no es válido
      } else {
        console.error('Error desconocido en checkAuth:', error);
      }
    } finally {
      setLoading(false);  // Después de la verificación, ya no estamos cargando
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authService.login(username, password);
    localStorage.setItem('token', data.access_token);
    await checkAuth();
  };

  const register = async (email: string, username: string, password: string) => {
    await authService.register(email, username, password);
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSpotifyConnected(false);
    setYoutubeConnected(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        spotifyConnected,
        youtubeConnected,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 