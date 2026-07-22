import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon.jsx'
import CoverArt from './CoverArt.jsx'
import * as api from '../api/index.js'

function fmtDur(sec) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function PasteLinkModal({ isOpen, onClose, onImportSuccess, onPlay, currentTrackId, isPlaying }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setUrl('')
      setLoading(false)
      setError('')
      setPreview(null)
      setImporting(false)
      setSuccessMsg('')
    }
  }, [isOpen])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && isOpen) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleResolve(e) {
    e?.preventDefault()
    if (!url.trim()) return
    setError('')
    setSuccessMsg('')
    setLoading(true)
    setPreview(null)

    try {
      if (url.includes('list=')) {
        const data = await api.previewPlaylist(url.trim())
        setPreview({ type: 'playlist', songs: data })
      } else {
        const data = await api.previewVideo(url.trim())
        setPreview({ type: 'video', song: data })
      }
    } catch (err) {
      setError(err.message || 'Failed to resolve link. Check URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!preview) return
    setImporting(true)
    setError('')
    try {
      if (preview.type === 'playlist') {
        await api.batchImportSongs(preview.songs)
      } else {
        await api.batchImportSongs([preview.song])
      }
      setSuccessMsg('Successfully added!')
      setTimeout(() => {
        onImportSuccess?.()
        onClose?.()
      }, 1000)
    } catch (err) {
      setError(err.message || 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-xl rounded-2xl border border-surface-variant bg-surface-container-high p-6 md:p-8 shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface cursor-pointer"
            >
              <Icon name="close" />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-md">
                <Icon name="link" className="text-[28px]" />
              </div>
              <div>
                <h2 className="text-headline-md font-extrabold text-on-surface">Import YouTube Media</h2>
                <p className="text-body-sm text-on-surface-variant">Paste a video or playlist link to preview & add songs</p>
              </div>
            </div>

            {/* URL Form */}
            <form onSubmit={handleResolve} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or playlist link"
                  className="flex-1 rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                  ) : (
                    <>
                      <Icon name="search" />
                      <span>Fetch</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-xl border border-error-container bg-error-container/10 p-4 text-body-sm text-error">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-4 text-body-lg font-bold text-primary">
                <Icon name="check_circle" filled />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Preview Box */}
            {preview && !successMsg && (
              <div className="mt-6 flex flex-col gap-4 border-t border-surface-variant pt-6">
                <h3 className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  Preview ({preview.type === 'playlist' ? `${preview.songs.length} Tracks` : 'Single Track'})
                </h3>

                {preview.type === 'video' && preview.song && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-surface-variant/80 bg-surface-container-low p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-variant shadow-md">
                        <CoverArt src={preview.song.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => onPlay?.(preview.song)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity hover:bg-black/60 cursor-pointer"
                        >
                          <Icon
                            name={currentTrackId === preview.song.youtubeId && isPlaying ? 'pause' : 'play_arrow'}
                            filled
                            className="text-[32px]"
                          />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-bold text-on-surface text-body-lg">{preview.song.title}</h4>
                        <div className="mt-1 flex items-center gap-3 text-body-sm text-on-surface-variant">
                          <span className="truncate">{preview.song.channel || 'Unknown Uploader'}</span>
                          {preview.song.durationSec && (
                            <span className="font-semibold shrink-0">· {fmtDur(preview.song.durationSec)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPlay?.(preview.song)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        <Icon
                          name={currentTrackId === preview.song.youtubeId && isPlaying ? 'pause' : 'play_arrow'}
                          filled
                          className="text-[26px]"
                        />
                      </button>
                    </div>
                  </div>
                )}

                {preview.type === 'playlist' && (
                  <div className="max-h-64 overflow-y-auto space-y-2 no-scrollbar pr-1">
                    {preview.songs.map((song, idx) => {
                      const isCurrent = currentTrackId === song.youtubeId
                      return (
                        <div key={idx} className="flex items-center gap-3 rounded-xl border border-surface-variant/50 bg-surface-container-low p-2.5 transition-colors hover:bg-surface-container">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-variant">
                            <CoverArt src={song.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => onPlay?.(song)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity hover:bg-black/60 cursor-pointer"
                            >
                              <Icon
                                name={isCurrent && isPlaying ? 'pause' : 'play_arrow'}
                                filled
                                className="text-[22px]"
                              />
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-body-sm font-semibold text-on-surface">{song.title}</h4>
                            <p className="truncate text-label-caps text-on-surface-variant/80">{song.channel}</p>
                          </div>
                          <span className="text-body-sm text-on-surface-variant font-medium shrink-0 px-1">
                            {fmtDur(song.durationSec)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onPlay?.(song)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                          >
                            <Icon name={isCurrent && isPlaying ? 'pause' : 'play_arrow'} filled className="text-[18px]" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  type="button"
                  disabled={importing}
                  onClick={handleImport}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3 font-bold text-on-primary-container shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {importing ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary-container/30 border-t-on-primary-container" />
                  ) : (
                    <>
                      <Icon name="download" />
                      <span>Import To Library</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
