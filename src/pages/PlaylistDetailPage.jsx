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

export default function PlaylistDetailPage({
  playerTrack,
  isPlaying,
  repeatMode = 'none',
  shuffleOn = false,
  onPlay,
  onCycleRepeat,
  onToggleShuffle,
}) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState(null)
  const [allPlaylists, setAllPlaylists] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contextMenu, setContextMenu] = useState({ isOpen: false, song: null, pos: { x: 0, y: 0 } })

  async function loadPlaylist(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true)
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
      if (showSpinner) setLoading(false)
    }
  }

  useEffect(() => {
    setSearchQuery('')
    loadPlaylist(true)
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
      loadPlaylist(false)
    } catch (err) {
      alert(err.message || 'Failed to add song')
    }
  }

  async function handleRemoveFromPlaylist(song, targetPlaylistId) {
    const plId = targetPlaylistId || id
    try {
      await api.removeSongFromPlaylist(plId, song.id)
      if (plId === id) {
        setPlaylist((prev) => prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== song.id) } : null)
      } else {
        loadPlaylist(false)
      }
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

  function handleShufflePlay() {
    const trackList = playlist?.songs || []
    if (trackList.length > 0) {
      onPlay?.(trackList[0], trackList, { shuffle: true })
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-on-surface-variant">
        <Icon name="error_outline" className="text-[48px] text-error" />
        <p className="text-body-lg text-error font-semibold">{error || 'Playlist not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/playlists')}
          className="text-body-sm font-semibold text-primary hover:underline cursor-pointer"
        >
          Back to Playlists
        </button>
      </div>
    )
  }

  const songs = playlist.songs || []
  const filteredSongs = songs.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const title = (s.title || '').toLowerCase()
    const artist = (s.channel || s.artist || '').toLowerCase()
    return title.includes(q) || artist.includes(q)
  })

  const currentTrackId = playerTrack?.id || playerTrack?.youtubeId

  return (
    <div className="flex flex-col gap-unit-xl">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/playlists')}
        className="flex w-fit items-center gap-2 text-body-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface cursor-pointer"
      >
        <Icon name="arrow_back" />
        <span>Back to Playlists</span>
      </button>

      {/* Hero Details Header */}
      <section className="flex flex-col gap-6 md:flex-row md:items-end">
        {/* Cover */}
        <div className="group relative aspect-square w-full max-w-[200px] overflow-hidden
                        rounded-[20px] border border-surface-variant bg-surface-variant shadow-xl shrink-0">
          {playlist.coverUrl || songs[0]?.thumbnailUrl
            ? <img
                src={playlist.coverUrl || songs[0]?.thumbnailUrl}
                alt={playlist.name}
                className="h-full w-full object-cover"
              />
            : <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
                <Icon name="queue_music" className="text-[80px]" />
              </div>
          }
          <div className="absolute inset-0 flex items-center justify-center
                          bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              disabled={songs.length === 0}
              onClick={() => songs.length && onPlay?.(songs[0], songs)}
              className="flex h-16 w-16 items-center justify-center rounded-full
                         bg-primary text-on-primary
                         shadow-[0_0_20px_rgba(255,89,89,0.3)]
                         transition-transform hover:scale-110 disabled:opacity-50 cursor-pointer"
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
            {/* Play All */}
            <button
              disabled={songs.length === 0}
              onClick={() => songs.length && onPlay?.(songs[0], songs)}
              className="flex items-center gap-2 rounded-full bg-primary-container
                         px-7 py-3 font-semibold text-headline-md text-on-primary-container
                         shadow-[0_0_20px_rgba(255,89,89,0.2)]
                         transition-all hover:brightness-110 hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              <Icon name="play_arrow" filled className="text-[24px]" />
              <span>Play All</span>
            </button>

            {/* Shuffle Play */}
            <button
              disabled={songs.length === 0}
              onClick={handleShufflePlay}
              title="Shuffle Play Playlist"
              className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-body-sm transition-all hover:scale-105 disabled:opacity-50 cursor-pointer ${
                shuffleOn
                  ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(255,89,89,0.3)]'
                  : 'border border-surface-variant/80 bg-surface-container-high text-on-surface hover:bg-surface-container'
              }`}
            >
              <Icon name="shuffle" className="text-[20px]" />
              <span>Shuffle Play</span>
            </button>

            {/* Loop / Repeat Playlist */}
            <button
              disabled={songs.length === 0}
              onClick={onCycleRepeat}
              title={`Repeat Mode: ${repeatMode === 'one' ? 'Repeat Track' : repeatMode === 'all' ? 'Repeat Playlist' : 'Off'}`}
              className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-body-sm transition-all hover:scale-105 disabled:opacity-50 cursor-pointer ${
                repeatMode !== 'none'
                  ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(255,89,89,0.3)]'
                  : 'border border-surface-variant/80 bg-surface-container-high text-on-surface hover:bg-surface-container'
              }`}
            >
              <Icon name={repeatMode === 'one' ? 'repeat_one' : 'repeat'} className="text-[20px]" />
              <span>{repeatMode === 'one' ? 'Loop Track' : repeatMode === 'all' ? 'Loop Playlist' : 'Loop Off'}</span>
            </button>

            {/* Delete Playlist */}
            {id !== 'all-songs' && (
              <button
                type="button"
                onClick={handleDeletePlaylist}
                title="Delete Playlist"
                className="flex h-11 w-11 items-center justify-center rounded-full
                           border border-error-container/40 text-error
                           transition-colors hover:bg-error-container/20 cursor-pointer"
              >
                <Icon name="delete" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* In-Playlist Search & Filter Header */}
      <section className="mt-2 flex flex-col gap-4 border-t border-surface-variant/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-headline-md font-bold text-on-surface">Tracks in Playlist</h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {searchQuery
              ? `Showing ${filteredSongs.length} of ${songs.length} tracks`
              : `${songs.length} total tracks`}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this playlist…"
            className="w-full rounded-full border border-surface-variant/60 bg-surface-container-low py-2.5 pl-11 pr-9 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          )}
        </div>
      </section>

      {/* Song Table */}
      <section>
        {filteredSongs.length === 0 && searchQuery ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-surface-variant/60 bg-surface-container-low text-on-surface-variant">
            <Icon name="search_off" className="text-[42px] opacity-40" />
            <p className="text-body-lg">No tracks found matching "{searchQuery}"</p>
          </div>
        ) : (
          <SongTable
            songs={filteredSongs}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onOpenContextMenu={handleOpenMenu}
          />
        )}
      </section>

      {/* Context Menu */}
      <SongContextMenu
        song={contextMenu.song}
        playlists={allPlaylists}
        isOpen={contextMenu.isOpen}
        position={contextMenu.pos}
        currentPlaylistId={id}
        onClose={() => setContextMenu((c) => ({ ...c, isOpen: false }))}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
      />
    </div>
  )
}
