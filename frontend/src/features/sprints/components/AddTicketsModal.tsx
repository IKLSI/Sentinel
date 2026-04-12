import React, { useState, useEffect, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import BugReportOutlined from '@mui/icons-material/BugReportOutlined'
import AutoFixHighOutlined from '@mui/icons-material/AutoFixHighOutlined'
import SecurityOutlined from '@mui/icons-material/SecurityOutlined'
import SpeedOutlined from '@mui/icons-material/SpeedOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import { AppModal } from '../../../components/AppModal'
import { StatusChip } from '../../../components/StatusChip'
import { assignTicket } from '../api/sprints'
import { getTickets } from '../../tickets/api/tickets'
import { Ticket, TicketStatus } from '../../../types'

const typeIcons: Record<string, React.ElementType> = {
  bug: BugReportOutlined,
  feature: AutoFixHighOutlined,
  security: SecurityOutlined,
  performance: SpeedOutlined,
  maintenance: BuildOutlined,
  question: HelpOutlineOutlined,
}

const statusVariant: Record<TicketStatus, 'blue' | 'orange' | 'cyan' | 'green' | 'gray'> = {
  new: 'blue', in_progress: 'orange', testing: 'cyan', resolved: 'green', closed: 'gray',
}
const statusLabels: Record<string, string> = {
  new: 'Nouveau', in_progress: 'En cours', testing: 'En test', resolved: 'Résolu', closed: 'Fermé',
}

interface Props {
  open: boolean
  onClose: () => void
  sprintId: string
  projectId: string
  onAdded: () => void
}

export const AddTicketsModal: React.FC<Props> = ({ open, onClose, sprintId, projectId, onAdded }) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setSearch('')
    setLoading(true)
    getTickets({ sprintId: 'none', pageSize: 200 })
      .then(res => setTickets(res.items.filter(t => t.projectId === projectId)))
      .finally(() => setLoading(false))
  }, [open, projectId])

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets
    const q = search.toLowerCase()
    return tickets.filter(t =>
      t.title.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q)
    )
  }, [tickets, search])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(t => t.id)))
    }
  }

  const handleConfirm = async () => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      await Promise.all([...selected].map(id => assignTicket(sprintId, id)))
      onAdded()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const allChecked = filtered.length > 0 && selected.size === filtered.length
  const indeterminate = selected.size > 0 && selected.size < filtered.length

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Ajouter des tickets au sprint"
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} size="small" sx={{ textTransform: 'none', fontSize: '13px', color: 'var(--muted)' }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={selected.size === 0 || saving}
            onClick={handleConfirm}
            sx={{ textTransform: 'none', fontSize: '13px' }}
          >
            {saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : `Ajouter${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </Button>
        </>
      }
    >
      {/* Search */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--s2)', border: '1px solid var(--border)',
        borderRadius: '9px', px: '10px', height: '34px', mb: '12px',
        '&:focus-within': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
      }}>
        <SearchOutlined sx={{ color: 'var(--muted)', fontSize: '14px', flexShrink: 0 }} />
        <Box
          component="input"
          placeholder="Rechercher par titre ou référence…"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          sx={{ all: 'unset', flex: 1, fontSize: '13px', color: 'var(--text)', '&::placeholder': { color: 'var(--muted)' } }}
        />
      </Box>

      {/* List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '32px' }}>
          <CircularProgress size={24} sx={{ color: 'var(--accent)' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
          {tickets.length === 0 ? 'Aucun ticket disponible pour ce projet' : 'Aucun résultat'}
        </Box>
      ) : (
        <Box sx={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Header row */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '8px',
            px: '10px', py: '6px',
            background: 'var(--s2)', borderBottom: '1px solid var(--border)',
          }}>
            <Checkbox
              size="small"
              checked={allChecked}
              indeterminate={indeterminate}
              onChange={toggleAll}
              sx={{ p: '2px', color: 'var(--muted)' }}
            />
            <Box sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              {filtered.length} ticket{filtered.length > 1 ? 's' : ''}
            </Box>
          </Box>

          {/* Ticket rows */}
          <Box sx={{ maxHeight: '320px', overflowY: 'auto' }}>
            {filtered.map(ticket => {
              const TypeIcon = typeIcons[ticket.type] ?? HelpOutlineOutlined
              const isSelected = selected.has(ticket.id)
              return (
                <Box
                  key={ticket.id}
                  onClick={() => toggle(ticket.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    px: '10px', py: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.1s',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { background: isSelected ? 'var(--accent-subtle)' : 'var(--s2)' },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={() => toggle(ticket.id)}
                    onClick={e => e.stopPropagation()}
                    sx={{ p: '2px', color: 'var(--muted)', flexShrink: 0 }}
                  />
                  <Box sx={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted2)', whiteSpace: 'nowrap', flexShrink: 0, width: '80px' }}>
                    {ticket.reference}
                  </Box>
                  <Box sx={{ color: 'var(--muted)', display: 'flex', flexShrink: 0 }}>
                    <TypeIcon sx={{ fontSize: 13 }} />
                  </Box>
                  <Box sx={{ flex: 1, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.title}
                  </Box>
                  <StatusChip variant={statusVariant[ticket.status]}>
                    {statusLabels[ticket.status]}
                  </StatusChip>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
    </AppModal>
  )
}
