import React, { useState, useEffect } from 'react'

function parse(input: string): number {
  const s = input.trim().toLowerCase()
  if (!s) return 0
  const hm = s.match(/^(\d+)\s*h\s*(\d+)\s*m?$/)
  if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2])
  const h = s.match(/^(\d+)\s*h$/)
  if (h) return parseInt(h[1]) * 60
  const m = s.match(/^(\d+)\s*m(in)?$/)
  if (m) return parseInt(m[1])
  const dec = s.match(/^(\d+\.\d+)$/)
  if (dec) return Math.round(parseFloat(dec[1]) * 60)
  const bare = s.match(/^(\d+)$/)
  if (bare) return parseInt(bare[1])
  return 0
}

function fmt(minutes: number): string {
  if (minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}`
}

interface DurationPickerProps {
  value: number
  onChange: (minutes: number) => void
  placeholder?: string
  width?: string
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value, onChange, placeholder = '2h30 · 1h · 90m', width = '160px',
}) => {
  const [text, setText] = useState(fmt(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(fmt(value))
  }, [value, focused])

  const commit = () => {
    const parsed = parse(text)
    onChange(parsed)
    setText(fmt(parsed))
    setFocused(false)
  }

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => { setFocused(true); e.target.select() }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
      placeholder={placeholder}
      style={{
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        padding: '8px 12px',
        height: '34px',
        boxSizing: 'border-box',
        width,
        fontSize: '13px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: 'var(--text)',
        outline: 'none',
      }}
    />
  )
}
