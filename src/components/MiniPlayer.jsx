import { useState, useEffect } from 'react'
import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'

/**
 * Persistent bottom bar.
 * Clicking ANYWHERE on it opens the full player, EXCEPT the transport
 * control buttons (prev, play/pause, next, shuffle, repeat) and volume —
 * those stop event propagation so they don't accidentally open the player.
 */
function MiniPlayer({
  track,
  isPlaying = false,
  isAudioLoading = false,
  progress = 0,
  bufferedProgress = 0,
  repeatMode = 'off',
  shuffleOn = false,
  sidebarWidth = 280,
  onOpen,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onSeekBy,
  onCycleRepeat,
  onToggleShuffle,
}) {
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [localPct, setLocalPct] = useState(() => (progress || 0) * 100)

  useEffect(() => {
    if (!isSeeking) {
      setLocalPct((progress || 0) * 100)
    }
  }, [progress, isSeeking])

  if (!track) return null

  const bufferedPct = `${Math.min(100, (bufferedProgress || 0) * 100)}%`
  const artist = track.channel || track.artist || ''

  function toggleMute() {
    setIsMuted(m => !m)
  }

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label="Open full player"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen?.() }}
      className="fixed bottom-0 right-0 z-40 flex h-20 cursor-pointer flex-col
                 border-t border-surface-variant bg-surface-container-high
                 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]
                 transition-[left] duration-300 ease-in-out
                 hover:bg-surface-container-highest"
      style={{ left: sidebarWidth }}
    >
      {/* Interactive Drag Scrubber Rail */}
      <div
        className="group relative h-2 w-full cursor-pointer bg-surface-variant"
        onClick={e => e.stopPropagation()}
      >
        {/* Pre-buffered rail (vivid pre-buffered bar) */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-[width] duration-200"
          style={{ width: bufferedPct }}
        />
        {/* Active playback progress rail */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full bg-primary-container shadow-[0_0_10px_rgba(255,89,89,0.8)]"
          style={{ width: `${Math.min(100, Math.max(0, localPct))}%` }}
        />
        {/* Range input for smooth click & drag seeking */}
        <input
          type="range"
          min="0"
          max="100"
          value={localPct}
          onMouseDown={e => { e.stopPropagation(); setIsSeeking(true) }}
          onMouseUp={e => { e.stopPropagation(); setIsSeeking(false) }}
          onTouchStart={e => { e.stopPropagation(); setIsSeeking(true) }}
          onTouchEnd={e => { e.stopPropagation(); setIsSeeking(false) }}
          onChange={e => {
            e.stopPropagation()
            const v = Number(e.target.value)
            setLocalPct(v)
            onSeek?.(v / 100)
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          style={{ margin: 0 }}
        />
        {/* Custom drag thumb */}
        <div
          className="pointer-events-none absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `${localPct}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-between px-margin-mobile md:px-margin-desktop">
        {/* Track info — propagates up to open the player */}
        <div className="flex w-1/3 min-w-[160px] items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-container shadow-md">
            <CoverArt src={track.thumbnailUrl} alt="" className="h-full w-full" />
            {isAudioLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm font-semibold leading-tight text-on-surface">
              {track.title}
            </span>
            <span className="truncate text-body-sm text-on-surface-variant">{artist}</span>
          </div>
        </div>

        {/* Transport controls — stop propagation so clicks don't open the full player */}
        <div
          className="flex flex-1 items-center justify-center gap-3 md:gap-5"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            className={`relative hidden transition-colors md:block ${
              shuffleOn ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="shuffle" className="text-[20px]" />
            {shuffleOn && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </button>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSeekBy?.(-5) }}
            aria-label="Rewind 5 seconds"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
            title="Rewind 5s"
          >
            <Icon name="replay_5" className="text-[22px]" />
          </button>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); onPrev?.() }}
            aria-label="Previous"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="skip_previous" filled className="text-[24px]" />
          </button>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); onPlayPause?.() }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-10 w-10 items-center justify-center rounded-full
                       bg-primary-container text-on-primary-container
                       shadow-[0_0_15px_rgba(255,89,89,0.3)]
                       transition-transform hover:scale-105 md:h-12 md:w-12"
          >
            {isAudioLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary-container/30 border-t-on-primary-container" />
            ) : (
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled />
            )}
          </button>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); onNext?.() }}
            aria-label="Next"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="skip_next" filled className="text-[24px]" />
          </button>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSeekBy?.(5) }}
            aria-label="Forward 5 seconds"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
            title="Forward 5s"
          >
            <Icon name="forward_5" className="text-[22px]" />
          </button>

          <button
            type="button"
            onClick={onCycleRepeat}
            aria-label="Repeat"
            className={`relative hidden transition-colors md:block ${
              repeatMode !== 'off' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name={repeatMode === 'one' ? 'repeat_one' : 'repeat'} className="text-[20px]" />
            {repeatMode !== 'off' && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Volume — stop propagation */}
        <div
          className="hidden w-1/3 items-center justify-end md:flex"
          onClick={e => e.stopPropagation()}
        >
          <div className="group flex w-32 items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Icon
                name={isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                className="text-[20px]"
              />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={e => {
                setVolume(Number(e.target.value))
                if (isMuted) setIsMuted(false)
              }}
              className="h-1 w-full cursor-pointer accent-primary bg-surface-variant rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiniPlayer
