// Centralised API client. All paths are relative so the Vite dev proxy
// forwards them to http://127.0.0.1:4000 without any CORS issues.

const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = err.message || `Request failed (${res.status})`
    throw Object.assign(new Error(message), { status: res.status })
  }
  // 204 No Content
  if (res.status === 204) return null
  return res.json()
}

const get  = (path)        => request('GET',    path)
const post = (path, body)  => request('POST',   path, body)
const del  = (path)        => request('DELETE', path)

// ---------- Preview (no DB required) ----------
export const previewVideo    = (url) => post('/preview',          { url })
export const previewPlaylist = (url) => post('/preview/playlist', { url })

// ---------- Import (requires DB) ----------
export const batchImportSongs = (songs, playlistId) => post('/songs/batch', { songs, playlistId })

// ---------- Library / Songs ----------
export const getSongs   = ()   => get('/songs')
export const deleteSong = (id) => del(`/songs/${id}`)

// ---------- Playlists ----------
export const getPlaylists           = ()             => get('/playlists')
export const getPlaylistDetails     = (id)           => get(`/playlists/${id}`)
export const createPlaylist = (payload) => {
  const name = typeof payload === 'string' ? payload : payload?.name
  return post('/playlists', { name })
}
export const updatePlaylist       = (id, name)     => request('PATCH', `/playlists/${id}`, { name })
export const deletePlaylist         = (id)           => del(`/playlists/${id}`)
export const addSongToPlaylist     = (playlistId, songId) => post(`/playlists/${playlistId}/songs`, { songId })
export const removeSongFromPlaylist = (playlistId, songId) => del(`/playlists/${playlistId}/songs/${songId}`)

// ---------- Search ----------
export const searchYouTube = (q) => get(`/search?q=${encodeURIComponent(q)}`)
