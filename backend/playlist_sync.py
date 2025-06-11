from typing import List, Dict, Tuple, Optional
from difflib import SequenceMatcher
import re
from unidecode import unidecode
import spotipy
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

class PlaylistSync:
    def __init__(self, spotify_client: spotipy.Spotify, youtube_client: build):
        self.spotify = spotify_client
        self.youtube = youtube_client

    @staticmethod
    def normalize_text(text: str) -> str:
        """Normaliza el texto para comparación."""
        # Convertir a minúsculas
        text = text.lower()
        # Remover acentos
        text = unidecode(text)
        # Remover caracteres especiales y espacios extra
        text = re.sub(r'[^\w\s]', '', text)
        # Remover espacios extra
        text = ' '.join(text.split())
        return text

    @staticmethod
    def similarity_score(a: str, b: str) -> float:
        """Calcula un score de similitud entre dos strings."""
        a = PlaylistSync.normalize_text(a)
        b = PlaylistSync.normalize_text(b)
        return SequenceMatcher(None, a, b).ratio()

    @staticmethod
    def extract_metadata(title: str) -> Dict[str, str]:
        """Extrae metadatos de un título de canción o video."""
        # Patrones comunes en títulos
        patterns = [
            r'(?P<title>.*?)\s*-\s*(?P<artist>.*?)(?:\s*\(.*\))?$',  # "Título - Artista"
            r'(?P<artist>.*?)\s*-\s*(?P<title>.*?)(?:\s*\(.*\))?$',  # "Artista - Título"
            r'(?P<title>.*?)\s*by\s*(?P<artist>.*?)(?:\s*\(.*\))?$',  # "Título by Artista"
        ]
        
        for pattern in patterns:
            match = re.match(pattern, title, re.IGNORECASE)
            if match:
                return {
                    'title': match.group('title').strip(),
                    'artist': match.group('artist').strip()
                }
        
        # Si no coincide con ningún patrón, asumimos que todo es el título
        return {'title': title.strip(), 'artist': ''}

    def search_spotify_track(self, title: str, artist: str = '') -> Optional[str]:
        """Busca un track en Spotify usando título y artista."""
        query = f"track:{title}"
        if artist:
            query += f" artist:{artist}"
        
        results = self.spotify.search(q=query, type='track', limit=5)
        if not results['tracks']['items']:
            return None
        
        # Calcular similitud para cada resultado
        best_match = None
        best_score = 0.7  # Umbral mínimo de similitud
        
        for track in results['tracks']['items']:
            track_title = track['name']
            track_artist = track['artists'][0]['name']
            
            title_score = self.similarity_score(title, track_title)
            artist_score = self.similarity_score(artist, track_artist) if artist else 1.0
            
            # Ponderar más el título que el artista
            total_score = (title_score * 0.7) + (artist_score * 0.3)
            
            if total_score > best_score:
                best_score = total_score
                best_match = track['uri']
        
        return best_match

    def search_youtube_video(self, title: str, artist: str = '') -> Optional[str]:
        """Busca un video en YouTube usando título y artista."""
        query = f"{title} {artist} official audio" if artist else f"{title} official audio"
        
        results = self.youtube.search().list(
            q=query,
            part='snippet',
            type='video',
            videoCategoryId='10',  # Música
            maxResults=5
        ).execute()
        
        if not results['items']:
            return None
        
        # Calcular similitud para cada resultado
        best_match = None
        best_score = 0.7  # Umbral mínimo de similitud
        
        for item in results['items']:
            video_title = item['snippet']['title']
            title_score = self.similarity_score(title, video_title)
            
            if title_score > best_score:
                best_score = title_score
                best_match = item['id']['videoId']
        
        return best_match

    def compare_playlists(
        self,
        spotify_playlist_id: str,
        youtube_playlist_id: str
    ) -> Tuple[List[Dict], List[Dict]]:
        """Compara dos playlists y encuentra las diferencias con metadatos."""
        # Obtener tracks de Spotify
        spotify_tracks = []
        results = self.spotify.playlist_tracks(spotify_playlist_id)
        while results:
            for item in results['items']:
                track = item['track']
                if track:  # Ignorar tracks nulos
                    spotify_tracks.append({
                        'id': track['id'],
                        'title': track['name'],
                        'artist': track['artists'][0]['name'],
                        'normalized': self.normalize_text(f"{track['name']} {track['artists'][0]['name']}")
                    })
            if results['next']:
                results = self.spotify.next(results)
            else:
                break

        # Obtener videos de YouTube
        youtube_videos = []
        results = self.youtube.playlistItems().list(
            playlistId=youtube_playlist_id,
            part='snippet',
            maxResults=50
        ).execute()
        
        while results:
            for item in results['items']:
                video = item['snippet']
                metadata = self.extract_metadata(video['title'])
                youtube_videos.append({
                    'id': item['id'],
                    'title': metadata['title'],
                    'artist': metadata['artist'],
                    'normalized': self.normalize_text(f"{metadata['title']} {metadata['artist']}")
                })
            
            if 'nextPageToken' in results:
                results = self.youtube.playlistItems().list(
                    playlistId=youtube_playlist_id,
                    part='snippet',
                    maxResults=50,
                    pageToken=results['nextPageToken']
                ).execute()
            else:
                break

        # Encontrar diferencias
        missing_in_spotify = []
        missing_in_youtube = []

        # Crear conjuntos de tracks normalizados para comparación rápida
        spotify_set = {track['normalized'] for track in spotify_tracks}
        youtube_set = {video['normalized'] for video in youtube_videos}

        # Encontrar tracks que faltan en YouTube
        for track in spotify_tracks:
            if track['normalized'] not in youtube_set:
                missing_in_youtube.append(track)

        # Encontrar videos que faltan en Spotify
        for video in youtube_videos:
            if video['normalized'] not in spotify_set:
                missing_in_spotify.append(video)

        return missing_in_spotify, missing_in_youtube

    def sync_spotify_to_youtube(
        self,
        spotify_playlist_id: str,
        youtube_playlist_id: str,
        max_sync: int = 50
    ) -> Dict:
        """Sincroniza tracks de Spotify a YouTube."""
        missing_in_youtube = self.compare_playlists(spotify_playlist_id, youtube_playlist_id)[1]
        synced = 0
        failed = []

        for track in missing_in_youtube[:max_sync]:
            video_id = self.search_youtube_video(track['title'], track['artist'])
            if video_id:
                try:
                    self.youtube.playlistItems().insert(
                        part='snippet',
                        body={
                            'snippet': {
                                'playlistId': youtube_playlist_id,
                                'resourceId': {
                                    'kind': 'youtube#video',
                                    'videoId': video_id
                                }
                            }
                        }
                    ).execute()
                    synced += 1
                except Exception as e:
                    failed.append({
                        'track': track,
                        'error': str(e)
                    })
            else:
                failed.append({
                    'track': track,
                    'error': 'Video not found'
                })

        return {
            'synced': synced,
            'failed': failed,
            'total_missing': len(missing_in_youtube)
        }

    def sync_youtube_to_spotify(
        self,
        spotify_playlist_id: str,
        youtube_playlist_id: str,
        max_sync: int = 50
    ) -> Dict:
        """Sincroniza videos de YouTube a Spotify."""
        missing_in_spotify = self.compare_playlists(spotify_playlist_id, youtube_playlist_id)[0]
        synced = 0
        failed = []

        for video in missing_in_spotify[:max_sync]:
            track_uri = self.search_spotify_track(video['title'], video['artist'])
            if track_uri:
                try:
                    self.spotify.playlist_add_items(spotify_playlist_id, [track_uri])
                    synced += 1
                except Exception as e:
                    failed.append({
                        'video': video,
                        'error': str(e)
                    })
            else:
                failed.append({
                    'video': video,
                    'error': 'Track not found'
                })

        return {
            'synced': synced,
            'failed': failed,
            'total_missing': len(missing_in_spotify)
        } 