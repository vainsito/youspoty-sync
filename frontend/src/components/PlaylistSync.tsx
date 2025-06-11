import React, { useState, useEffect } from 'react';
import { spotifyService, youtubeService, syncService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

export const PlaylistSync: React.FC = () => {
  const { spotifyConnected, youtubeConnected } = useAuth();
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<Playlist[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<Playlist[]>([]);
  const [selectedSpotify, setSelectedSpotify] = useState<string>('');
  const [selectedYoutube, setSelectedYoutube] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (spotifyConnected) {
      loadSpotifyPlaylists();
    }
    if (youtubeConnected) {
      loadYoutubePlaylists();
    }
  }, [spotifyConnected, youtubeConnected]);

  const loadSpotifyPlaylists = async () => {
    try {
      const data = await spotifyService.getPlaylists();
      setSpotifyPlaylists(
        data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          image: item.images[0]?.url,
        }))
      );
    } catch (error) {
      console.error('Error loading Spotify playlists:', error);
    }
  };

  const loadYoutubePlaylists = async () => {
    try {
      const data = await youtubeService.getPlaylists();
      setYoutubePlaylists(
        data.items.map((item: any) => ({
          id: item.id,
          name: item.snippet.title,
          description: item.snippet.description,
          image: item.snippet.thumbnails?.default?.url,
        }))
      );
    } catch (error) {
      console.error('Error loading YouTube playlists:', error);
    }
  };

  const handleCompare = async () => {
    if (!selectedSpotify || !selectedYoutube) return;

    setLoading(true);
    try {
      const data = await syncService.comparePlaylists(selectedSpotify, selectedYoutube);
      setResult(data);
    } catch (error) {
      console.error('Error comparing playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToYoutube = async () => {
    if (!selectedSpotify || !selectedYoutube) return;

    setLoading(true);
    try {
      const data = await syncService.syncSpotifyToYoutube(selectedSpotify, selectedYoutube);
      setResult(data);
    } catch (error) {
      console.error('Error syncing to YouTube:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToSpotify = async () => {
    if (!selectedSpotify || !selectedYoutube) return;

    setLoading(true);
    try {
      const data = await syncService.syncYoutubeToSpotify(selectedSpotify, selectedYoutube);
      setResult(data);
    } catch (error) {
      console.error('Error syncing to Spotify:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!spotifyConnected || !youtubeConnected) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">Please connect both Spotify and YouTube accounts to sync playlists.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Spotify Playlists</h3>
          <select
            className="w-full p-2 border rounded"
            value={selectedSpotify}
            onChange={(e) => setSelectedSpotify(e.target.value)}
          >
            <option value="">Select a playlist</option>
            {spotifyPlaylists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">YouTube Playlists</h3>
          <select
            className="w-full p-2 border rounded"
            value={selectedYoutube}
            onChange={(e) => setSelectedYoutube(e.target.value)}
          >
            <option value="">Select a playlist</option>
            {youtubePlaylists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleCompare}
          disabled={loading || !selectedSpotify || !selectedYoutube}
        >
          Compare Playlists
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleSyncToYoutube}
          disabled={loading || !selectedSpotify || !selectedYoutube}
        >
          Sync to YouTube
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          onClick={handleSyncToSpotify}
          disabled={loading || !selectedSpotify || !selectedYoutube}
        >
          Sync to Spotify
        </button>
      </div>

      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Results:</h4>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}; 