import Icon from './Icon.jsx'

/**
 * Paste-first ingestion input. Uncontrolled by default; call onSubmit(url)
 * when the form is submitted (Enter key).
 *
 * Props:
 *   onSubmit   - (url: string) => void
 *   placeholder - string
 */
function SearchBar({ onSubmit, placeholder = 'Search music, artists, or paste YouTube link…' }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const query = e.currentTarget.elements.namedItem('resonance-search')?.value ?? ''
        onSubmit?.(query)
      }}
      className="group relative w-full"
    >
      <Icon
        name="search"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
      />
      <input
        name="resonance-search"
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-full border border-surface-variant/40 bg-surface-container-high py-2.5 pl-12 pr-4 text-body-lg text-on-surface transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface-container focus:outline-none"
      />
    </form>
  )
}

export default SearchBar
