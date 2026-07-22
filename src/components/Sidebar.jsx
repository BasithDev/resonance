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
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-surface-variant bg-surface-container-low py-unit-lg transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-19 px-unit-sm' : 'w-70 px-unit-md'
      }`}
    >
      {/* Brand + collapse toggle */}
      <div
        className={`mb-unit-lg flex items-center ${
          collapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-2'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelect?.('library')}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(255,89,89,0.25)]">
            <Icon name="graphic_eq" filled />
          </span>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="truncate text-headline-md font-extrabold text-primary">
                Resonance
              </h1>
              <p className="truncate text-body-sm text-on-surface-variant">
                Premium Audio
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer"
        >
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} />
        </button>
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
                className={`group flex w-full items-center rounded-lg py-3 transition-colors ${
                  collapsed ? 'justify-center px-0' : 'gap-unit-md px-4'
                } ${
                  isActive
                    ? 'bg-surface-container-highest font-semibold text-primary shadow-[0_0_20px_rgba(255,89,89,0.15)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon name={item.icon} filled={isActive} />
                {!collapsed && (
                  <span className="truncate text-body-lg">{item.label}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Create Playlist */}
      <div className={collapsed ? 'px-0' : 'px-2'}>
        <button
          type="button"
          onClick={onCreate}
          title={collapsed ? 'Create Playlist' : undefined}
          className={`flex w-full items-center justify-center rounded-lg bg-primary-container font-semibold text-on-primary-container shadow-[0_0_15px_rgba(255,89,89,0.2)] transition-all hover:brightness-110 ${
            collapsed ? 'h-11 px-0' : 'gap-2 py-3'
          }`}
        >
          <Icon name="add" />
          {!collapsed && <span className="text-body-lg">Create Playlist</span>}
        </button>
      </div>
    </nav>
  )
}

export default Sidebar
