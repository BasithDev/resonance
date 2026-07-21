import SongCard from '../components/SongCard.jsx'
import PlaylistCard from '../components/PlaylistCard.jsx'
import { recentlyPlayed, playlists } from '../data/mock.js'

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-unit-xl">
      <section>
        <div className="mb-unit-md flex items-center justify-between">
          <h2 className="text-headline-lg text-on-background">Recently Played</h2>
          <button
            type="button"
            className="text-body-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            See All
          </button>
        </div>
        <div className="hide-scrollbar flex snap-x gap-unit-md overflow-x-auto pb-4">
          {recentlyPlayed.map((song) => (
            <SongCard key={song.id} title={song.title} artist={song.artist} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-unit-md text-headline-lg text-on-background">Your Playlists</h2>
        <div className="grid grid-cols-2 gap-unit-md md:grid-cols-3 lg:grid-cols-4">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              name={pl.name}
              trackCount={pl.trackCount}
              covers={pl.montage ? [null, null, null, null] : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
