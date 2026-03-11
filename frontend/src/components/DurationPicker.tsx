import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'

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
    <Box
      component="input"
      type="text"
      value={text}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
      onFocus={(e: React.FocusEvent<HTMLInputElement>) => { setFocused(true); e.target.select() }}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
      placeholder={placeholder}
      sx={{
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        px: '12px',
        py: '8px',
        height: '34px',
        width,
        fontSize: '13px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: 'var(--text)',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  )
}
