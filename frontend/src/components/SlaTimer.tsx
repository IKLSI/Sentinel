import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'

interface SlaTimerProps {
  deadline?: string
  breached: boolean
}

function fmtRemaining(deadline: string): { text: string; status: 'ok' | 'warn' | 'critical' } {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { text: 'SLA dépassé', status: 'critical' }

  const totalMin = Math.floor(diff / 60000)
  const totalH = Math.floor(diff / 3600000)
  const days = Math.floor(totalH / 24)
  const hours = totalH % 24
  const mins = totalMin % 60

  let text: string
  if (totalMin < 60) text = `${totalMin}min`
  else if (totalH < 24) text = mins > 0 ? `${totalH}h ${mins}min` : `${totalH}h`
  else if (days < 7) text = hours > 0 ? `${days}j ${hours}h` : `${days}j`
  else text = `${days} jours`

  const status = totalMin < 60 ? 'critical' : totalH < 4 ? 'warn' : 'ok'
  return { text, status }
}

export const SlaTimer: React.FC<SlaTimerProps> = ({ deadline, breached }) => {
  const [state, setState] = useState<{ text: string; status: 'ok' | 'warn' | 'critical' } | null>(null)

  useEffect(() => {
    if (!deadline) return
    const compute = () => {
      if (breached || new Date(deadline) < new Date()) {
        setState({ text: 'SLA dépassé', status: 'critical' })
      } else {
        setState(fmtRemaining(deadline))
      }
    }
    compute()
    const interval = setInterval(compute, 60000)
    return () => clearInterval(interval)
  }, [deadline, breached])

  if (!deadline || !state) return null

  const colorMap = { ok: 'var(--green)', warn: 'var(--orange)', critical: 'var(--red)' }
  const color = colorMap[state.status]

  return (
    <Box component="span" className="d-inline-block text-nowrap flex-shrink-0">
      <svg viewBox="0 0 24 24" width="11" height="11" style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: '2px', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
      <Box
        component="span"
        className="d-inline-block align-middle ms-1"
        sx={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color }}
      >
        {state.text}
      </Box>
    </Box>
  )
}
