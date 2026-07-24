import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/Icon.jsx'
import CreatePlaylistModal from '../components/CreatePlaylistModal.jsx'
import PlaylistContextMenu from '../components/PlaylistContextMenu.jsx'
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
function PlaylistCard({ playlist, onClick, onOpenMenu }) {
  const songs = playlist.songs || []
  const count = songs.length
  const dur = fmt(totalDuration(songs))
  const durText = dur && dur !== '0 min' ? ` · ${dur}` : ''

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-surface-variant bg-surface-container-low p-4 shadow-md transition-colors hover:bg-surface-container"
    >
      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[16px] border border-surface-variant bg-surface-variant shadow-sm">
        {playlist.coverUrl || songs[0]?.thumbnailUrl ? (
          <img
            src={playlist.coverUrl || songs[0]?.thumbnailUrl}
            alt={playlist.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
            <Icon name="queue_music" className="text-[64px] text-on-surface-variant/30" />
          </div>
        )}
      </div>

      {/* Info & 3-Dot Menu */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="truncate text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
            {playlist.name}
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {count} {count === 1 ? 'Track' : 'Tracks'}{durText}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenMenu?.(playlist, e)
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
        >
          <Icon name="more_vert" />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlaylistsPage({ onPlay }) {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState([])
  const [allSongs, setAllSongs] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState({ isOpen: false, playlist: null, pos: { x: 0, y: 0 } })

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

  function handleOpenMenu(playlist, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      isOpen: true,
      playlist,
      pos: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  function handlePlayPlaylist(playlist) {
    const trackList = playlist.id === 'all-songs' ? allSongs : (playlist.songs || [])
    if (trackList.length > 0) {
      onPlay?.(trackList[0], trackList)
    }
  }

  function handleShufflePlayPlaylist(playlist) {
    const trackList = playlist.id === 'all-songs' ? allSongs : (playlist.songs || [])
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
            className="w-full rounded-full border border-surface-variant bg-surface-container-low py-3 pl-12 pr-4 text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Default All Songs playlist card */}
        <PlaylistCard
          playlist={{
            id: 'all-songs',
            name: 'All Songs',
            songs: allSongs,
            coverUrl: null,
          }}
          onClick={() => navigate('/playlists/all-songs')}
          onOpenMenu={handleOpenMenu}
        />
        {filtered.map(pl => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            onClick={() => navigate(`/playlists/${pl.id}`)}
            onOpenMenu={handleOpenMenu}
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

      {/* Playlist Context Menu */}
      <PlaylistContextMenu
        playlist={contextMenu.playlist}
        isOpen={contextMenu.isOpen}
        position={contextMenu.pos}
        onClose={() => setContextMenu(c => ({ ...c, isOpen: false }))}
        onPlay={handlePlayPlaylist}
        onShufflePlay={handleShufflePlayPlaylist}
        onRename={handleRenamePlaylist}
        onDelete={handleDeletePlaylist}
      />
    </div>
  )
}
