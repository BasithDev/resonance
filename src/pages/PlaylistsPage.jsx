import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/Icon.jsx'
import CreatePlaylistModal from '../components/CreatePlaylistModal.jsx'
import * as api from '../api/index.js'

function fmt(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h} hr ${m} min`
  return `${m} min`
}

function totalDuration(songs = []) {
  return songs.reduce((acc, s) => acc + (s.durationSec ?? 0), 0)
}

// ── Playlist card ─────────────────────────────────────────────────────────────
function PlaylistCard({ playlist, onClick }) {
  const songs = playlist.songs || []
  const count = songs.length
  const dur = fmt(totalDuration(songs))
  const durText = dur && dur !== '0 min' ? ` · ${dur}` : ''

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3"
    >
      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[16px]
                      border border-[#333134] bg-surface-variant shadow-lg">
        {playlist.coverUrl || songs[0]?.thumbnailUrl
          ? <img
              src={playlist.coverUrl || songs[0]?.thumbnailUrl}
              alt={playlist.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          : <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
              <Icon name="queue_music" className="text-[64px] text-on-surface-variant/30" />
            </div>
        }
        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center
                        bg-black/40 opacity-0 backdrop-blur-[2px]
                        transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onClick?.() }}
            aria-label={`Play ${playlist.name}`}
            className="flex h-14 w-14 translate-y-3 items-center justify-center rounded-full
                       bg-primary-container text-white shadow-[0_0_20px_rgba(255,89,89,0.4)]
                       transition-all duration-300 group-hover:translate-y-0 hover:scale-105"
          >
            <Icon name="play_arrow" filled className="text-[32px] ml-0.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="truncate text-headline-md font-semibold text-on-surface
                         transition-colors group-hover:text-primary">
            {playlist.name}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {count} {count === 1 ? 'Track' : 'Tracks'}{durText}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Create new card ───────────────────────────────────────────────────────────
function CreateNewCard({ onClick }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      type="button"
      onClick={onClick}
      className="group flex aspect-square min-h-[220px] w-full cursor-pointer flex-col
                 items-center justify-center rounded-[16px] border border-dashed
                 border-[#333134] bg-[#252426] transition-colors duration-300
                 hover:border-primary/40 hover:bg-[#333134]"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full
                      bg-surface-dim text-on-surface-variant
                      transition-all duration-300
                      group-hover:scale-110 group-hover:bg-primary-container
                      group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,89,89,0.3)]">
        <Icon name="add" className="text-[32px]" />
      </div>
      <span className="text-headline-md font-semibold text-on-surface">Create New</span>
    </motion.button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlaylistsPage() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState([])
  const [allSongs, setAllSongs] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      setLoading(true)
      const [plData, songData] = await Promise.all([
        api.getPlaylists(),
        api.getSongs(),
      ])
      setPlaylists(Array.isArray(plData) ? plData : [])
      setAllSongs(Array.isArray(songData) ? songData : [])
    } catch (err) {
      console.error('Failed to load playlist data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = playlists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate({ name }) {
    try {
      const created = await api.createPlaylist({ name })
      setPlaylists(prev => [...prev, created])
      setModalOpen(false)
    } catch (err) {
      alert(err.message || 'Failed to create playlist')
    }
  }

  return (
    <div className="flex flex-col gap-unit-xl">
      {/* Page header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-xl font-extrabold text-on-surface">Your Playlists</h1>
          <p className="mt-1 text-body-lg text-on-surface-variant">
            Manage and curate your collection.
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find a playlist…"
            className="w-full rounded-full border border-transparent bg-[#252426]
                       py-3 pl-12 pr-4 text-body-lg text-on-surface
                       placeholder:text-surface-variant
                       transition-colors duration-200
                       focus:border-primary-container focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <CreateNewCard onClick={() => setModalOpen(true)} />
        {/* Default All Songs playlist card */}
        <PlaylistCard
          playlist={{
            id: 'all-songs',
            name: 'All Songs',
            songs: allSongs,
            coverUrl: null,
          }}
          onClick={() => navigate('/playlists/all-songs')}
        />
        {filtered.map(pl => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            onClick={() => navigate(`/playlists/${pl.id}`)}
          />
        ))}
        {filtered.length === 0 && search && (
          <div className="col-span-full py-16 text-center text-on-surface-variant">
            <Icon name="search_off" className="mx-auto mb-3 text-[48px] opacity-40" />
            <p className="text-body-lg">No playlists match "{search}"</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreatePlaylistModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
