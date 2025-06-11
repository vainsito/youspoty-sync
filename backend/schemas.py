from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Spotify connection schemas
class SpotifyConnectionBase(BaseModel):
    spotify_user_id: str
    access_token: str
    refresh_token: str
    token_expires_at: datetime

class SpotifyConnectionCreate(SpotifyConnectionBase):
    pass

class SpotifyConnection(SpotifyConnectionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# YouTube connection schemas
class YouTubeConnectionBase(BaseModel):
    youtube_user_id: str
    access_token: str
    refresh_token: str
    token_expires_at: datetime

class YouTubeConnectionCreate(YouTubeConnectionBase):
    pass

class YouTubeConnection(YouTubeConnectionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Playlist schemas
class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class PlaylistCreate(PlaylistBase):
    spotify_playlist_id: Optional[str] = None
    youtube_playlist_id: Optional[str] = None

class Playlist(PlaylistBase):
    id: int
    owner_id: int
    spotify_playlist_id: Optional[str]
    youtube_playlist_id: Optional[str]
    last_synced_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Sync history schemas
class SyncHistoryBase(BaseModel):
    sync_type: str
    status: str
    error_message: Optional[str] = None

class SyncHistoryCreate(SyncHistoryBase):
    playlist_id: int

class SyncHistory(SyncHistoryBase):
    id: int
    playlist_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

# Login schema for parsing credentials in JSON
class UserLogin(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None

class SpotifyCallbackRequest(BaseModel):
    code: str
    redirect_uri: str

class YouTubeCallbackRequest(BaseModel):
    code: str
    redirect_uri: str