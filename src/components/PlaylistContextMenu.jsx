import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon.jsx'

export default function PlaylistContextMenu({
  playlist,
  isOpen,
  position,
  onClose,
  onPlay,
  onShufflePlay,
  onRename,
  onDelete,
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !playlist) return null

  const isAllSongs = playlist.id === 'all-songs'

  // Position adjustments to prevent overflowing viewport bounds
  const x = Math.min(position.x, window.innerWidth - 200)
  const y = Math.min(position.y, window.innerHeight - 200)

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{ top: y, left: x }}
        className="fixed z-50 min-w-48 overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-high/95 p-1.5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex flex-col gap-0.5">
          {/* Play */}
          <button
            type="button"
            onClick={() => { onClose?.(); onPlay?.(playlist); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container hover:text-primary cursor-pointer"
          >
            <Icon name="play_arrow" filled className="text-[20px]" />
            <span>Play</span>
          </button>

          {/* Shuffle & Play */}
          <button
            type="button"
            onClick={() => { onClose?.(); onShufflePlay?.(playlist); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container hover:text-primary cursor-pointer"
          >
            <Icon name="shuffle" className="text-[20px]" />
            <span>Shuffle & Play</span>
          </button>

          {!isAllSongs && (
            <>
              <div className="my-1 h-px bg-surface-variant/50" />

              {/* Rename */}
              <button
                type="button"
                onClick={() => { onClose?.(); onRename?.(playlist); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container hover:text-primary cursor-pointer"
              >
                <Icon name="edit" className="text-[20px]" />
                <span>Rename</span>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => { onClose?.(); onDelete?.(playlist); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-body-sm font-semibold text-error transition-colors hover:bg-error-container/20 cursor-pointer"
              >
                <Icon name="delete" className="text-[20px]" />
                <span>Delete Playlist</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
