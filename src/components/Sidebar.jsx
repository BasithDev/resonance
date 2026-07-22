import Icon from './Icon.jsx'

const NAV_ITEMS = [
  { id: 'library', label: 'Library', icon: 'library_music' },
  { id: 'playlists', label: 'Playlists', icon: 'playlist_play' },
  { id: 'export-import', label: 'Export/Import', icon: 'swap_vert' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

/**
 * Persistent app navigation. Collapses to a ~76px icon-only rail.
 *
 * Props:
 *   collapsed   - whether the rail is minimized
 *   onToggle    - () => void, flips collapsed state
 *   active      - id of the active nav item
 *   onSelect    - (id) => void
 *   onCreate    - () => void, "Create Playlist"
 */
function Sidebar({ collapsed, onToggle, active = 'library', onSelect, onCreate }) {
  return (
    <nav
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-surface-variant bg-surface-container-low py-unit-lg transition-all duration-300 ease-in-out ${
        collapsed ? 'w-19 px-unit-sm' : 'w-70 px-unit-md'
      }`}
    >
      {/* Border-centered collapse/expand toggle button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3.5 top-7 flex h-7 w-7 items-center justify-center rounded-full border border-surface-variant bg-surface-container-high text-on-surface-variant shadow-md transition-all duration-300 hover:scale-110 hover:bg-primary-container hover:text-on-primary-container cursor-pointer z-50"
      >
        <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} className="text-[18px]" />
      </button>

      {/* Brand header */}
      <div className="mb-unit-lg flex h-12 items-center px-1">
        <div
          className="flex items-center gap-3 overflow-hidden cursor-pointer"
          onClick={() => onSelect?.('library')}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(255,89,89,0.25)] transition-transform duration-300 hover:scale-105 ml-1">
            <Icon name="graphic_eq" filled />
          </span>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-xs opacity-100'
            }`}
          >
            <h1 className="whitespace-nowrap text-headline-md font-extrabold text-primary">
              Resonance
            </h1>
            <p className="whitespace-nowrap text-body-sm text-on-surface-variant">
              Premium Audio
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <ul className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group flex h-12 w-full items-center gap-4 rounded-xl px-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-highest font-semibold text-primary shadow-[0_0_20px_rgba(255,89,89,0.15)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon name={item.icon} filled={isActive} className="text-[22px]" />
                </div>
                <span
                  className={`overflow-hidden whitespace-nowrap text-body-lg transition-all duration-300 ease-in-out ${
                    collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-xs opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Create Playlist */}
      <div className="px-1">
        <button
          type="button"
          onClick={onCreate}
          title={collapsed ? 'Create Playlist' : undefined}
          className="flex h-12 w-full items-center gap-4 rounded-xl bg-primary-container px-3 font-semibold text-on-primary-container shadow-[0_0_15px_rgba(255,89,89,0.2)] transition-all duration-300 hover:brightness-110 cursor-pointer"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name="add" className="text-[24px]" />
          </div>
          <span
            className={`overflow-hidden whitespace-nowrap text-body-lg transition-all duration-300 ease-in-out ${
              collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-xs opacity-100'
            }`}
          >
            Create Playlist
          </span>
        </button>
      </div>
    </nav>
  )
}

export default Sidebar
