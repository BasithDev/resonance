import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import * as api from '../api/index.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(sec) {
  if (!sec) return '--:--'
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function isPlaylistUrl(url) {
  try {
    return new URL(url).searchParams.has('list')
  } catch {
    return false
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GlowInput({ value, onChange, onSubmit, loading }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
      className="group relative w-full"
    >
      {/* ambient glow behind the box */}
      <div className="absolute -inset-1 rounded-xl bg-linear-to-r from-primary-container to-tertiary-container opacity-20 blur transition duration-500 group-focus-within:opacity-40" />
      <div className="relative flex items-center rounded-xl border border-surface-variant bg-surface-container-high p-2 transition-all duration-300 focus-within:border-primary focus-within:[box-shadow:0_0_20px_rgba(255,89,89,0.15)]">
        <span className="material-symbols-outlined mx-3 text-on-surface-variant transition-colors duration-200 group-focus-within:text-primary">
          link
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a YouTube link or playlist URL…"
          autoComplete="off"
          className="h-14 w-full bg-transparent text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
        />
        {loading && (
          <div className="mx-3 h-5 w-5 animate-spin rounded-full border-2 border-surface-variant border-t-primary" />
        )}
      </div>
    </form>
  )
}

// Skeleton row while playlist tracks are loading
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-surface-variant/20 px-unit-md py-4 last:border-0">
      <div className="flex w-10 items-center justify-center">
        <div className="h-4 w-4 animate-pulse rounded bg-surface-variant" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-6 animate-pulse rounded bg-surface-variant" />
        <div className="h-4 w-48 animate-pulse rounded bg-surface-variant" />
      </div>
      <div className="flex w-20 justify-end pr-4">
        <div className="h-4 w-8 animate-pulse rounded bg-surface-variant" />
      </div>
    </div>
  )
}

// ─── Single-video resolved view ───────────────────────────────────────────────
function VideoPreview({ track, onImport, importing, importError }) {
  return (
    <section className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container">
      <div className="flex flex-col gap-unit-md border-b border-surface-variant bg-surface-container-low/50 p-unit-md md:flex-row md:gap-gutter md:p-gutter">
        {/* Thumbnail */}
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-surface-dim shadow-lg md:w-72">
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt={track.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container-highest">
              <Icon name="music_note" className="text-[64px] text-on-surface-variant" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Icon name="play_circle" filled className="text-[64px] text-white drop-shadow-md" />
          </div>
          {track.durationSec && (
            <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-semibold text-white">
              {formatDuration(track.durationSec)}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-1 flex-col justify-center gap-2">
          <span className="text-label-caps font-semibold uppercase tracking-widest text-primary">
            Track Resolved
          </span>
          <h3 className="text-headline-lg font-bold leading-tight text-on-surface">
            {track.title}
          </h3>
          <p className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            {track.channel && <span>{track.channel}</span>}
            {track.channel && track.durationSec && (
              <span className="h-1 w-1 rounded-full bg-surface-variant" />
            )}
            {track.durationSec && <span>{formatDuration(track.durationSec)}</span>}
            <span className="h-1 w-1 rounded-full bg-surface-variant" />
            <span>YouTube</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-surface-variant bg-surface-container-low p-unit-md">
        {importError && (
          <p className="rounded-lg border border-error-container bg-error-container/20 px-4 py-2 text-body-sm text-error">
            {importError}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onImport}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-on-primary shadow-[0_0_15px_rgba(255,89,89,0.25)] transition-all hover:brightness-110 disabled:opacity-50"
          >
            {importing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                Importing…
              </>
            ) : (
              <>
                <Icon name="download" />
                Import Track
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Playlist resolved view ───────────────────────────────────────────────────
function PlaylistPreview({ data, onImport, importing, importError }) {
  const { tracks } = data
  const [selected, setSelected] = useState(() => new Set(tracks.map((t) => t.youtubeId)))

  const allSelected = selected.size === tracks.length
  const noneSelected = selected.size === 0

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(tracks.map((t) => t.youtubeId)))
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const firstThumb = tracks.find((t) => t.thumbnailUrl)?.thumbnailUrl

  return (
    <section className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container">
      {/* Playlist header */}
      <div className="flex flex-col gap-unit-md border-b border-surface-variant bg-surface-container-low/50 p-unit-md md:flex-row md:gap-gutter md:p-gutter">
        {/* Thumbnail */}
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-surface-dim shadow-lg md:w-64">
          {firstThumb ? (
            <img
              src={firstThumb}
              alt="Playlist cover"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container-highest">
              <Icon name="queue_music" className="text-[64px] text-on-surface-variant" />
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-1 flex-col justify-center gap-2">
          <span className="text-label-caps font-semibold uppercase tracking-widest text-primary">
            Playlist Resolved
          </span>
          <h3 className="text-headline-lg font-bold leading-tight text-on-surface">
            YouTube Playlist
          </h3>
          <p className="flex flex-wrap items-center gap-3 text-body-sm text-on-surface-variant">
            <span>{tracks.length} Tracks</span>
            <span className="h-1 w-1 rounded-full bg-surface-variant" />
            <span>YouTube</span>
            <span className="h-1 w-1 rounded-full bg-surface-variant" />
            <span>{selected.size} selected</span>
          </p>
        </div>
      </div>

      {/* Track list */}
      <div className="bg-surface-container">
        {/* List header */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-surface-variant/50 px-unit-md py-3 text-label-caps font-semibold uppercase tracking-wider text-on-surface-variant">
          <div className="flex w-10 items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = !allSelected && !noneSelected }}
              onChange={toggleAll}
              className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-dim accent-primary"
            />
          </div>
          <div>Title</div>
          <div className="w-20 pr-4 text-right">Time</div>
        </div>

        {/* Scrollable track rows */}
        <div className="max-h-100 overflow-y-auto">
          {tracks.map((track, i) => (
            <div
              key={track.youtubeId}
              onClick={() => toggle(track.youtubeId)}
              className="group grid cursor-pointer grid-cols-[auto_1fr_auto] gap-4 border-b border-surface-variant/20 px-unit-md py-3 transition-colors duration-150 hover:bg-surface-container-high last:border-0"
            >
              <div className="flex w-10 items-center justify-center">
                <input
                  type="checkbox"
                  checked={selected.has(track.youtubeId)}
                  onChange={() => toggle(track.youtubeId)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-dim accent-primary"
                />
              </div>
              <div className="flex min-w-0 items-center gap-4 truncate">
                <span className="w-6 text-center text-body-sm text-on-surface-variant group-hover:hidden">
                  {i + 1}
                </span>
                <Icon
                  name="play_arrow"
                  className="hidden w-6 text-center text-primary group-hover:block"
                />
                <span className="truncate text-body-lg text-on-surface">{track.title}</span>
                {track.channel && (
                  <span className="hidden shrink-0 truncate text-body-sm text-on-surface-variant md:block">
                    {track.channel}
                  </span>
                )}
              </div>
              <div className="flex w-20 items-center justify-end pr-4 text-body-sm text-on-surface-variant">
                {formatDuration(track.durationSec)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-surface-variant bg-surface-container-low p-unit-md">
        {importError && (
          <p className="rounded-lg border border-error-container bg-error-container/20 px-4 py-2 text-body-sm text-error">
            {importError}
          </p>
        )}
        <div className="flex items-center justify-end gap-4">
          <span className="text-body-sm text-on-surface-variant">
            {selected.size} of {tracks.length} selected
          </span>
          <button
            type="button"
            onClick={() => onImport(tracks.filter((t) => selected.has(t.youtubeId)))}
            disabled={importing || selected.size === 0}
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-on-primary shadow-[0_0_15px_rgba(255,89,89,0.25)] transition-all hover:brightness-110 disabled:opacity-50"
          >
            {importing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                Importing…
              </>
            ) : (
              <>
                <Icon name="download" />
                Import Selected ({selected.size})
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <section className="overflow-hidden rounded-xl border border-error-container bg-error-container/10 p-unit-md">
      <div className="flex items-start gap-4">
        <Icon name="error" className="mt-0.5 shrink-0 text-[24px] text-error" />
        <div className="flex-1">
          <p className="font-semibold text-on-surface">Failed to resolve link</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-surface-variant px-4 py-2 text-body-sm text-on-surface transition-colors hover:bg-surface-container"
        >
          Retry
        </button>
      </div>
    </section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PasteLinkPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialUrl = searchParams.get('url') ?? ''
  const [inputUrl, setInputUrl] = useState(initialUrl)
  const [status, setStatus] = useState('idle') // idle | loading | resolved | error
  const [result, setResult] = useState(null)   // { type, data }
  const [resolveError, setResolveError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const hasAutoResolved = useRef(false)

  const resolve = useCallback(async (url) => {
    if (!url.trim()) return
    setStatus('loading')
    setResult(null)
    setResolveError('')
    setImportError('')

    try {
      const playlist = isPlaylistUrl(url)
      if (playlist) {
        const data = await api.previewPlaylist(url)
        setResult({ type: 'playlist', data })
      } else {
        const data = await api.previewVideo(url)
        setResult({ type: 'video', data })
      }
      setStatus('resolved')
    } catch (err) {
      setResolveError(err.message)
      setStatus('error')
    }
  }, [])

  // Auto-resolve when URL is pre-populated from the search bar
  useEffect(() => {
    if (initialUrl && !hasAutoResolved.current) {
      hasAutoResolved.current = true
      resolve(initialUrl)
    }
  }, [initialUrl, resolve])

  async function handleVideoImport() {
    if (result?.type !== 'video') return
    setImporting(true)
    setImportError('')
    try {
      await api.batchImportSongs([result.data])
      navigate('/')
    } catch (err) {
      setImportError(err.message)
      setImporting(false)
    }
  }

  async function handlePlaylistImport(selectedTracks) {
    setImporting(true)
    setImportError('')
    try {
      await api.batchImportSongs(selectedTracks)
      navigate('/')
    } catch (err) {
      setImportError(err.message)
      setImporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-unit-xl">
      {/* Page header */}
      <section className="space-y-3">
        <h2 className="text-headline-xl font-extrabold tracking-tight text-on-surface">
          Import Media
        </h2>
        <p className="max-w-2xl text-body-lg text-on-surface-variant">
          Paste a YouTube video or playlist link — tracks are resolved instantly and
          you choose what to add to your library.
        </p>
      </section>

      {/* Hero input */}
      <section>
        <GlowInput
          value={inputUrl}
          onChange={(v) => { setInputUrl(v); setStatus('idle'); setResult(null) }}
          onSubmit={resolve}
          loading={status === 'loading'}
        />
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Press <kbd className="rounded border border-surface-variant bg-surface-container px-1.5 py-0.5 text-xs font-mono text-on-surface">Enter</kbd> to resolve
        </p>
      </section>

      {/* Results area */}
      {status === 'loading' && (
        <section className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container">
          <div className="flex flex-col gap-unit-md border-b border-surface-variant bg-surface-container-low/50 p-unit-md md:flex-row md:gap-gutter md:p-gutter">
            <div className="aspect-video w-full animate-pulse rounded-lg bg-surface-variant md:w-64" />
            <div className="flex flex-1 flex-col justify-center gap-3">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-variant" />
              <div className="h-7 w-3/4 animate-pulse rounded bg-surface-variant" />
              <div className="h-4 w-40 animate-pulse rounded bg-surface-variant" />
            </div>
          </div>
          <div>
            {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </section>
      )}

      {status === 'error' && (
        <ErrorBanner message={resolveError} onRetry={() => resolve(inputUrl)} />
      )}

      {status === 'resolved' && result?.type === 'video' && (
        <VideoPreview
          track={result.data}
          onImport={handleVideoImport}
          importing={importing}
          importError={importError}
        />
      )}

      {status === 'resolved' && result?.type === 'playlist' && (
        <PlaylistPreview
          data={result.data}
          onImport={handlePlaylistImport}
          importing={importing}
          importError={importError}
        />
      )}
    </div>
  )
}
