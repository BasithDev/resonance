import { useState, useEffect, useRef } from 'react'
import Icon from './Icon.jsx'

export default function SongContextMenu({
  song,
  playlists = [],
  isOpen,
  position = { x: 0, y: 0 },
  onClose,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteSong,
  currentPlaylistId,
}) {
  const menuRef = useRef(null)
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || !song) return null

  const isCurrentPlaylistView = currentPlaylistId && currentPlaylistId !== 'all-songs'

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: Math.min(position.x, window.innerWidth - 240) }}
      className="fixed z-50 w-56 rounded-xl border border-surface-variant bg-surface-container-high p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Song Info Header */}
      <div className="border-b border-surface-variant/40 px-3 py-2">
        <p className="truncate text-body-sm font-semibold text-on-surface">{song.title}</p>
        <p className="truncate text-xs text-on-surface-variant">{song.channel || song.artist}</p>
      </div>

      <div className="py-1 flex flex-col gap-0.5">
        {/* Remove from current playlist (when inside a playlist view) */}
        {isCurrentPlaylistView && (
          <button
            type="button"
            onClick={() => {
              onRemoveFromPlaylist?.(song, currentPlaylistId)
              onClose?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-error transition-colors hover:bg-error-container/20 cursor-pointer"
          >
            <Icon name="remove_circle_outline" className="text-[18px]" />
            <span>Remove from Playlist</span>
          </button>
        )}

        {/* Add / Manage Playlists */}
        <button
          type="button"
          onClick={() => setShowPlaylistSubmenu((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-body-sm text-on-surface transition-colors hover:bg-surface-container-highest cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="playlist_add" className="text-[18px] text-primary" />
            <span>Add to Playlist</span>
          </div>
          <Icon name={showPlaylistSubmenu ? 'expand_less' : 'chevron_right'} className="text-[18px]" />
        </button>

        {/* Submenu for Playlists with In-Playlist indicators */}
        {showPlaylistSubmenu && (
          <div className="my-1 max-h-48 overflow-y-auto rounded-lg bg-surface-container-lowest p-1 no-scrollbar space-y-0.5">
            {playlists.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-on-surface-variant">No custom playlists created</p>
            ) : (
              playlists.map((pl) => {
                const inPl = (pl.songs || []).some(
                  (s) => s.id === song.id || (s.youtubeId && s.youtubeId === song.youtubeId)
                )
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      if (inPl) {
                        onRemoveFromPlaylist?.(song, pl.id)
                      } else {
                        onAddToPlaylist?.(song, pl.id)
                      }
                      onClose?.()
                    }}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-body-sm transition-colors cursor-pointer ${
                      inPl
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <Icon
                        name={inPl ? 'check_circle' : 'queue_music'}
                        filled={inPl}
                        className={`text-[16px] shrink-0 ${inPl ? 'text-primary' : 'text-on-surface-variant'}`}
                      />
                      <span className="truncate">{pl.name}</span>
                    </div>
                    {inPl && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary/80 shrink-0">
                        Added
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Delete from Master Library option */}
        {onDeleteSong && (
          <button
            type="button"
            onClick={() => {
              onDeleteSong?.(song)
              onClose?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-error transition-colors hover:bg-error-container/20 cursor-pointer"
          >
            <Icon name="delete" className="text-[18px]" />
            <span>Delete from Library</span>
          </button>
        )}
      </div>
    </div>
  )
}
