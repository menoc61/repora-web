import React from 'react'

interface IconProps {
  name: string
  className?: string
  fill?: boolean
  style?: React.CSSProperties
}

// Material Symbols icon. Pass `fill` to use the filled variant.
export default function Icon({ name, className = '', fill = false, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
