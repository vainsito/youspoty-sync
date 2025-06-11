from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

# Tabla de asociación para playlists compartidas
playlist_sharing = Table(
    'playlist_sharing',
    Base.metadata,
    Column('playlist_id', Integer, ForeignKey('playlists.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    spotify_connection = relationship("SpotifyConnection", back_populates="user", uselist=False)
    youtube_connection = relationship("YouTubeConnection", back_populates="user", uselist=False)
    playlists = relationship("Playlist", back_populates="owner")
    shared_playlists = relationship("Playlist", secondary=playlist_sharing, back_populates="shared_with")

class SpotifyConnection(Base):
    __tablename__ = "spotify_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    spotify_user_id = Column(String, unique=True, index=True)
    access_token = Column(String)
    refresh_token = Column(String)
    token_expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    user = relationship("User", back_populates="spotify_connection")

    # Método para verificar si el token ha expirado
    def access_token_expired(self):
        if not self.token_expires_at:
            return True  # Si no hay fecha de expiración, consideramos que ha expirado
        return datetime.utcnow() > self.token_expires_at

class YouTubeConnection(Base):
    __tablename__ = "youtube_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    youtube_user_id = Column(String, unique=True, index=True)
    access_token = Column(String)
    refresh_token = Column(String)
    token_expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    user = relationship("User", back_populates="youtube_connection")

class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    spotify_playlist_id = Column(String, nullable=True)
    youtube_playlist_id = Column(String, nullable=True)
    last_synced_at = Column(DateTime(timezone=True))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    owner = relationship("User", back_populates="playlists")
    shared_with = relationship("User", secondary=playlist_sharing, back_populates="shared_playlists")
    sync_history = relationship("SyncHistory", back_populates="playlist")

class SyncHistory(Base):
    __tablename__ = "sync_history"

    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id"))
    sync_type = Column(String)  # 'spotify_to_youtube' or 'youtube_to_spotify'
    status = Column(String)  # 'success' or 'failed'
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    playlist = relationship("Playlist", back_populates="sync_history")
