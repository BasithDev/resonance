import { useState } from 'react'
import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'

/**
 * Persistent mini player. Matches code.html but drops the favorite, lyrics and
 * queue controls per spec. `sidebarWidth` offsets it to sit beside the rail.
 *
 * Props:
 *   track        - { title, artist, cover }
 *   progress     - 0..1 playback position
 *   sidebarWidth - px offset for the desktop left edge
 */
function MiniPlayer({ track, progress = 0.33, sidebarWidth = 280 }) {
  const [playing, setPlaying] = useState(true)
  const pct = `${Math.round(progress * 100)}%`

  if (!track) return null

  return (
    <div
      className="fixed bottom-0 right-0 z-40 flex h-20 flex-col border-t border-surface-variant bg-surface-container-high shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-[left] duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      {/* Progress rail */}
      <div className="group relative h-1 w-full cursor-pointer bg-surface-variant">
        <div
          className="absolute left-0 top-0 h-full bg-primary-container shadow-[0_0_10px_rgba(255,89,89,0.8)]"
          style={{ width: pct }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: pct }}
        />
      </div>

      <div className="flex flex-1 items-center justify-between px-margin-mobile md:px-margin-desktop">
        {/* Track info */}
        <div className="flex w-1/3 min-w-[160px] items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-md bg-surface-container shadow-md">
            <CoverArt src={track.cover} alt="" className="h-full w-full" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-body-sm font-semibold leading-tight text-on-surface">
              {track.title}
            </span>
            <span className="truncate text-body-sm text-on-surface-variant">
              {track.artist}
            </span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex flex-1 items-center justify-center gap-4 md:gap-6">
          <button
            type="button"
            aria-label="Shuffle"
            className="hidden text-on-surface-variant transition-colors hover:text-on-surface md:block"
          >
            <Icon name="shuffle" className="text-[20px]" />
          </button>
          <button
            type="button"
            aria-label="Previous"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="skip_previous" filled className="text-[24px]" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(255,89,89,0.3)] transition-transform hover:scale-105 md:h-12 md:w-12"
          >
            <Icon name={playing ? 'pause' : 'play_arrow'} filled />
          </button>
          <button
            type="button"
            aria-label="Next"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="skip_next" filled className="text-[24px]" />
          </button>
          <button
            type="button"
            aria-label="Repeat"
            className="hidden text-on-surface-variant transition-colors hover:text-on-surface md:block"
          >
            <Icon name="repeat" className="text-[20px]" />
          </button>
        </div>

        {/* Volume (desktop) */}
        <div className="hidden w-1/3 items-center justify-end md:flex">
          <div className="group flex w-24 items-center gap-2">
            <Icon
              name="volume_up"
              className="text-[20px] text-on-surface-variant"
            />
            <div className="relative h-1 w-full cursor-pointer rounded-full bg-surface-variant">
              <div className="absolute left-0 top-0 h-full w-2/3 rounded-full bg-on-surface-variant transition-colors group-hover:bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiniPlayer
