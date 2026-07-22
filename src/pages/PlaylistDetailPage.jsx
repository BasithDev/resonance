import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import SongTable from '../components/SongTable.jsx'
import SongContextMenu from '../components/SongContextMenu.jsx'
import * as api from '../api/index.js'

function fmtDur(sec) {
  if (!sec) return '--:--'
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function totalLabel(songs = []) {
  const total = songs.reduce((a, s) => a + (s.durationSec ?? 0), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return h > 0 ? `${h} hr ${m} min` : `${m} min`
}

export default function PlaylistDetailPage({ playerTrack, isPlaying, onPlay }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState(null)
  const [allPlaylists, setAllPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contextMenu, setContextMenu] = useState({ isOpen: false, song: null, pos: { x: 0, y: 0 } })

  async function loadPlaylist() {
    try {
      setLoading(true)
      setError('')
      const [details, pls] = await Promise.all([
        api.getPlaylistDetails(id),
        api.getPlaylists().catch(() => []),
      ])
      setPlaylist(details)
      setAllPlaylists(pls)
    } catch (err) {
      setError(err.message || 'Playlist not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlaylist()
  }, [id])

  function handleOpenMenu(song, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      isOpen: true,
      song,
      pos: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  async function handleAddToPlaylist(song, targetPlaylistId) {
    try {
      await api.addSongToPlaylist(targetPlaylistId, song.id)
    } catch (err) {
      alert(err.message || 'Failed to add song')
    }
  }

  async function handleRemoveFromPlaylist(song) {
    try {
      await api.removeSongFromPlaylist(id, song.id)
      setPlaylist((prev) => prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== song.id) } : null)
    } catch (err) {
      alert(err.message || 'Failed to remove song from playlist')
    }
  }

  async function handleDeletePlaylist() {
    if (!window.confirm(`Are you sure you want to delete "${playlist?.name}"?`)) return
    try {
      await api.deletePlaylist(id)
      navigate('/playlists')
    } catch (err) {
      alert(err.message || 'Failed to delete playlist')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-on-surface-variant">
        <Icon name="error_outline" className="text-[48px] opacity-40" />
        <p className="text-headline-md opacity-50">{error || 'Playlist not found'}</p>
        <button onClick={() => navigate('/playlists')} className="text-primary hover:underline text-body-sm">
          ← Back to Playlists
        </button>
      </div>
    )
  }

  const { songs = [] } = playlist
  const currentTrackId = playerTrack?.id || playerTrack?.youtubeId

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/playlists')}
        className="flex items-center gap-2 self-start rounded-full
                   bg-surface-container-high px-4 py-2 text-body-sm text-on-surface-variant
                   transition-colors hover:bg-surface-container-highest hover:text-on-surface"
      >
        <Icon name="chevron_left" />
        Back to Playlists
      </button>

      {/* Playlist Hero */}
      <section className="flex flex-col items-end gap-unit-lg md:flex-row md:items-center">
        <div className="group relative h-56 w-full shrink-0 overflow-hidden
                        rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] md:w-56">
          {playlist.coverUrl
            ? <img
                src={playlist.coverUrl}
                alt={playlist.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            : <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
                <Icon name="queue_music" className="text-[80px] text-on-surface-variant/20" />
              </div>
          }
          <div className="absolute inset-0 flex items-center justify-center
                          bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              disabled={songs.length === 0}
              onClick={() => songs.length && onPlay?.(songs[0], songs)}
              className="flex h-16 w-16 items-center justify-center rounded-full
                         bg-primary-container text-on-primary-container
                         shadow-[0_0_20px_rgba(255,89,89,0.3)]
                         transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Icon name="play_arrow" filled className="text-[30px]" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-label-caps font-semibold uppercase tracking-widest text-primary">
            Playlist
          </span>
          <h2 className="text-headline-xl font-extrabold leading-tight text-on-surface">
            {playlist.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <span>{songs.length} Track{songs.length !== 1 ? 's' : ''}</span>
            <span className="h-1 w-1 rounded-full bg-surface-variant" />
            <span>{totalLabel(songs)}</span>
          </div>

          {/* Action bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              disabled={songs.length === 0}
              onClick={() => songs.length && onPlay?.(songs[0], songs)}
              className="flex items-center gap-2 rounded-full bg-primary-container
                         px-8 py-3 font-semibold text-headline-md text-on-primary-container
                         shadow-[0_0_20px_rgba(255,89,89,0.2)]
                         transition-all hover:brightness-110 hover:scale-105 disabled:opacity-50"
            >
              <Icon name="play_arrow" filled />
              Play All
            </button>
            <button
              type="button"
              onClick={handleDeletePlaylist}
              title="Delete Playlist"
              className="flex h-11 w-11 items-center justify-center rounded-full
                         border border-error-container/40 text-error
                         transition-colors hover:bg-error-container/20"
            >
              <Icon name="delete" />
            </button>
          </div>
        </div>
      </section>

      {/* Song Table */}
      <section className="mt-4">
        <SongTable
          songs={songs}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          onPlay={onPlay}
          onOpenContextMenu={handleOpenMenu}
        />
      </section>

      {/* Context Menu */}
      <SongContextMenu
        song={contextMenu.song}
        playlists={allPlaylists}
        isOpen={contextMenu.isOpen}
        position={contextMenu.pos}
        onClose={() => setContextMenu((c) => ({ ...c, isOpen: false }))}
        onAddToPlaylist={handleAddToPlaylist}
        onDeleteSong={handleRemoveFromPlaylist}
      />
    </div>
  )
}
