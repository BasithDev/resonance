import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'

/**
 * Album/song card. Hover shows a play overlay.
 *
 * Props:
 *   title, artist, cover (thumbnailUrl), onPlay – () => void
 */
function SongCard({ title, artist, cover, onPlay }) {
  return (
    <div className="group w-40 flex-none cursor-pointer snap-start">
      <div
        className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-surface-container shadow-lg"
        onClick={onPlay}
      >
        <CoverArt
          src={cover}
          alt={`${title} cover`}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40
                        opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onPlay?.() }}
            aria-label={`Play ${title}`}
            className="flex h-12 w-12 items-center justify-center rounded-full
                       bg-primary-container text-on-primary-container
                       shadow-[0_0_20px_rgba(255,89,89,0.5)]"
          >
            <Icon name="play_arrow" filled />
          </button>
        </div>
      </div>
      <h3 className="truncate text-body-lg font-semibold text-on-surface">{title}</h3>
      <p className="truncate text-body-sm text-on-surface-variant">{artist}</p>
    </div>
  )
}

export default SongCard
