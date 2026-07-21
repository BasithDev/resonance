import Icon from './Icon.jsx'

/**
 * Renders album/playlist artwork, falling back to an on-brand placeholder
 * when no image is available (real thumbnails arrive from YouTube later).
 * Pass `covers` (array) to render a 2x2 montage.
 */
function CoverArt({ src, covers, alt = '', className = '' }) {
  if (covers?.length) {
    return (
      <div className={`grid grid-cols-2 gap-1 bg-surface-container p-1 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) =>
          covers[i] ? (
            <img
              key={i}
              src={covers[i]}
              alt=""
              className="h-full w-full rounded-sm object-cover"
            />
          ) : (
            <div
              key={i}
              className="flex h-full w-full items-center justify-center rounded-sm bg-surface-container-highest"
            >
              <Icon name="music_note" className="text-on-surface-variant" />
            </div>
          ),
        )}
      </div>
    )
  }

  if (src) {
    return <img src={src} alt={alt} className={`object-cover ${className}`} />
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high ${className}`}
    >
      <Icon name="music_note" className="text-4xl text-on-surface-variant/40" />
    </div>
  )
}

export default CoverArt
