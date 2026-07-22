import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import CoverArt from '../components/CoverArt.jsx'
import SongContextMenu from '../components/SongContextMenu.jsx'
import * as api from '../api/index.js'

function fmtDur(sec) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function SearchPage({ onPlay, currentTrackId, isPlaying, isAudioLoading }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importedMap, setImportedMap] = useState({})
  const [importingId, setImportingId] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [contextMenu, setContextMenu] = useState({ isOpen: false, song: null, pos: { x: 0, y: 0 } })

  useEffect(() => {
    async function initData() {
      if (!query.trim()) {
        setResults([])
        return
      }
      try {
        setLoading(true)
        setError('')
        const [searchResults, librarySongs, userPlaylists] = await Promise.all([
          api.searchYouTube(query).catch(() => []),
          api.getSongs().catch(() => []),
          api.getPlaylists().catch(() => []),
        ])

        setResults(searchResults)
        setPlaylists(userPlaylists)

        // Mark songs that are already in library
        const existingIds = new Set(librarySongs.map(s => s.youtubeId))
        const map = {}
        for (const r of searchResults) {
          if (existingIds.has(r.youtubeId)) map[r.youtubeId] = true
        }
        setImportedMap(map)
      } catch (err) {
        setError(err.message || 'Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [query])

  async function handleImportSong(track) {
    if (importedMap[track.youtubeId]) return
    setImportingId(track.youtubeId)
    try {
      await api.batchImportSongs([track])
      setImportedMap(prev => ({ ...prev, [track.youtubeId]: true }))
    } catch (err) {
      alert(err.message || 'Failed to import song')
    } finally {
      setImportingId(null)
    }
  }

  function handleOpenMenu(track, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      isOpen: true,
      song: track,
      pos: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  async function handleAddToPlaylist(track, playlistId) {
    try {
      // Import first if not in library
      const [saved] = await api.batchImportSongs([track])
      await api.addSongToPlaylist(playlistId, saved.id)
      setImportedMap(prev => ({ ...prev, [track.youtubeId]: true }))
    } catch (err) {
      alert(err.message || 'Failed to add song to playlist')
    }
  }

  return (
    <div className="flex flex-col gap-unit-xl">
      {/* Search Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Icon name="search" className="text-[32px] text-primary" />
          <h1 className="text-headline-xl font-extrabold text-on-surface">Search Results</h1>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          {query ? `Showing YouTube results for "${query}"` : 'Enter a query in the top search bar'}
        </p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center rounded-2xl border border-surface-variant bg-surface-container-low">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/30 border-t-primary" />
            <span className="text-body-sm font-semibold text-on-surface-variant">Searching YouTube…</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-error-container bg-error-container/10 p-6 text-body-lg text-error">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Icon name="search_off" className="text-[54px] opacity-40" />
          <p className="text-body-lg">No tracks found for "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((track) => {
            const isCurrent = currentTrackId === track.youtubeId
            const isImported = importedMap[track.youtubeId]

            return (
              <div
                key={track.youtubeId}
                className="group relative flex flex-col justify-between rounded-2xl border border-surface-variant bg-surface-container-low p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container hover:shadow-xl"
              >
                {/* Thumbnail */}
                <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-surface-variant shadow-md">
                  <CoverArt src={track.thumbnailUrl} alt={track.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onPlay?.(track)}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      {isCurrent && isPlaying ? (
                        <Icon name="pause" filled className="text-[32px]" />
                      ) : (
                        <Icon name="play_arrow" filled className="text-[32px] ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Track Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-on-surface group-hover:text-primary transition-colors">
                    {track.title}
                  </h3>
                  <p className="truncate text-body-sm text-on-surface-variant/80 mt-0.5">
                    {track.channel || 'Unknown artist'}
                  </p>
                  <span className="text-body-sm text-on-surface-variant/60 font-medium">
                    {fmtDur(track.durationSec)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleImportSong(track)}
                    disabled={isImported || importingId === track.youtubeId}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-body-sm font-bold transition-all cursor-pointer ${
                      isImported
                        ? 'bg-surface-variant/60 text-primary border border-primary/20'
                        : 'bg-primary-container text-on-primary-container hover:brightness-110 shadow-md'
                    }`}
                  >
                    {importingId === track.youtubeId ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary-container/30 border-t-on-primary-container" />
                    ) : isImported ? (
                      <>
                        <Icon name="check_circle" filled className="text-[18px]" />
                        <span>In Library</span>
                      </>
                    ) : (
                      <>
                        <Icon name="add" className="text-[18px]" />
                        <span>Import</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenMenu(track, e)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-variant bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
                  >
                    <Icon name="more_vert" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Context Menu */}
      <SongContextMenu
        song={contextMenu.song}
        playlists={playlists}
        isOpen={contextMenu.isOpen}
        position={contextMenu.pos}
        onClose={() => setContextMenu((c) => ({ ...c, isOpen: false }))}
        onAddToPlaylist={handleAddToPlaylist}
      />
    </div>
  )
}
