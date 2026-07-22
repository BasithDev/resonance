import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon.jsx'

const ACCENT_COLORS = [
  { id: 'red',   bg: 'bg-primary-container',   ring: 'ring-primary',   label: 'Coral Red'  },
  { id: 'teal',  bg: 'bg-tertiary-container',  ring: 'ring-tertiary',  label: 'Emerald'    },
  { id: 'mono',  bg: 'bg-surface-bright',      ring: 'ring-outline',   label: 'Monochrome' },
]

/**
 * Create Playlist modal.
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   onCreate – ({ name, accent }) => void
 */
export default function CreatePlaylistModal({ isOpen, onClose, onCreate }) {
  const [name,   setName]   = useState('')
  const [accent, setAccent] = useState('red')
  const inputRef = useRef(null)

  // Auto-focus the name field when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
    } else {
      setName('')
      setAccent('red')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onCreate?.({ name: name.trim(), accent })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          />

          {/* Modal card */}
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-margin-mobile md:p-margin-desktop"
            // prevent backdrop click from firing twice
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-[540px] overflow-hidden rounded-[16px]
                            border border-surface-variant bg-surface-container-high shadow-2xl">

              {/* Header */}
              <div className="relative px-unit-lg pb-unit-sm pt-unit-lg">
                <h2 className="text-headline-lg font-bold text-on-surface">Create Playlist</h2>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  Curate your perfect sonic landscape.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center
                             rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-unit-lg p-unit-lg">
                {/* Name */}
                <div className="flex flex-col gap-unit-sm">
                  <label
                    htmlFor="pl-name"
                    className="text-label-caps font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Playlist Title
                  </label>
                  <input
                    ref={inputRef}
                    id="pl-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Deep Focus Vibes"
                    autoComplete="off"
                    className="w-full rounded-lg border border-transparent bg-[#252426]
                               px-4 py-3 text-body-lg text-on-surface
                               placeholder:text-outline-variant
                               transition-all duration-200
                               focus:border-primary focus:outline-none
                               focus:[box-shadow:0_0_15px_rgba(255,179,175,0.12)]"
                  />
                </div>

                {/* Theme accent */}
                <div className="flex flex-col gap-unit-sm">
                  <span className="text-label-caps font-semibold uppercase tracking-wider text-on-surface-variant">
                    Theme Accent
                  </span>
                  <div className="flex items-center gap-4 pt-1">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        aria-label={`Select ${c.label} theme`}
                        onClick={() => setAccent(c.id)}
                        className={`relative flex h-10 w-10 items-center justify-center
                                    rounded-full transition-transform hover:scale-110
                                    ${c.bg}
                                    ${accent === c.id
                                      ? `ring-2 ring-offset-2 ring-offset-surface-container-high ${c.ring}`
                                      : ''}`}
                      >
                        <AnimatePresence>
                          {accent === c.id && (
                            <motion.span
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                              className="material-symbols-outlined text-[18px] text-on-primary-container"
                            >
                              check
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="border-t border-surface-variant bg-surface-container px-unit-lg py-unit-md">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg
                             bg-primary-container py-4 font-semibold text-headline-md
                             text-on-primary-container
                             shadow-[0_0_20px_rgba(255,89,89,0.15)]
                             transition-all duration-200
                             hover:brightness-110 hover:shadow-[0_0_30px_rgba(255,89,89,0.3)]
                             disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="add_circle" filled />
                  Create Playlist
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
