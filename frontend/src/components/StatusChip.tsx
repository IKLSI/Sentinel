import React from 'react'
import Chip from '@mui/material/Chip'

type Variant = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'cyan' | 'purple' | 'gray'

const colorMap: Record<Variant, { bg: string; color: string; border: string }> = {
  red:    { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  orange: { bg: 'rgba(249,115,22,0.12)',   color: '#f97316', border: 'rgba(249,115,22,0.25)' },
  yellow: { bg: 'rgba(234,179,8,0.12)',    color: '#eab308', border: 'rgba(234,179,8,0.25)' },
  green:  { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  blue:   { bg: 'rgba(99,102,241,0.12)',   color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  cyan:   { bg: 'rgba(6,182,212,0.12)',    color: '#06b6d4', border: 'rgba(6,182,212,0.25)' },
  purple: { bg: 'rgba(168,85,247,0.12)',   color: '#a855f7', border: 'rgba(168,85,247,0.25)' },
  gray:   { bg: 'rgba(148,163,184,0.12)',  color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
}

interface StatusChipProps {
  variant?: Variant
  children: React.ReactNode
}

export const StatusChip: React.FC<StatusChipProps> = ({ variant = 'gray', children }) => {
  const { bg, color, border } = colorMap[variant]
  return (
    <Chip
      label={children}
      size="small"
      sx={{
        height: '18px',
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: '4px',
        '& .MuiChip-label': { px: '6px' },
      }}
    />
  )
}
