import Icon from './Icon.jsx'

/**
 * Paste-first ingestion input. Uncontrolled by default; call onSubmit(url)
 * when the form is submitted (Enter key).
 *
 * Props:
 *   onSubmit   - (url: string) => void
 *   placeholder - string
 */
function SearchBar({ onSubmit, placeholder = 'Paste a YouTube link…' }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const url = e.currentTarget.elements.namedItem('resonance-paste')?.value ?? ''
        onSubmit?.(url)
      }}
      className="group relative w-full"
    >
      <Icon
        name="link"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
      />
      <input
        name="resonance-paste"
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-full border border-transparent bg-surface-container-high py-3 pl-12 pr-4 text-body-lg text-on-surface transition-all placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-0"
      />
    </form>
  )
}

export default SearchBar
