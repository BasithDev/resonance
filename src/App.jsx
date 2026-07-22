import { useEffect, useState, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import SearchBar from './components/SearchBar.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import FullPlayer from './components/FullPlayer.jsx'
import CreatePlaylistModal from './components/CreatePlaylistModal.jsx'
import PasteLinkModal from './components/PasteLinkModal.jsx'
import Icon from './components/Icon.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import PlaylistsPage from './pages/PlaylistsPage.jsx'
import PlaylistDetailPage from './pages/PlaylistDetailPage.jsx'
import * as api from './api/index.js'

const SIDEBAR_EXPANDED = 280
const SIDEBAR_COLLAPSED = 76

const PATH_TO_NAV = {
  '/': 'library',
  '/search': 'library',
  '/playlists': 'playlists',
  '/export-import': 'export-import',
  '/settings': 'settings',
}
const NAV_TO_PATH = {
  library: '/',
  playlists: '/playlists',
  'export-import': '/export-import',
  settings: '/settings',
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── Sidebar & Modals ──────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('resonance:sidebar') === 'collapsed',
  )
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('resonance:sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
  const activeNav = PATH_TO_NAV[location.pathname] ?? 'library'

  async function handleCreatePlaylist({ name }) {
    try {
      const playlist = await api.createPlaylist(name)
      setIsCreateModalOpen(false)
      if (playlist?.id) {
        navigate(`/playlists/${playlist.id}`)
      } else {
        navigate('/playlists')
      }
    } catch (err) {
      console.error('Failed to create playlist:', err)
    }
  }

  // ── Player & HTML5 Audio Engine ──────────────────────────────────────────
  const [playerTrack,      setPlayerTrack]      = useState(null)
  const [isPlaying,        setIsPlaying]        = useState(false)
  const [isPlayerOpen,     setIsPlayerOpen]     = useState(false)
  const [progress,         setProgress]         = useState(0)
  const [bufferedProgress, setBufferedProgress] = useState(0)
  const [currentTime,      setCurrentTime]      = useState(0)
  const [isAudioLoading,   setIsAudioLoading]   = useState(false)
  const [repeatMode,       setRepeatMode]       = useState('off') // 'off' | 'all' | 'one'
  const [shuffleOn,        setShuffleOn]        = useState(false)
  const [queue,            setQueue]            = useState([])
  const [queueIndex,       setQueueIndex]       = useState(0)

  const audioRef = useRef(null)
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio()
  }

  function cycleRepeatMode() {
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
  }

  function toggleShuffle() {
    setShuffleOn((s) => !s)
  }

  function getRandomQueueIndex(currentIdx, queueLen) {
    if (queueLen <= 1) return 0
    let rand = Math.floor(Math.random() * queueLen)
    if (rand === currentIdx) {
      rand = (rand + 1) % queueLen
    }
    return rand
  }

  // Handle track change & stream loading
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !playerTrack) return

    const songId = playerTrack.id || playerTrack.youtubeId
    const streamUrl = `/api/stream/${songId}`

    if (audio.src !== window.location.origin + streamUrl) {
      audio.src = streamUrl
      audio.load()
      setIsAudioLoading(true)
      setProgress(0)
      setBufferedProgress(0)
      setCurrentTime(0)
      if (isPlaying) {
        audio.play().catch((err) => console.warn('Audio play interrupted:', err))
      }
    }
  }, [playerTrack])

  // Attach audio event listeners (timeupdate, ended, waiting, playing, progress)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    function updateBuffered() {
      if (!audio || !audio.buffered || audio.buffered.length === 0) return
      const match = audio.src.match(/\?start=(\d+)/)
      const offset = match ? Number(match[1]) : 0
      const totalDur = playerTrack?.durationSec || audio.duration || 0

      if (totalDur > 0) {
        const endSec = audio.buffered.end(audio.buffered.length - 1) + offset
        setBufferedProgress(Math.min(1.0, endSec / totalDur))
      }
    }

    function onTimeUpdate() {
      const match = audio.src.match(/\?start=(\d+)/)
      const offset = match ? Number(match[1]) : 0
      const realCurrentTime = audio.currentTime + offset
      const totalDur = playerTrack?.durationSec || audio.duration

      setCurrentTime(realCurrentTime)

      if (totalDur && totalDur > 0) {
        setProgress(Math.min(1.0, realCurrentTime / totalDur))
      }

      updateBuffered()

      if (audio.currentTime > 0.1) {
        setIsAudioLoading(false)
      }
    }

    function onWaiting() {
      setIsAudioLoading(true)
    }

    function onPlaying() {
      setIsAudioLoading(false)
    }

    function onEnded() {
      setIsAudioLoading(false)

      if (repeatMode === 'one') {
        // Reset stream URL so looping plays cleanly from 0:00
        if (playerTrack) {
          const songId = playerTrack.id || playerTrack.youtubeId
          audio.src = `/api/stream/${songId}`
          audio.load()
          audio.play().catch((err) => console.warn('Replay error:', err))
          setIsPlaying(true)
          setProgress(0)
          setBufferedProgress(0)
          setCurrentTime(0)
        }
      } else if (shuffleOn) {
        // Shuffle mode: pick random track from queue
        const nextIdx = getRandomQueueIndex(queueIndex, queue.length)
        setQueueIndex(nextIdx)
        if (queue[nextIdx]) setPlayerTrack(queue[nextIdx])
      } else if (repeatMode === 'all') {
        // Loop whole queue
        const nextIdx = (queueIndex + 1) % (queue.length || 1)
        setQueueIndex(nextIdx)
        if (queue[nextIdx]) setPlayerTrack(queue[nextIdx])
      } else {
        // Repeat off
        if (queueIndex < queue.length - 1) {
          const nextIdx = queueIndex + 1
          setQueueIndex(nextIdx)
          setPlayerTrack(queue[nextIdx])
        } else {
          setIsPlaying(false)
          setProgress(0)
          setCurrentTime(0)
        }
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('progress', updateBuffered)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('progress', updateBuffered)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('ended', onEnded)
    }
  }, [queueIndex, queue, playerTrack, repeatMode, shuffleOn])

  /** Start playing a track. Optionally pass the full queue it belongs to. */
  function playTrack(track, trackQueue) {
    if (!track) return
    const q   = trackQueue ?? [track]
    const idx = q.findIndex(t => (t.id || t.youtubeId) === (track.id || track.youtubeId))
    setPlayerTrack(track)
    setQueue(q)
    setQueueIndex(Math.max(0, idx))
    setIsPlaying(true)
    setIsAudioLoading(true)
    setProgress(0)
    setBufferedProgress(0)
    setCurrentTime(0)
    setIsPlayerOpen(true)

    const audio = audioRef.current
    if (audio) {
      const songId = track.id || track.youtubeId
      audio.src = `/api/stream/${songId}`
      audio.play().catch((err) => console.warn('Audio play error:', err))
    }
  }

  function handlePlayPause() {
    const audio = audioRef.current
    if (!audio || !playerTrack) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch((err) => console.warn('Audio play error:', err))
      setIsPlaying(true)
    }
  }

  function handleSeek(pct) {
    const audio = audioRef.current
    if (!audio || !playerTrack) return

    const totalDur = playerTrack.durationSec || audio.duration || 0
    const targetSec = Math.floor(pct * totalDur)

    const match = audio.src.match(/\?start=(\d+)/)
    const streamOffset = match ? Number(match[1]) : 0
    const localTarget = targetSec - streamOffset

    // 1. Instant Seek: If target time is already pre-buffered in RAM, seek immediately with 0ms delay!
    let isBuffered = false
    if (audio.buffered && localTarget >= 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (localTarget >= audio.buffered.start(i) && localTarget <= audio.buffered.end(i)) {
          isBuffered = true
          break
        }
      }
    }

    if (isBuffered) {
      audio.currentTime = localTarget
      setCurrentTime(targetSec)
      setProgress(pct)
      return
    }

    // 2. Fetch new stream section starting at targetSec if not in RAM buffer
    setProgress(pct)
    setCurrentTime(targetSec)
    setIsAudioLoading(true)

    const songId = playerTrack.id || playerTrack.youtubeId
    const streamUrl = `/api/stream/${songId}?start=${targetSec}`

    audio.src = streamUrl
    audio.play().catch((err) => console.warn('Audio seek error:', err))
  }

  function handleSeekBy(seconds) {
    const audio = audioRef.current
    if (!audio || !playerTrack) return

    const totalDur = playerTrack.durationSec || audio.duration || 0
    const match = audio.src.match(/\?start=(\d+)/)
    const streamOffset = match ? Number(match[1]) : 0
    const currentRealTime = audio.currentTime + streamOffset
    const newTime = Math.max(0, Math.min(totalDur, currentRealTime + seconds))
    const newPct = totalDur > 0 ? newTime / totalDur : 0
    handleSeek(newPct)
  }

  function handleNext() {
    if (queue.length === 0) return
    if (shuffleOn) {
      const nextIdx = getRandomQueueIndex(queueIndex, queue.length)
      setQueueIndex(nextIdx)
      setPlayerTrack(queue[nextIdx])
      setIsPlaying(true)
    } else if (queueIndex < queue.length - 1) {
      const i = queueIndex + 1
      setQueueIndex(i)
      setPlayerTrack(queue[i])
      setIsPlaying(true)
    }
  }

  function handlePrev() {
    if (queue.length === 0) return
    if (shuffleOn) {
      const prevIdx = getRandomQueueIndex(queueIndex, queue.length)
      setQueueIndex(prevIdx)
      setPlayerTrack(queue[prevIdx])
      setIsPlaying(true)
    } else if (queueIndex > 0) {
      const i = queueIndex - 1
      setQueueIndex(i)
      setPlayerTrack(queue[i])
      setIsPlaying(true)
    }
  }

  function handleQueueSelect(i) {
    setQueueIndex(i)
    setPlayerTrack(queue[i])
    setIsPlaying(true)
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  function handleNavSelect(id) {
    if (id === 'paste-link') {
      setIsPasteModalOpen(true)
      return
    }
    const path = NAV_TO_PATH[id]
    if (path) navigate(path)
  }

  function handleSearchSubmit(query) {
    if (!query?.trim()) return
    const str = query.trim()
    if (str.startsWith('http://') || str.startsWith('https://') || str.includes('youtube.com') || str.includes('youtu.be')) {
      setIsPasteModalOpen(true)
    } else {
      navigate(`/search?q=${encodeURIComponent(str)}`)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        active={activeNav}
        onSelect={handleNavSelect}
        onCreate={() => setIsCreateModalOpen(true)}
      />

      {/* Content area (pushed right of sidebar) */}
      <div
        className="flex min-h-screen flex-col pb-20 transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-surface-variant
                           bg-surface/90 px-margin-mobile py-unit-md backdrop-blur-md md:px-margin-desktop">
          <div className="max-w-2xl flex-1">
            <SearchBar onSubmit={handleSearchSubmit} />
          </div>

          <button
            type="button"
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface border border-surface-variant/40 hover:bg-surface-container hover:text-primary transition-all cursor-pointer shadow-sm"
          >
            <Icon name="link" className="text-[20px]" />
            <span className="hidden sm:inline">Import Link</span>
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 px-margin-mobile py-unit-lg md:px-margin-desktop">
          <Routes>
            <Route path="/" element={
              <LibraryPage
                onPlay={playTrack}
                currentTrackId={playerTrack?.id || playerTrack?.youtubeId}
                isPlaying={isPlaying}
                isAudioLoading={isAudioLoading}
              />
            } />
            <Route path="/search" element={
              <SearchPage
                onPlay={playTrack}
                currentTrackId={playerTrack?.id || playerTrack?.youtubeId}
                isPlaying={isPlaying}
                isAudioLoading={isAudioLoading}
              />
            } />
            <Route path="/playlists"   element={<PlaylistsPage onPlay={playTrack} />} />
            <Route path="/playlists/:id" element={
              <PlaylistDetailPage
                playerTrack={playerTrack}
                isPlaying={isPlaying}
                isAudioLoading={isAudioLoading}
                onPlay={playTrack}
              />
            } />
            <Route path="/export-import" element={<ComingSoon title="Export / Import" />} />
            <Route path="/settings"    element={<ComingSoon title="Settings" />} />
          </Routes>
        </div>
      </div>

      {/* Mini player bar */}
      <MiniPlayer
        track={playerTrack}
        isPlaying={isPlaying}
        isAudioLoading={isAudioLoading}
        progress={progress}
        bufferedProgress={bufferedProgress}
        repeatMode={repeatMode}
        shuffleOn={shuffleOn}
        sidebarWidth={sidebarWidth}
        onOpen={() => setIsPlayerOpen(true)}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onSeekBy={handleSeekBy}
        onCycleRepeat={cycleRepeatMode}
        onToggleShuffle={toggleShuffle}
      />

      {/* Full-screen player overlay */}
      <FullPlayer
        track={playerTrack}
        queue={queue}
        currentIndex={queueIndex}
        isOpen={isPlayerOpen}
        isPlaying={isPlaying}
        isAudioLoading={isAudioLoading}
        progress={progress}
        bufferedProgress={bufferedProgress}
        currentTime={currentTime}
        repeatMode={repeatMode}
        shuffleOn={shuffleOn}
        sidebarWidth={sidebarWidth}
        onClose={() => setIsPlayerOpen(false)}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onSeekBy={handleSeekBy}
        onQueueSelect={handleQueueSelect}
        onCycleRepeat={cycleRepeatMode}
        onToggleShuffle={toggleShuffle}
      />

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />

      <PasteLinkModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onPlay={playTrack}
        currentTrackId={playerTrack?.id || playerTrack?.youtubeId}
        isPlaying={isPlaying}
        onImportSuccess={() => {}}
      />
    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-on-surface-variant">
      <span className="material-symbols-outlined text-[48px] opacity-40">construction</span>
      <p className="text-headline-md font-semibold opacity-50">{title} — coming soon</p>
    </div>
  )
}

export default App
