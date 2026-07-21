/**
 * Thin wrapper around Material Symbols (Outlined).
 * Usage: <Icon name="library_music" filled className="text-[20px]" />
 */
function Icon({ name, filled = false, weight, className = '', style, ...props }) {
  return (
    <span
      className={`material-symbols-outlined leading-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}${
          weight ? `, 'wght' ${weight}` : ''
        }`,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  )
}

export default Icon
