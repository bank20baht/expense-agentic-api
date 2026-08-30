import type { CSSProperties, KeyboardEvent } from 'react'

const inputStyle: CSSProperties = {
  padding: '8px 10px',
  fontSize: 14,
  border: '1px solid #ccc',
  borderRadius: 6,
}

export function TextField({
  value,
  onChange,
  onEnter,
  placeholder,
  type = 'text',
  style,
}: {
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  placeholder?: string
  type?: string
  style?: CSSProperties
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      style={{ ...inputStyle, ...style }}
    />
  )
}

export function Button({
  onClick,
  children,
  variant = 'default',
}: {
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        fontSize: 14,
        borderRadius: 6,
        border: '1px solid #ccc',
        cursor: 'pointer',
        background: variant === 'primary' ? '#2563eb' : '#fff',
        color: variant === 'primary' ? '#fff' : '#111',
      }}
    >
      {children}
    </button>
  )
}
