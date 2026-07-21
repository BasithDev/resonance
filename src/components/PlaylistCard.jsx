import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'

/**
 * Playlist card: framed container that highlights on hover; art scales 1.05x.
 * Pass `covers` (array) instead of `cover` for a 2x2 montage cover.
 */
function PlaylistCard({ name, trackCount, cover, covers, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-lg border border-transparent bg-surface-container-high p-4 transition-colors duration-300 hover:border-surface-variant hover:bg-surface-container-highest"
    >
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md bg-surface-dim shadow-md">
        <CoverArt
          src={cover}
          covers={covers}
          alt={`${name} cover`}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="mb-1 truncate text-headline-md text-on-surface">{name}</h3>
      <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
        <Icon name="queue_music" className="text-[16px]" />
        {trackCount} Tracks
      </p>
    </div>
  )
}

export default PlaylistCard
