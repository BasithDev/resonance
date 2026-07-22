// Static placeholder data — real YouTube IDs for thumbnails.
// Shape matches the API (songs table + playlists table) so swapping in real data later is trivial.

export const songs = [
  { id: 's1', title: 'Midnight City', channel: 'M83', youtubeId: 'dX3k_QDnzHE', thumbnailUrl: 'https://i.ytimg.com/vi/dX3k_QDnzHE/hqdefault.jpg', durationSec: 243 },
  { id: 's2', title: 'Nightcall', channel: 'Kavinsky', youtubeId: 'MV_3Dpw-BRY', thumbnailUrl: 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg', durationSec: 258 },
  { id: 's3', title: 'Starboy', channel: 'The Weeknd', youtubeId: 'CvXHNSRaZxY', thumbnailUrl: 'https://i.ytimg.com/vi/CvXHNSRaZxY/hqdefault.jpg', durationSec: 230 },
  { id: 's4', title: 'Instant Crush', channel: 'Daft Punk', youtubeId: 'a5uQMwRMHcs', thumbnailUrl: 'https://i.ytimg.com/vi/a5uQMwRMHcs/hqdefault.jpg', durationSec: 337 },
  { id: 's5', title: 'The Less I Know The Better', channel: 'Tame Impala', youtubeId: '2SUwOgmvzK4', thumbnailUrl: 'https://i.ytimg.com/vi/2SUwOgmvzK4/hqdefault.jpg', durationSec: 216 },
  { id: 's6', title: 'Get Lucky', channel: 'Daft Punk', youtubeId: '5NV6Rdv1h3I', thumbnailUrl: 'https://i.ytimg.com/vi/5NV6Rdv1h3I/hqdefault.jpg', durationSec: 248 },
  { id: 's7', title: 'Blinding Lights', channel: 'The Weeknd', youtubeId: '4NRXx6U8ekM', thumbnailUrl: 'https://i.ytimg.com/vi/4NRXx6U8ekM/hqdefault.jpg', durationSec: 200 },
  { id: 's8', title: 'Borderline', channel: 'Tame Impala', youtubeId: 'Gh3BHRzMnm8', thumbnailUrl: 'https://i.ytimg.com/vi/Gh3BHRzMnm8/hqdefault.jpg', durationSec: 222 },
  { id: 's9', title: 'Lone Digger', channel: 'Caravan Palace', youtubeId: 'UbQgXeY-zjU', thumbnailUrl: 'https://i.ytimg.com/vi/UbQgXeY-zjU/hqdefault.jpg', durationSec: 242 },
  { id: 's10', title: 'Ghost in the Machine', channel: 'Daft Punk', youtubeId: 'noZFsPNFiCw', thumbnailUrl: 'https://i.ytimg.com/vi/noZFsPNFiCw/hqdefault.jpg', durationSec: 280 },
]

// recentlyPlayed is a subset of songs (for LibraryPage)
export const recentlyPlayed = songs.slice(0, 5)

export const playlists = [
  {
    id: 'p1',
    name: 'Deep Focus',
    trackCount: 5,
    coverUrl: songs[0].thumbnailUrl,
    songs: songs.slice(0, 5),
  },
  {
    id: 'p2',
    name: 'Synthwave Essentials',
    trackCount: 4,
    coverUrl: songs[1].thumbnailUrl,
    songs: songs.slice(1, 5),
  },
  {
    id: 'p3',
    name: 'Favorites',
    trackCount: 6,
    coverUrl: songs[2].thumbnailUrl,
    songs: songs.slice(2, 8),
    montage: true,
  },
  {
    id: 'p4',
    name: 'Late Night Coding',
    trackCount: 5,
    coverUrl: songs[5].thumbnailUrl,
    songs: songs.slice(5, 10),
  },
]
