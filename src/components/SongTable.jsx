import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'

function formatDuration(sec) {
  if (!sec) return '--:--'
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function SongTable({
  songs = [],
  currentTrackId,
  isPlaying,
  isAudioLoading = false,
  onPlay,
  onOpenContextMenu,
}) {
  if (!songs || songs.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-surface-variant bg-surface-container-low text-on-surface-variant">
        <Icon name="music_note" className="text-[48px] opacity-40" />
        <p className="text-body-lg font-medium opacity-60">No songs found in this library</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container-low">
      <table className="w-full text-left text-body-sm text-on-surface-variant">
        <thead className="border-b border-surface-variant/50 bg-surface-container-high/60 text-label-caps font-semibold uppercase tracking-wider text-on-surface-variant">
          <tr>
            <th scope="col" className="w-12 py-3.5 text-center">#</th>
            <th scope="col" className="py-3.5 pl-2">Title</th>
            <th scope="col" className="hidden py-3.5 md:table-cell">Channel</th>
            <th scope="col" className="w-24 py-3.5 text-right pr-4">Duration</th>
            <th scope="col" className="w-16 py-3.5 text-center pr-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant/20">
          {songs.map((song, idx) => {
            const songId = song.id || song.youtubeId
            const isCurrent = currentTrackId === songId

            return (
              <tr
                key={songId}
                className={`group transition-colors duration-150 hover:bg-surface-container-high/80 ${
                  isCurrent ? 'bg-surface-container-highest/60 text-primary' : ''
                }`}
              >
                {/* Index / Play button / Spinner */}
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center">
                    {isCurrent && isAudioLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    ) : (
                      <>
                        <span className={`text-body-sm font-medium ${isCurrent ? 'text-primary font-bold' : 'group-hover:hidden'}`}>
                          {isCurrent && isPlaying ? (
                            <span className="material-symbols-outlined animate-pulse text-[18px] text-primary">
                              graphic_eq
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </span>
                    <button
                      type="button"
                      onClick={() => onPlay?.(song, songs)}
                      title="Play song"
                      className={`hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm transition-transform hover:scale-110 ${
                        isCurrent ? 'flex' : ''
                      }`}
                    >
                      <Icon name={isCurrent && isPlaying ? 'pause' : 'play_arrow'} filled className="text-[18px]" />
                    </button>
                  </>
                )}
                  </div>
                </td>

                {/* Title & Cover */}
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-surface-dim shadow-xs">
                      <CoverArt src={song.thumbnailUrl} alt={song.title} className="h-full w-full" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className={`truncate text-body-lg font-medium ${isCurrent ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                        {song.title}
                      </span>
                      <span className="truncate text-body-sm text-on-surface-variant md:hidden">
                        {song.channel || song.artist}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Channel */}
                <td className="hidden py-3 text-body-sm text-on-surface-variant md:table-cell">
                  <span className="truncate">{song.channel || song.artist || 'Unknown'}</span>
                </td>

                {/* Duration */}
                <td className="py-3 text-right text-body-sm text-on-surface-variant pr-4 font-mono">
                  {formatDuration(song.durationSec)}
                </td>

                {/* Context Actions */}
                <td className="py-3 text-center pr-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenContextMenu?.(song, e)
                    }}
                    title="Track options"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant opacity-60 transition-all hover:bg-surface-container-highest hover:opacity-100"
                  >
                    <Icon name="more_vert" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
