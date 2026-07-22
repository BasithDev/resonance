import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SongTable from '../components/SongTable.jsx'
import SongContextMenu from '../components/SongContextMenu.jsx'
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

function LibraryPlaylistCard({ name, songs = [], coverUrl, onClick }) {
  const count = songs.length
  const dur = fmtDur(totalDuration(songs))
  const durText = dur && dur !== '0 min' ? ` · ${dur}` : ''
  const img = coverUrl || songs[0]?.thumbnailUrl

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-surface-variant bg-surface-container-low p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-variant shadow-md">
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant/30">
            <Icon name="queue_music" className="text-[54px]" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
            <Icon name="play_arrow" filled className="text-[28px] ml-0.5" />
          </div>
        </div>
      </div>
      <div>
        <h3 className="truncate text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          {count} {count === 1 ? 'Track' : 'Tracks'}{durText}
        </p>
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

  async function loadData() {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleOpenMenu(song, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      isOpen: true,
      song,
      pos: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  async function handleAddToPlaylist(song, playlistId) {
    try {
      await api.addSongToPlaylist(playlistId, song.id)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to add song to playlist')
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
        <div className="grid grid-cols-2 gap-unit-md md:grid-cols-3 lg:grid-cols-4">
          {/* Master All Songs Card */}
          <LibraryPlaylistCard
            name="All Songs"
            songs={songs}
            onClick={() => navigate('/playlists/all-songs')}
          />
          {playlists.map((pl) => (
            <LibraryPlaylistCard
              key={pl.id}
              name={pl.name}
              songs={pl.songs || []}
              coverUrl={pl.coverUrl}
              onClick={() => navigate(`/playlists/${pl.id}`)}
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
        onDeleteSong={handleDeleteSong}
      />
    </div>
  )
}
