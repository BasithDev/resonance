import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import SearchBar from './components/SearchBar.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import PasteLinkPage from './pages/PasteLinkPage.jsx'
import { currentTrack } from './data/mock.js'

const SIDEBAR_EXPANDED = 280
const SIDEBAR_COLLAPSED = 76

// Map route paths → sidebar nav IDs
const PATH_TO_NAV = {
  '/': 'library',
  '/paste-link': 'paste-link',
  '/playlists': 'playlists',
  '/export-import': 'export-import',
  '/settings': 'settings',
}
const NAV_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_NAV).map(([k, v]) => [v, k])
)

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('resonance:sidebar') === 'collapsed',
  )

  useEffect(() => {
    localStorage.setItem('resonance:sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
  const activeNav = PATH_TO_NAV[location.pathname] ?? 'library'

  function handleNavSelect(id) {
    const path = NAV_TO_PATH[id]
    if (path) navigate(path)
  }

  // SearchBar Enter handler: carry URL to paste-link page
  function handleSearchSubmit(url) {
    if (!url?.trim()) return
    navigate(`/paste-link?url=${encodeURIComponent(url.trim())}`)
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        active={activeNav}
        onSelect={handleNavSelect}
        onCreate={() => {}}
      />

      <div
        className="flex min-h-screen flex-col pb-20 transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Sticky header with paste input */}
        <header className="sticky top-0 z-30 flex items-center border-b border-surface-variant bg-surface/90 px-margin-mobile py-unit-md backdrop-blur-md md:px-margin-desktop">
          <div className="max-w-2xl flex-1">
            <SearchBar onSubmit={handleSearchSubmit} />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-margin-mobile py-unit-lg md:px-margin-desktop">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/paste-link" element={<PasteLinkPage />} />
            {/* Stub routes for future pages */}
            <Route path="/playlists" element={<ComingSoon title="Playlists" />} />
            <Route path="/export-import" element={<ComingSoon title="Export / Import" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" />} />
          </Routes>
        </div>
      </div>

      <MiniPlayer track={currentTrack} sidebarWidth={sidebarWidth} />
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
