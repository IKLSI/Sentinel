import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'

interface SlaTimerProps {
  deadline?: string
  breached: boolean
  compact?: boolean
}

function fmtRemaining(deadline: string, compact: boolean): { text: string; status: 'ok' | 'warn' | 'critical' } {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { text: 'Dépassé', status: 'critical' }

  const totalMin = Math.floor(diff / 60000)
  const totalH = Math.floor(diff / 3600000)
  const days = Math.floor(totalH / 24)
  const hours = totalH % 24
  const mins = totalMin % 60

  let text: string
  if (totalMin < 60) text = `${totalMin}min`
  else if (totalH < 24) text = mins > 0 ? `${totalH}h ${mins}min` : `${totalH}h`
  else if (days < 7) text = hours > 0 ? `${days}j ${hours}h` : `${days}j`
  else text = compact ? `${days}j` : `${days} jours`

  const status = totalMin < 60 ? 'critical' : totalH < 4 ? 'warn' : 'ok'
  return { text, status }
}

export const SlaTimer: React.FC<SlaTimerProps> = ({ deadline, breached, compact = false }) => {
  const [state, setState] = useState<{ text: string; status: 'ok' | 'warn' | 'critical' } | null>(null)

  useEffect(() => {
    if (!deadline) return
    const compute = () => {
      if (breached || new Date(deadline) < new Date()) {
        setState({ text: 'Dépassé', status: 'critical' })
      } else {
        setState(fmtRemaining(deadline, compact))
      }
    }
    compute()
    const interval = setInterval(compute, 60000)
    return () => clearInterval(interval)
  }, [deadline, breached, compact])

  if (!deadline || !state) return null

  const colorMap = { ok: 'var(--green)', warn: 'var(--orange)', critical: 'var(--red)' }
  const color = colorMap[state.status]

  return (
    <Box component="span" sx={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color }}>
      {state.text}
    </Box>
  )
}
