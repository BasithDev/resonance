import { useState, useEffect, useRef } from 'react'
import Icon from './Icon.jsx'

export default function SongContextMenu({
  song,
  playlists = [],
  isOpen,
  position = { x: 0, y: 0 },
  onClose,
  onAddToPlaylist,
  onDeleteSong,
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

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: Math.min(position.x, window.innerWidth - 220) }}
      className="fixed z-50 w-52 rounded-xl border border-surface-variant bg-surface-container-high p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="border-b border-surface-variant/40 px-3 py-2">
        <p className="truncate text-body-sm font-semibold text-on-surface">{song.title}</p>
        <p className="truncate text-xs text-on-surface-variant">{song.channel || song.artist}</p>
      </div>

      <div className="py-1">
        {/* Add to Playlist Option */}
        <button
          type="button"
          onClick={() => setShowPlaylistSubmenu((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-body-sm text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="playlist_add" className="text-[18px] text-primary" />
            <span>Add to Playlist</span>
          </div>
          <Icon name={showPlaylistSubmenu ? 'expand_less' : 'chevron_right'} className="text-[18px]" />
        </button>

        {/* Submenu for Playlists */}
        {showPlaylistSubmenu && (
          <div className="my-1 max-h-40 overflow-y-auto rounded-lg bg-surface-container-lowest p-1">
            {playlists.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-on-surface-variant">No custom playlists created</p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => {
                    onAddToPlaylist?.(song, pl.id)
                    onClose?.()
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-body-sm text-on-surface hover:bg-surface-container-high"
                >
                  <Icon name="queue_music" className="text-[16px] text-on-surface-variant" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Delete option */}
        {onDeleteSong && (
          <button
            type="button"
            onClick={() => {
              onDeleteSong?.(song)
              onClose?.()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-error transition-colors hover:bg-error-container/20"
          >
            <Icon name="delete" className="text-[18px]" />
            <span>Remove / Delete</span>
          </button>
        )}
      </div>
    </div>
  )
}
