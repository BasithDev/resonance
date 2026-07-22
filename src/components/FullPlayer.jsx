import { useState , useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'

function fmt(sec) {
  if (!sec && sec !== 0) return '--:--'
  const m = Math.floor(sec / 60)
  const s = String(Math.floor(sec % 60)).padStart(2, '0')
  return `${m}:${s}`
}

// ── Animation variants ────────────────────────────────────────────────────────
const panelVariants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 280, mass: 0.9 },
  },
  exit: {
    y: '100%',
    transition: { type: 'spring', damping: 32, stiffness: 300, mass: 0.8 },
  },
}

const artVariants = {
  hidden: { scale: 0.88, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { delay: 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const infoVariants = {
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.18, duration: 0.38, ease: 'easeOut' },
  },
}

const controlsVariants = {
  hidden: { y: 14, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.25, duration: 0.35, ease: 'easeOut' },
  },
}

/**
 * Full-screen "Now Playing" overlay — slides up from the bottom via Framer Motion.
 * AnimatePresence handles the first-open slide correctly.
 */
export default function FullPlayer({
  track,
  queue = [],
  currentIndex = 0,
  isOpen,
  isPlaying,
  isAudioLoading = false,
  progress = 0,
  bufferedProgress = 0,
  currentTime = 0,
  repeatMode = 'off',
  shuffleOn = false,
  onClose,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onSeekBy,
  onQueueSelect,
  onCycleRepeat,
  onToggleShuffle,
  sidebarWidth = 280,
}) {
  const [faved, setFaved]           = useState(false)
  const [isSeeking, setIsSeeking]   = useState(false)
  const [localPct, setLocalPct]     = useState(() => Math.round((progress || 0) * 100))

  // Sync localPct with parent progress unless user is actively dragging/seeking
  useEffect(() => {
    if (!isSeeking) {
      setLocalPct(Math.round((progress || 0) * 100))
    }
  }, [progress, isSeeking])

  const duration = track?.durationSec ?? 0
  const elapsed  = isSeeking ? Math.round((duration * localPct) / 100) : Math.floor(currentTime || 0)
  const artist   = track?.channel || track?.artist || 'Unknown'

  return (
    <AnimatePresence>
      {isOpen && track && (
        <motion.div
          key="full-player"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-y-0 right-0 z-50 flex flex-col"
          style={{ left: sidebarWidth }}
        >
          {/* ── Solid themed gradient background ── */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[#0f0d0d]" />
            <div className="absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,89,89,0.18),transparent)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e0a0a]/80 via-[#110d0d]/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0f0d0d] to-transparent" />
          </div>

          {/* ── Content ── */}
          <div className="relative z-10 flex h-full flex-col overflow-hidden">

            {/* Top bar */}
            <header className="flex shrink-0 items-center justify-between px-margin-mobile py-unit-md md:px-margin-desktop">
              <button
                onClick={onClose}
                aria-label="Minimise player"
                className="flex h-10 w-10 items-center justify-center rounded-full
                           bg-white/10 text-on-surface-variant backdrop-blur-sm
                           transition-colors hover:bg-white/20 hover:text-on-surface"
              >
                <Icon name="keyboard_arrow_down" className="text-[28px]" />
              </button>

              <span className="text-label-caps font-semibold uppercase tracking-widest text-on-surface-variant">
                Now Playing
              </span>

              <button
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full
                           text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <Icon name="more_horiz" />
              </button>
            </header>

            {/* Canvas: left (art + controls) | right (up next) */}
            <div className="flex flex-1 gap-unit-xl overflow-hidden px-margin-mobile pb-unit-lg md:px-margin-desktop">

              {/* ── Left ── */}
              <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto no-scrollbar min-w-0">

                {/* Album art */}
                <motion.div
                  variants={artVariants}
                  className="group relative mb-unit-lg w-full max-w-[420px] aspect-square cursor-pointer
                             overflow-hidden rounded-[20px]
                             shadow-[0_0_80px_10px_rgba(255,89,89,0.15),0_24px_60px_rgba(0,0,0,0.7)]"
                >
                  {track.thumbnailUrl
                    ? <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    : <CoverArt className="h-full w-full" />
                  }

                  {/* Audio Loading Spinner Overlay */}
                  {isAudioLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-10">
                      <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/30 border-t-primary shadow-[0_0_20px_rgba(255,89,89,0.5)]" />
                      <span className="mt-3 text-body-sm font-semibold tracking-wider text-white uppercase">Buffering…</span>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center
                                  bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                      onClick={onPlayPause}
                      className="flex h-20 w-20 translate-y-4 items-center justify-center rounded-full
                                 bg-primary/90 text-on-primary-container shadow-lg
                                 transition-all duration-300 group-hover:translate-y-0 hover:scale-105"
                    >
                      {isAudioLoading ? (
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-on-primary-container/30 border-t-on-primary-container" />
                      ) : (
                        <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled className="text-[44px]" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Track info */}
                <motion.div
                  variants={infoVariants}
                  className="mb-unit-md flex w-full max-w-[500px] items-end justify-between"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <h2 className="truncate text-headline-lg font-bold leading-tight text-on-surface">
                      {track.title}
                    </h2>
                    <p className="truncate text-headline-md text-on-surface-variant opacity-80">
                      {artist}
                    </p>
                  </div>
                  <button
                    onClick={() => setFaved(f => !f)}
                    aria-label={faved ? 'Unfavourite' : 'Favourite'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                               bg-primary/10 text-primary transition-all hover:bg-primary/20 hover:scale-110"
                  >
                    <Icon name="favorite" filled={faved} className="text-[22px]" />
                  </button>
                </motion.div>

                {/* Scrubber */}
                <motion.div variants={infoVariants} className="scrubber-group group mb-unit-md w-full max-w-[500px]">
                  <div className="relative" style={{ height: '20px' }}>
                    {/* Visual track */}
                    <div className="pointer-events-none absolute inset-x-0 top-[8px] h-[4px] overflow-hidden rounded-full bg-surface-variant">
                      {/* Pre-buffered rail (light shaded) */}
                      <div
                        className="h-full bg-white/25 transition-[width] duration-300"
                        style={{ width: `${Math.round(bufferedProgress * 100)}%` }}
                      />
                      {/* Active playback progress rail with smooth transition */}
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-primary shadow-[0_0_6px_rgba(255,89,89,0.7)] transition-[width] duration-150 ease-linear"
                        style={{ width: `${localPct}%` }}
                      />
                    </div>
                    {/* Invisible range for interaction */}
                    <input
                      type="range" min="0" max="100"
                      value={localPct}
                      onMouseDown={() => setIsSeeking(true)}
                      onMouseUp={() => setIsSeeking(false)}
                      onTouchStart={() => setIsSeeking(true)}
                      onTouchEnd={() => setIsSeeking(false)}
                      onChange={e => {
                        const v = Number(e.target.value)
                        setLocalPct(v)
                        onSeek?.(v / 100)
                      }}
                      className="absolute inset-0 w-full cursor-pointer opacity-0"
                      style={{ margin: 0, height: '20px' }}
                    />
                    {/* Custom thumb */}
                    <div
                      className="pointer-events-none absolute top-[8px] h-[14px] w-[14px]
                                 -translate-x-1/2 -translate-y-[5px] rounded-full bg-primary
                                 shadow-[0_0_8px_rgba(255,89,89,0.8)]
                                 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{ left: `${localPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-label-caps text-on-surface-variant">
                    <span>{fmt(elapsed)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </motion.div>

                {/* Controls */}
                <motion.div
                  variants={controlsVariants}
                  className="flex w-full max-w-[500px] items-center justify-between px-2"
                >
                  <button
                    onClick={onToggleShuffle}
                    aria-label="Shuffle"
                    className={`control-icon relative ${shuffleOn ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    <Icon name="shuffle" className="text-[24px]" />
                    {shuffleOn && (
                      <span className="absolute -bottom-1.5 left-1/2 block h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </button>

                  <div className="flex items-center gap-3 md:gap-5">
                    <button onClick={() => onSeekBy?.(-5)} aria-label="Rewind 5 seconds" title="Rewind 5s"
                      className="control-icon text-on-surface-variant hover:text-primary transition-colors">
                      <Icon name="replay_5" className="text-[28px]" />
                    </button>

                    <button onClick={onPrev} aria-label="Previous"
                      className="control-icon text-on-surface hover:text-primary transition-colors">
                      <Icon name="skip_previous" filled className="text-[36px]" />
                    </button>

                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.06 }}
                      onClick={onPlayPause}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      className="flex h-16 w-16 items-center justify-center rounded-full
                                 bg-primary text-on-primary-container
                                 shadow-[0_0_30px_rgba(255,89,89,0.4)]"
                    >
                      <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled className="text-[36px]" />
                    </motion.button>

                    <button onClick={onNext} aria-label="Next"
                      className="control-icon text-on-surface hover:text-primary transition-colors">
                      <Icon name="skip_next" filled className="text-[36px]" />
                    </button>

                    <button onClick={() => onSeekBy?.(5)} aria-label="Forward 5 seconds" title="Forward 5s"
                      className="control-icon text-on-surface-variant hover:text-primary transition-colors">
                      <Icon name="forward_5" className="text-[28px]" />
                    </button>
                  </div>

                  <button
                    onClick={onCycleRepeat}
                    aria-label="Repeat"
                    className={`control-icon relative ${repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    <Icon name={repeatMode === 'one' ? 'repeat_one' : 'repeat'} className="text-[24px]" />
                    {repeatMode !== 'off' && (
                      <span className="absolute -bottom-1.5 left-1/2 block h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </button>
                </motion.div>
              </div>

              {/* ── Right: Up Next (xl only) ── */}
              {queue.length > 0 && (
                <aside className="hidden xl:flex w-[360px] shrink-0 flex-col overflow-hidden
                                  rounded-[16px] border border-surface-variant
                                  bg-surface-container-low/70 backdrop-blur-md p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-headline-md font-semibold text-on-surface">Up Next</h3>
                    <span className="text-label-caps text-on-surface-variant">
                      {queue.length} track{queue.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="flex flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
                    {queue.map((item, i) => {
                      const active = i === currentIndex
                      return (
                        <li key={item.id || i}>
                          <button
                            type="button"
                            onClick={() => onQueueSelect?.(i)}
                            className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors
                              ${active ? 'bg-surface-container ring-1 ring-primary/30' : 'hover:bg-surface-container'}`}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-highest">
                              {item.thumbnailUrl
                                ? <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                                : <CoverArt className="h-full w-full" />
                              }
                              {active && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <Icon name={isPlaying ? 'equalizer' : 'play_arrow'} filled className="text-primary text-[18px]" />
                                </div>
                              )}
                              {!active && (
                                <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                                  <Icon name="play_arrow" filled className="text-white text-[18px]" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-body-lg font-medium ${active ? 'text-primary' : 'text-on-surface'}`}>
                                {item.title}
                              </p>
                              <p className="truncate text-body-sm text-on-surface-variant">
                                {item.channel || item.artist}
                              </p>
                            </div>
                            {item.durationSec && (
                              <span className="shrink-0 text-body-sm text-on-surface-variant">
                                {fmt(item.durationSec)}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </aside>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
