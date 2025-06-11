from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import os
from dotenv import load_dotenv
from typing import List, Dict, Any
import json

from database import engine, get_db
from models import Base, User, SpotifyConnection, YouTubeConnection, Playlist, SyncHistory
from schemas import (
    UserCreate, User as UserSchema,
    SpotifyConnectionCreate, SpotifyConnection as SpotifyConnectionSchema, YouTubeCallbackRequest,
    YouTubeConnectionCreate, YouTubeConnection as YouTubeConnectionSchema,
    PlaylistCreate, Playlist as PlaylistSchema,
    SyncHistoryCreate, SyncHistory as SyncHistorySchema,
    Token, SpotifyCallbackRequest,
    UserLogin
)
from auth import (
    get_current_active_user, create_access_token,
    verify_password, get_password_hash
)
from playlist_sync import PlaylistSync

# Crear las tablas de la base de datos
Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],  # En desarrollo, solo front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Spotify
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

# Configuración de YouTube
YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET")
YOUTUBE_REDIRECT_URI = os.getenv("YOUTUBE_REDIRECT_URI")
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.force-ssl"
]

def refresh_spotify_token(spotify_connection: SpotifyConnection):
    # Aquí suponemos que SpotifyConnection contiene el refresh_token
    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
    )
    
    token_info = sp_oauth.refresh_access_token(spotify_connection.refresh_token)
    
    # Actualiza el acceso en la base de datos
    spotify_connection.access_token = token_info['access_token']
    spotify_connection.refresh_token = token_info['refresh_token']
    
    return spotify_connection

print("SPOTIFY_CLIENT_ID:", SPOTIFY_CLIENT_ID)
# Rutas de autenticación
@app.post("/token", response_model=Token)
async def login_for_access_token(
    credentials: UserLogin = Body(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    spotify_connection = db.query(SpotifyConnection).filter(
        SpotifyConnection.user_id == current_user.id
    ).first()
    
    youtube_connection = db.query(YouTubeConnection).filter(
        YouTubeConnection.user_id == current_user.id
    ).first()
    
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username
        },
        "spotify_connected": spotify_connection is not None,
        "youtube_connected": youtube_connection is not None
    }

@app.post("/users/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Rutas de Spotify
@app.get("/auth/spotify/url")
async def get_spotify_auth_url():
    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope="playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-private user-read-email",
        show_dialog=True
    )
    auth_url = sp_oauth.get_authorize_url()
    return {"auth_url": auth_url}

@app.post("/auth/spotify/callback")
async def spotify_callback(
    payload: SpotifyCallbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    code = payload.code
    redirect_uri = payload.redirect_uri
    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=redirect_uri,
        scope="playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-private user-read-email"
    )
    
    try:
        token_info = sp_oauth.get_access_token(code)
        new_expires_at = datetime.fromtimestamp(token_info["expires_at"])
        # Guardar o actualizar la conexión de Spotify
        spotify_connection = db.query(SpotifyConnection).filter(SpotifyConnection.user_id == current_user.id).first()
        if spotify_connection:
            spotify_connection.access_token = token_info["access_token"]
            spotify_connection.refresh_token = token_info.get("refresh_token")
            spotify_connection.token_expires_at = new_expires_at
        else:
            spotify_connection = SpotifyConnection(
                user_id=current_user.id,
                access_token=token_info["access_token"],
                refresh_token=token_info.get("refresh_token"),
                token_expires_at=new_expires_at
            )
            db.add(spotify_connection)
        print("Spotify connection:", spotify_connection)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        print("Error durante la autenticación de Spotify:", str(e))
        raise HTTPException(
            status_code=400,
            detail=f"Error during Spotify authentication: {str(e)}"
        )

@app.get("/spotify/playlists")
async def get_spotify_playlists(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    spotify_connection = db.query(SpotifyConnection).filter(
        SpotifyConnection.user_id == current_user.id
    ).first()

    if not spotify_connection:
        raise HTTPException(status_code=400, detail="Spotify account not connected")
    
    # Verificar si el token ha expirado
    if spotify_connection.access_token_expired():
        print("Token ha expirado, actualizando...")
        # imprimo datos de la conexión
        print("Datos de la conexión:", spotify_connection.__dict__)
        spotify_connection = refresh_spotify_token(spotify_connection)
        db.commit()

    try:
        sp = spotipy.Spotify(auth=spotify_connection.access_token)
        playlists = sp.current_user_playlists()
        return playlists
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/spotify/playlist/{playlist_id}/tracks")
async def get_spotify_playlist_tracks(
    playlist_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    spotify_connection = db.query(SpotifyConnection).filter(
        SpotifyConnection.user_id == current_user.id
    ).first()
    
    if not spotify_connection:
        raise HTTPException(status_code=400, detail="Spotify account not connected")
    
    try:
        sp = spotipy.Spotify(auth=spotify_connection.access_token)
        tracks = sp.playlist_tracks(playlist_id)
        return tracks
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/youtube/url")
def get_youtube_auth_url(current_user: User = Depends(get_current_active_user)):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": YOUTUBE_CLIENT_ID,
                "client_secret": YOUTUBE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [YOUTUBE_REDIRECT_URI],
            }
        },
        scopes=YOUTUBE_SCOPES,
        redirect_uri=YOUTUBE_REDIRECT_URI,
    )

    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline', include_granted_scopes='true')
    return {"auth_url": auth_url}

@app.post("/auth/youtube/callback")
async def youtube_callback(
    request: YouTubeCallbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print("Callback de YouTube recibido")
    print("Código recibido:", request.code)
    print("URI de redirección:", request.redirect_uri)
    print("Usuario actual:", current_user)

    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": YOUTUBE_CLIENT_ID,
                    "client_secret": YOUTUBE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [request.redirect_uri]
                }
            },
            scopes=YOUTUBE_SCOPES,
            redirect_uri=request.redirect_uri
        )
        flow.fetch_token(code=request.code)
        credentials = flow.credentials
        youtube = build('youtube', 'v3', credentials=credentials)
        channel = youtube.channels().list(part='snippet', mine=True).execute()
        youtube_user = channel['items'][0]

        youtube_connection = db.query(YouTubeConnection).filter(YouTubeConnection.user_id == current_user.id).first()
        if youtube_connection:
            youtube_connection.access_token = credentials.token
            youtube_connection.refresh_token = credentials.refresh_token
            youtube_connection.token_expires_at = credentials.expiry
        else:
            youtube_connection = YouTubeConnection(
                user_id=current_user.id,
                youtube_user_id=youtube_user['id'],
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expires_at=credentials.expiry
            )
            db.add(youtube_connection)
        db.commit()
        return {"status": "success", "message": "YouTube account connected successfully"}
    except Exception as e:
        print("Error en el callback de YouTube:", e)
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/youtube/playlists")
async def get_youtube_playlists(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    youtube_connection = db.query(YouTubeConnection).filter(
        YouTubeConnection.user_id == current_user.id
    ).first()
    
    if not youtube_connection:
        raise HTTPException(status_code=400, detail="YouTube account not connected")
    
    try:
        credentials = Credentials(
            token=youtube_connection.access_token,
            refresh_token=youtube_connection.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=YOUTUBE_CLIENT_ID,
            client_secret=YOUTUBE_CLIENT_SECRET
        )
        
        youtube = build('youtube', 'v3', credentials=credentials)
        playlists = youtube.playlists().list(
            part='snippet',
            mine=True,
            maxResults=50
        ).execute()
        
        return playlists
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/youtube/playlist/{playlist_id}/items")
async def get_youtube_playlist_items(
    playlist_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    youtube_connection = db.query(YouTubeConnection).filter(
        YouTubeConnection.user_id == current_user.id
    ).first()
    
    if not youtube_connection:
        raise HTTPException(status_code=400, detail="YouTube account not connected")
    
    try:
        credentials = Credentials(
            token=youtube_connection.access_token,
            refresh_token=youtube_connection.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=YOUTUBE_CLIENT_ID,
            client_secret=YOUTUBE_CLIENT_SECRET
        )
        
        youtube = build('youtube', 'v3', credentials=credentials)
        items = youtube.playlistItems().list(
            part='snippet',
            playlistId=playlist_id,
            maxResults=50
        ).execute()
        
        return items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Rutas de sincronización
@app.post("/sync/compare")
async def compare_playlists(
    spotify_playlist_id: str,
    youtube_playlist_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Obtener conexiones
        spotify_connection = db.query(SpotifyConnection).filter(
            SpotifyConnection.user_id == current_user.id
        ).first()
        
        youtube_connection = db.query(YouTubeConnection).filter(
            YouTubeConnection.user_id == current_user.id
        ).first()
        
        if not spotify_connection or not youtube_connection:
            raise HTTPException(status_code=400, detail="Both Spotify and YouTube accounts must be connected")
        
        # Crear clientes
        sp = spotipy.Spotify(auth=spotify_connection.access_token)
        
        credentials = Credentials(
            token=youtube_connection.access_token,
            refresh_token=youtube_connection.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=YOUTUBE_CLIENT_ID,
            client_secret=YOUTUBE_CLIENT_SECRET
        )
        youtube = build('youtube', 'v3', credentials=credentials)
        
        # Usar PlaylistSync para comparar
        sync = PlaylistSync(sp, youtube)
        missing_in_spotify, missing_in_youtube = sync.compare_playlists(
            spotify_playlist_id,
            youtube_playlist_id
        )
        
        return {
            "missing_in_spotify": missing_in_spotify,
            "missing_in_youtube": missing_in_youtube
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/sync/spotify-to-youtube")
async def sync_spotify_to_youtube(
    spotify_playlist_id: str,
    youtube_playlist_id: str,
    max_sync: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Obtener conexiones
        spotify_connection = db.query(SpotifyConnection).filter(
            SpotifyConnection.user_id == current_user.id
        ).first()
        
        youtube_connection = db.query(YouTubeConnection).filter(
            YouTubeConnection.user_id == current_user.id
        ).first()
        
        if not spotify_connection or not youtube_connection:
            raise HTTPException(status_code=400, detail="Both Spotify and YouTube accounts must be connected")
        
        # Crear clientes
        sp = spotipy.Spotify(auth=spotify_connection.access_token)
        
        credentials = Credentials(
            token=youtube_connection.access_token,
            refresh_token=youtube_connection.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=YOUTUBE_CLIENT_ID,
            client_secret=YOUTUBE_CLIENT_SECRET
        )
        youtube = build('youtube', 'v3', credentials=credentials)
        
        # Usar PlaylistSync para sincronizar
        sync = PlaylistSync(sp, youtube)
        result = sync.sync_spotify_to_youtube(
            spotify_playlist_id,
            youtube_playlist_id,
            max_sync
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/sync/youtube-to-spotify")
async def sync_youtube_to_spotify(
    spotify_playlist_id: str,
    youtube_playlist_id: str,
    max_sync: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Obtener conexiones
        spotify_connection = db.query(SpotifyConnection).filter(
            SpotifyConnection.user_id == current_user.id
        ).first()
        
        youtube_connection = db.query(YouTubeConnection).filter(
            YouTubeConnection.user_id == current_user.id
        ).first()
        
        if not spotify_connection or not youtube_connection:
            raise HTTPException(status_code=400, detail="Both Spotify and YouTube accounts must be connected")
        
        # Crear clientes
        sp = spotipy.Spotify(auth=spotify_connection.access_token)
        
        credentials = Credentials(
            token=youtube_connection.access_token,
            refresh_token=youtube_connection.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=YOUTUBE_CLIENT_ID,
            client_secret=YOUTUBE_CLIENT_SECRET
        )
        youtube = build('youtube', 'v3', credentials=credentials)
        
        # Usar PlaylistSync para sincronizar
        sync = PlaylistSync(sp, youtube)
        result = sync.sync_youtube_to_spotify(
            spotify_playlist_id,
            youtube_playlist_id,
            max_sync
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
