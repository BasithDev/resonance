import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SongTable from '../components/SongTable.jsx'
import SongContextMenu from '../components/SongContextMenu.jsx'
import PlaylistContextMenu from '../components/PlaylistContextMenu.jsx'
import Icon from '../components/Icon.jsx'
import * as api from '../api/index.js'

function fmtDur(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h} hr ${m} min`
  return `${m} min`
}

function totalDuration(songs = []) {
  return songs.reduce((acc, s) => acc + (s.durationSec ?? 0), 0)
}

function LibraryPlaylistCard({ playlist, onClick, onOpenMenu }) {
  const name = playlist.name
  const songs = playlist.songs || []
  const count = songs.length
  const dur = fmtDur(totalDuration(songs))
  const durText = dur && dur !== '0 min' ? ` · ${dur}` : ''
  const img = playlist.coverUrl || songs[0]?.thumbnailUrl

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-surface-variant bg-surface-container-low p-3 transition-colors hover:bg-surface-container shadow-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-variant shadow-sm">
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant/30">
            <Icon name="queue_music" className="text-[40px]" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-1">
          <h3 className="truncate font-bold text-on-surface text-body-lg group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="truncate text-body-sm text-on-surface-variant/80 mt-0.5">
            {count} {count === 1 ? 'Track' : 'Tracks'}{durText}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenMenu?.(playlist, e)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
        >
          <Icon name="more_vert" className="text-[20px]" />
        </button>
      </div>
    </div>
  )
}

export default function LibraryPage({ onPlay, currentTrackId, isPlaying, isAudioLoading }) {
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contextMenu, setContextMenu] = useState({ isOpen: false, song: null, pos: { x: 0, y: 0 } })
  const [playlistMenu, setPlaylistMenu] = useState({ isOpen: false, playlist: null, pos: { x: 0, y: 0 } })

  async function loadData(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true)
      setError('')
      const [fetchedSongs, fetchedPlaylists] = await Promise.all([
        api.getSongs().catch(() => []),
        api.getPlaylists().catch(() => []),
      ])
      setSongs(Array.isArray(fetchedSongs) ? fetchedSongs : [])
      setPlaylists(Array.isArray(fetchedPlaylists) ? fetchedPlaylists : [])
    } catch (err) {
      setError(err.message || 'Failed to load library')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  useEffect(() => {
    loadData(true)
  }, [])

  function handleOpenMenu(song, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      isOpen: true,
      song,
      pos: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  function handleOpenPlaylistMenu(playlist, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setPlaylistMenu({
      isOpen: true,
      playlist,
      pos: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  async function handleAddToPlaylist(song, playlistId) {
    try {
      await api.addSongToPlaylist(playlistId, song.id)
      loadData(false)
    } catch (err) {
      alert(err.message || 'Failed to add song to playlist')
    }
  }

  async function handleRemoveFromPlaylist(song, playlistId) {
    try {
      await api.removeSongFromPlaylist(playlistId, song.id)
      loadData(false)
    } catch (err) {
      alert(err.message || 'Failed to remove song from playlist')
    }
  }

  async function handleDeleteSong(song) {
    try {
      await api.deleteSong(song.id)
      setSongs((prev) => prev.filter((s) => s.id !== song.id))
    } catch (err) {
      alert(err.message || 'Failed to delete song')
    }
  }

  function handlePlayPlaylist(playlist) {
    const trackList = playlist.id === 'all-songs' ? songs : (playlist.songs || [])
    if (trackList.length > 0) {
      onPlay?.(trackList[0], trackList)
    }
  }

  function handleShufflePlayPlaylist(playlist) {
    const trackList = playlist.id === 'all-songs' ? songs : (playlist.songs || [])
    if (trackList.length > 0) {
      onPlay?.(trackList[0], trackList, { shuffle: true })
    }
  }

  async function handleRenamePlaylist(playlist) {
    if (playlist.id === 'all-songs') return
    const newName = prompt('Enter new playlist name:', playlist.name)
    if (!newName || !newName.trim() || newName.trim() === playlist.name) return
    try {
      await api.updatePlaylist(playlist.id, newName.trim())
      setPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, name: newName.trim() } : p))
    } catch (err) {
      alert(err.message || 'Failed to rename playlist')
    }
  }

  async function handleDeletePlaylist(playlist) {
    if (playlist.id === 'all-songs') return
    if (!confirm(`Are you sure you want to delete playlist "${playlist.name}"?`)) return
    try {
      await api.deletePlaylist(playlist.id)
      setPlaylists(prev => prev.filter(p => p.id !== playlist.id))
    } catch (err) {
      alert(err.message || 'Failed to delete playlist')
    }
  }

  const displaySongs = showAll ? songs : songs.slice(0, 20)

  return (
    <div className="flex flex-col gap-unit-xl">
      {/* Hero All Songs Collection Header */}
      <section className="relative overflow-hidden rounded-2xl border border-surface-variant bg-linear-to-r from-surface-container-high via-surface-container to-surface-container-low p-6 md:p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-tertiary-container text-white shadow-lg">
              <Icon name="library_music" className="text-[42px]" />
            </div>
            <div>
              <span className="text-label-caps uppercase tracking-widest text-primary font-bold">Default Playlist</span>
              <h1 className="text-headline-xl font-extrabold text-on-surface">All Songs</h1>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {songs.length} track{songs.length !== 1 ? 's' : ''} in master library
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={songs.length === 0}
            onClick={() => songs.length > 0 && onPlay?.(songs[0], songs)}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 font-bold text-on-primary shadow-[0_0_20px_rgba(255,89,89,0.3)] transition-all hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Icon name="play_arrow" filled className="text-[24px]" />
            <span>Play All Songs</span>
          </button>
        </div>
      </section>

      {/* Main Track List Table */}
      <section>
        <div className="mb-unit-md flex items-center justify-between">
          <div>
            <h2 className="text-headline-lg font-bold text-on-background">Recently Added</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {songs.length > 20 && !showAll
                ? `Showing 20 most recent of ${songs.length} tracks`
                : `${songs.length} total tracks`}
            </p>
          </div>
          {songs.length > 20 && (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="text-body-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              {showAll ? 'Show Recent 20' : `Show All (${songs.length})`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-surface-variant bg-surface-container-low">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-error-container bg-error-container/10 p-4 text-body-sm text-error">
            {error}
          </div>
        ) : (
          <SongTable
            songs={displaySongs}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            isAudioLoading={isAudioLoading}
            onPlay={onPlay}
            onOpenContextMenu={handleOpenMenu}
          />
        )}
      </section>

      {/* Playlists Preview Section */}
      <section>
        <div className="mb-unit-md flex items-center justify-between">
          <h2 className="text-headline-lg font-bold text-on-background">Your Playlists</h2>
          <button
            type="button"
            onClick={() => navigate('/playlists')}
            className="text-body-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            See All Playlists
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {/* Master All Songs Card */}
          <LibraryPlaylistCard
            playlist={{
              id: 'all-songs',
              name: 'All Songs',
              songs: songs,
              coverUrl: null,
            }}
            onClick={() => navigate('/playlists/all-songs')}
            onOpenMenu={handleOpenPlaylistMenu}
          />
          {playlists.map((pl) => (
            <LibraryPlaylistCard
              key={pl.id}
              playlist={pl}
              onClick={() => navigate(`/playlists/${pl.id}`)}
              onOpenMenu={handleOpenPlaylistMenu}
            />
          ))}
        </div>
      </section>

      {/* Track options context menu */}
      <SongContextMenu
        song={contextMenu.song}
        playlists={playlists}
        isOpen={contextMenu.isOpen}
        position={contextMenu.pos}
        onClose={() => setContextMenu((c) => ({ ...c, isOpen: false }))}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onDeleteSong={handleDeleteSong}
      />

      {/* Playlist options context menu */}
      <PlaylistContextMenu
        playlist={playlistMenu.playlist}
        isOpen={playlistMenu.isOpen}
        position={playlistMenu.pos}
        onClose={() => setPlaylistMenu((c) => ({ ...c, isOpen: false }))}
        onPlay={handlePlayPlaylist}
        onShufflePlay={handleShufflePlayPlaylist}
        onRename={handleRenamePlaylist}
        onDelete={handleDeletePlaylist}
      />
    </div>
  )
}
