import { useState, useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import * as api from '../api/index.js'

export default function ExportImportPage() {
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Export State
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('all')

  // Import State
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [pastedText, setPastedText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadLibraryData()
  }, [])

  async function loadLibraryData() {
    try {
      setLoading(true)
      setError('')
      const [fetchedSongs, fetchedPlaylists] = await Promise.all([
        api.getSongs().catch(() => []),
        api.getPlaylists().catch(() => []),
      ])
      setSongs(Array.isArray(fetchedSongs) ? fetchedSongs : [])
      setPlaylists(Array.isArray(fetchedPlaylists) ? fetchedPlaylists : [])
    } catch (err) {
      setError('Failed to load library statistics')
    } finally {
      setLoading(false)
    }
  }

  // ── Helper: Download File in Browser ──────────────────────────────────────
  function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Export Handlers ───────────────────────────────────────────────────────
  function handleExportJSON() {
    let exportSongs = songs
    let exportPlaylists = playlists

    if (selectedPlaylistId !== 'all') {
      const pl = playlists.find(p => p.id === selectedPlaylistId)
      if (pl) {
        exportPlaylists = [pl]
        exportSongs = pl.songs || []
      }
    }

    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Resonance',
      songsCount: exportSongs.length,
      playlistsCount: exportPlaylists.length,
      songs: exportSongs.map(s => ({
        id: s.id,
        youtubeId: s.youtubeId,
        title: s.title,
        channel: s.channel || s.artist,
        durationSec: s.durationSec,
        thumbnailUrl: s.thumbnailUrl,
      })),
      playlists: exportPlaylists.map(p => ({
        id: p.id,
        name: p.name,
        songIds: (p.songs || []).map(s => s.id || s.youtubeId),
      })),
    }

    const jsonStr = JSON.stringify(payload, null, 2)
    const dateStr = new Date().toISOString().split('T')[0]
    const name = selectedPlaylistId === 'all' ? `resonance-backup-${dateStr}.json` : `resonance-playlist-${dateStr}.json`
    downloadFile(jsonStr, name, 'application/json')
  }

  function handleExportCSV() {
    let exportSongs = songs
    if (selectedPlaylistId !== 'all') {
      const pl = playlists.find(p => p.id === selectedPlaylistId)
      if (pl) exportSongs = pl.songs || []
    }

    const headers = ['Title', 'Artist/Channel', 'YouTube ID', 'Duration (Sec)', 'Thumbnail URL']
    const rows = exportSongs.map(s => [
      `"${(s.title || '').replace(/"/g, '""')}"`,
      `"${(s.channel || s.artist || '').replace(/"/g, '""')}"`,
      `"${s.youtubeId || s.id || ''}"`,
      s.durationSec || 0,
      `"${s.thumbnailUrl || ''}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const dateStr = new Date().toISOString().split('T')[0]
    downloadFile(csvContent, `resonance-library-${dateStr}.csv`, 'text/csv')
  }

  // ── Import Handlers ───────────────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setSuccessMsg('')
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result || ''
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text)
          const parsedSongs = parsed.songs || (Array.isArray(parsed) ? parsed : [])
          const parsedPlaylists = parsed.playlists || []
          setImportPreview({
            type: 'json',
            songs: parsedSongs,
            playlists: parsedPlaylists,
          })
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim())
          const parsedSongs = []
          // skip header if present
          const startIndex = lines[0].toLowerCase().includes('title') ? 1 : 0
          for (let i = startIndex; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim())
            if (cols.length >= 3) {
              parsedSongs.push({
                title: cols[0] || 'Unknown Track',
                channel: cols[1] || 'Unknown Artist',
                youtubeId: cols[2],
                durationSec: parseInt(cols[3]) || 0,
                thumbnailUrl: cols[4] || '',
              })
            }
          }
          setImportPreview({
            type: 'csv',
            songs: parsedSongs,
            playlists: [],
          })
        }
      } catch (err) {
        setError('Failed to parse import file format')
        setImportPreview(null)
      }
    }
    reader.readAsText(file)
  }

  async function handleExecuteImport() {
    setSuccessMsg('')
    setError('')

    let songsToImport = []
    let playlistsToCreate = []

    if (importPreview) {
      songsToImport = importPreview.songs || []
      playlistsToCreate = importPreview.playlists || []
    } else if (pastedText.trim()) {
      // Parse pasted URLs or IDs
      const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean)
      songsToImport = lines.map(line => {
        let ytid = line
        const match = line.match(/(?:v=|\/embed\/|\/1.1\/|youtu\.be\/|\/v\/|watch\?v=|\&v=)([^#\&\?]*)/)
        if (match && match[1]?.length === 11) ytid = match[1]
        return { youtubeId: ytid }
      })
    }

    if (songsToImport.length === 0 && playlistsToCreate.length === 0) {
      setError('No valid songs or playlists to import')
      return
    }

    setIsImporting(true)
    setImportProgress(10)
    setImportStatus('Importing songs into library…')

    try {
      // Batch import songs into DB
      if (songsToImport.length > 0) {
        await api.batchImportSongs(songsToImport)
      }
      setImportProgress(60)

      // Recreate custom playlists if in JSON backup
      if (playlistsToCreate.length > 0) {
        setImportStatus('Recreating custom playlists…')
        for (const pl of playlistsToCreate) {
          if (pl.name) {
            try {
              const created = await api.createPlaylist({ name: pl.name })
              if (created?.id && Array.isArray(pl.songIds)) {
                for (const songId of pl.songIds) {
                  await api.addSongToPlaylist(created.id, songId).catch(() => {})
                }
              }
            } catch (err) {
              // skip duplicate playlist creation
            }
          }
        }
      }

      setImportProgress(100)
      setSuccessMsg(`Successfully restored ${songsToImport.length} songs and ${playlistsToCreate.length} playlists!`)
      setImportFile(null)
      setImportPreview(null)
      setPastedText('')
      loadLibraryData()
    } catch (err) {
      setError(err.message || 'Import failed. Please verify your file contents.')
    } finally {
      setIsImporting(false)
      setImportStatus('')
    }
  }

  return (
    <div className="flex flex-col gap-unit-xl max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Icon name="swap_vert" className="text-[36px] text-primary" />
          <h1 className="text-headline-xl font-extrabold text-on-surface">Export & Import</h1>
        </div>
        <p className="text-body-lg text-on-surface-variant">
          Backup your music library, export playlists as JSON/CSV, or restore from a backup file.
        </p>
      </div>

      {/* Library Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-surface-variant bg-surface-container-low p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-sm">
            <Icon name="library_music" className="text-[28px]" />
          </div>
          <div>
            <span className="text-body-sm text-on-surface-variant font-medium">Master Library</span>
            <h3 className="text-headline-md font-extrabold text-on-surface">{songs.length} Tracks</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-surface-variant bg-surface-container-low p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high text-primary shadow-sm">
            <Icon name="playlist_play" className="text-[28px]" />
          </div>
          <div>
            <span className="text-body-sm text-on-surface-variant font-medium">Custom Playlists</span>
            <h3 className="text-headline-md font-extrabold text-on-surface">{playlists.length} Playlists</h3>
          </div>
        </div>
      </div>

      {/* Main Action Sections */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ── EXPORT SECTION ── */}
        <section className="flex flex-col gap-5 rounded-2xl border border-surface-variant bg-surface-container-low p-6 shadow-md">
          <div className="flex items-center gap-3 border-b border-surface-variant pb-4">
            <Icon name="file_download" className="text-[28px] text-primary" />
            <h2 className="text-headline-md font-bold text-on-surface">Export Library Data</h2>
          </div>

          <p className="text-body-sm text-on-surface-variant">
            Download your songs and playlists as a JSON backup or CSV spreadsheet file.
          </p>

          {/* Playlist Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-body-sm font-semibold text-on-surface">Select Collection to Export:</label>
            <select
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              className="rounded-xl border border-surface-variant bg-surface-container px-4 py-2.5 text-body-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">Entire Library ({songs.length} Tracks)</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({(pl.songs || []).length} Tracks)
                </option>
              ))}
            </select>
          </div>

          {/* Download Action Buttons */}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={songs.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-on-primary shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              <Icon name="data_object" />
              <span>Export as JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={songs.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-variant bg-surface-container-high px-5 py-3 font-bold text-on-surface shadow-sm hover:bg-surface-container hover:text-primary disabled:opacity-50 cursor-pointer"
            >
              <Icon name="table_chart" />
              <span>Export as CSV</span>
            </button>
          </div>
        </section>

        {/* ── IMPORT SECTION ── */}
        <section className="flex flex-col gap-5 rounded-2xl border border-surface-variant bg-surface-container-low p-6 shadow-md">
          <div className="flex items-center gap-3 border-b border-surface-variant pb-4">
            <Icon name="file_upload" className="text-[28px] text-primary" />
            <h2 className="text-headline-md font-bold text-on-surface">Import & Restore</h2>
          </div>

          <p className="text-body-sm text-on-surface-variant">
            Upload a `.json` backup file, a `.csv` spreadsheet, or paste YouTube links directly.
          </p>

          {/* File Upload Dropzone */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-variant bg-surface-container-high/50 p-6 text-center transition-colors hover:border-primary">
            <Icon name="cloud_upload" className="text-[40px] text-primary mb-2" />
            <p className="text-body-sm font-semibold text-on-surface">Click or drag `.json` / `.csv` file here</p>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="mt-3 text-body-sm text-on-surface-variant file:mr-4 file:rounded-xl file:border-0 file:bg-primary-container file:px-4 file:py-2 file:text-body-sm file:font-semibold file:text-on-primary-container hover:file:brightness-110 cursor-pointer"
            />
          </div>

          {/* Import File Preview Badge */}
          {importPreview && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-body-sm text-primary font-semibold flex items-center justify-between">
              <span>Ready: {importPreview.songs.length} songs, {importPreview.playlists.length} playlists</span>
              <button
                type="button"
                onClick={() => { setImportFile(null); setImportPreview(null); }}
                className="text-on-surface-variant hover:text-error cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>
          )}

          {/* Or Paste Text Links Box */}
          <div className="flex flex-col gap-2">
            <label className="text-body-sm font-semibold text-on-surface">Or Paste YouTube URLs line-by-line:</label>
            <textarea
              rows={3}
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); setImportPreview(null); setImportFile(null); }}
              placeholder="https://youtube.com/watch?v=...&#10;https://youtu.be/..."
              className="rounded-xl border border-surface-variant bg-surface-container px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Notification Messages */}
          {error && (
            <div className="rounded-xl border border-error-container bg-error-container/10 p-3 text-body-sm text-error">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-body-sm font-bold text-primary">
              <Icon name="check_circle" filled />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isImporting && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-body-sm font-semibold text-on-surface-variant">
                <span>{importStatus}</span>
                <span>{importProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Execute Import Button */}
          <button
            type="button"
            disabled={isImporting || (!importPreview && !pastedText.trim())}
            onClick={handleExecuteImport}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-3 font-bold text-on-primary-container shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {isImporting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary-container/30 border-t-on-primary-container" />
            ) : (
              <>
                <Icon name="download" />
                <span>Restore & Import</span>
              </>
            )}
          </button>
        </section>
      </div>
    </div>
  )
}
