import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined'
import RemoveCircleOutlineOutlined from '@mui/icons-material/RemoveCircleOutlineOutlined'
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import SplitscreenOutlined from '@mui/icons-material/SplitscreenOutlined'
import AddOutlined from '@mui/icons-material/AddOutlined'
import Button from '@mui/material/Button'
import BugReportOutlined from '@mui/icons-material/BugReportOutlined'
import AutoFixHighOutlined from '@mui/icons-material/AutoFixHighOutlined'
import SecurityOutlined from '@mui/icons-material/SecurityOutlined'
import SpeedOutlined from '@mui/icons-material/SpeedOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import { StatusChip } from '../../../components/StatusChip'
import { RowActions } from '../../../components/RowActions'
import { useToast } from '../../../hooks/useToast'
import { removeTicket } from '../api/sprints'
import { getTickets } from '../../tickets/api/tickets'
import { Sprint, Ticket, TicketStatus } from '../../../types'
import { AddTicketsModal } from './AddTicketsModal'

// ─── constants ───────────────────────────────────────────────────────────────

const typeIcons: Record<string, React.ElementType> = {
  bug: BugReportOutlined,
  feature: AutoFixHighOutlined,
  security: SecurityOutlined,
  performance: SpeedOutlined,
  maintenance: BuildOutlined,
  question: HelpOutlineOutlined,
}

const typeLabels: Record<string, string> = {
  bug: 'Bug', feature: 'Évolution', security: 'Sécurité',
  performance: 'Perf', maintenance: 'Maintenance', question: 'Question',
}

const priorityLabels: Record<string, string> = {
  critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse',
}
const priorityLevels: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
}

const statusVariant: Record<TicketStatus, 'blue' | 'orange' | 'cyan' | 'green' | 'gray'> = {
  new: 'blue', in_progress: 'orange', testing: 'cyan', resolved: 'green', closed: 'gray',
}
const statusLabels: Record<string, string> = {
  new: 'Nouveau', in_progress: 'En cours', testing: 'En test', resolved: 'Résolu', closed: 'Fermé',
}

const sprintStatusVariant: Record<string, 'gray' | 'green' | 'blue' | 'slate'> = {
  planned: 'gray', active: 'green', completed: 'blue', archived: 'slate',
}
const sprintStatusLabels: Record<string, string> = {
  planned: 'Planifié', active: 'En cours', completed: 'Terminé', archived: 'Archivé',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ─── sub-components ──────────────────────────────────────────────────────────

const LevelBars: React.FC<{ level: number }> = ({ level }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '10px', flexShrink: 0 }}>
    {[1, 2, 3, 4].map(i => (
      <Box key={i} sx={{ width: '3px', height: `${4 + i * 1.5}px`, borderRadius: '1px', background: 'currentColor', opacity: i <= level ? 1 : 0.2 }} />
    ))}
  </Box>
)

// ─── props ───────────────────────────────────────────────────────────────────

interface SprintTabPanelProps {
  sprints: Sprint[]
  onEditSprint: (sprint: Sprint) => void
  onDeleteSprint: (sprint: Sprint) => void
  onSprintStatusChange: (e: React.MouseEvent, sprint: Sprint, status: string) => void
  onTicketChanged?: () => void
  onNewSprint?: () => void
}

// ─── component ───────────────────────────────────────────────────────────────

export const SprintTabPanel: React.FC<SprintTabPanelProps> = ({
  sprints,
  onEditSprint,
  onDeleteSprint,
  onSprintStatusChange,
  onTicketChanged,
  onNewSprint,
}) => {
  const { showToast } = useToast()

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const active = sprints.find(s => s.status === 'active')
    return active ? new Set([active.id]) : new Set()
  })

  const [sprintTickets, setSprintTickets] = useState<Record<string, Ticket[]>>({})
  const [loadingTickets, setLoadingTickets] = useState<Record<string, boolean>>({})
  const loadedRef = useRef<Set<string>>(new Set())

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [removingTicket, setRemovingTicket] = useState<string | null>(null)
  const navigate = useNavigate()
  const [addTicketsSprintId, setAddTicketsSprintId] = useState<string | null>(null)

  // ── debounce search ────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

// ── load tickets ───────────────────────────────────────────────────────────

  const loadSprintTickets = useCallback(async (sprintId: string, force = false) => {
    if (!force && loadedRef.current.has(sprintId)) return
    loadedRef.current.add(sprintId)
    setLoadingTickets(prev => ({ ...prev, [sprintId]: true }))
    try {
      const result = await getTickets({ sprintId, pageSize: 200 })
      setSprintTickets(prev => ({ ...prev, [sprintId]: result.items }))
    } catch {
      showToast('Impossible de charger les tickets', 'error')
    } finally {
      setLoadingTickets(prev => ({ ...prev, [sprintId]: false }))
    }
  }, [showToast])

  // auto-load active sprint on mount
  useEffect(() => {
    const active = sprints.find(s => s.status === 'active')
    if (active) loadSprintTickets(active.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── toggle expand ──────────────────────────────────────────────────────────

  const toggleExpand = (sprintId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(sprintId)) {
        next.delete(sprintId)
      } else {
        next.add(sprintId)
        loadSprintTickets(sprintId)
      }
      return next
    })
  }

  // ── ticket actions ─────────────────────────────────────────────────────────

const handleRemoveTicket = async (sprintId: string, ticket: Ticket) => {
    setRemovingTicket(ticket.id)
    try {
      await removeTicket(sprintId, ticket.id)
      setSprintTickets(prev => ({
        ...prev,
        [sprintId]: (prev[sprintId] ?? []).filter(t => t.id !== ticket.id),
      }))
      showToast(`« ${ticket.title} » retiré du sprint`, 'success')
      onTicketChanged?.()
    } catch {
      showToast('Impossible de retirer le ticket', 'error')
    } finally {
      setRemovingTicket(null)
    }
  }

  // ── filter ─────────────────────────────────────────────────────────────────

  const filterTickets = (tickets: Ticket[]) => {
    if (!debouncedSearch) return tickets
    const q = debouncedSearch.toLowerCase()
    return tickets.filter(t => t.title.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q))
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (sprints.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', pb: '14px', mb: '8px' }}>
          <Box sx={{ flex: 1 }} />
          {onNewSprint && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddOutlined sx={{ fontSize: 13 }} />}
              onClick={onNewSprint}
              sx={{ height: '28px', fontSize: '12px', textTransform: 'none', px: '10px', flexShrink: 0 }}
            >
              Nouveau sprint
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', borderRadius: 'var(--r)', pb: '40px' }}>
          <SplitscreenOutlined sx={{ fontSize: 32, color: 'var(--muted)' }} />
          <Box sx={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center' }}>
            Aucun sprint pour ce projet
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '0px' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', pb: '14px', mb: '8px' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: '7px', px: '9px', height: '28px', width: 'calc(30% + 10px)',
          transition: 'border-color 0.15s',
          '&:focus-within': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
        }}>
          <SearchOutlined sx={{ color: 'var(--muted)', fontSize: '13px', flexShrink: 0 }} />
          <Box
            component="input"
            placeholder="Rechercher..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            sx={{ all: 'unset', flex: 1, fontSize: '12px', color: 'var(--text)', '&::placeholder': { color: 'var(--muted)' }, '&:focus': { outline: 'none', boxShadow: 'none !important' } }}
          />
        </Box>
        {search && (
          <Box component="span" sx={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
            {sprints.reduce((acc, s) => acc + filterTickets(sprintTickets[s.id] ?? []).length, 0)} résultat{sprints.reduce((acc, s) => acc + filterTickets(sprintTickets[s.id] ?? []).length, 0) > 1 ? 's' : ''}
          </Box>
        )}
        <Box sx={{ flex: 1 }} />
        {onNewSprint && (
          <Button
            size="small"
            variant="contained"
            startIcon={<AddOutlined sx={{ fontSize: 13 }} />}
            onClick={onNewSprint}
            sx={{ height: '28px', fontSize: '12px', textTransform: 'none', px: '10px', flexShrink: 0 }}
          >
            Nouveau sprint
          </Button>
        )}
      </Box>

      {/* ── Sprint list ──────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sprints.map(sprint => {
          const isExpanded = expanded.has(sprint.id)
          const tickets = sprintTickets[sprint.id] ?? []
          const isLoadingT = loadingTickets[sprint.id]
          const filtered = filterTickets(tickets)

          return (
            <Box
              key={sprint.id}
              sx={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', flexShrink: 0 }}
            >
              {/* Sprint header */}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  px: '14px', py: '11px',
                  background: sprint.status === 'active' ? 'rgba(34,197,94,0.04)' : 'var(--s2)',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                  '&:hover': { background: sprint.status === 'active' ? 'rgba(34,197,94,0.07)' : 'var(--s3)' },
                  '&:hover .sprint-actions': { opacity: 1 },
                  '&:hover .sprint-actions .row-actions': { opacity: 1 },
                  userSelect: 'none',
                }}
                onClick={() => toggleExpand(sprint.id)}
              >
                {/* Chevron */}
                <Box sx={{ color: 'var(--muted)', display: 'flex', flexShrink: 0, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />
                </Box>

                {/* Name + goal */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <Box component="span" sx={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {sprint.name}
                  </Box>
                  {sprint.goal && (
                    <Box component="span" sx={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sprint.goal}
                    </Box>
                  )}
                </Box>

                {/* Actions + Status + Dates — actions en premier pour que les dates restent au bord droit */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <Box
                    className="sprint-actions"
                    sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex' }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <RowActions actions={[
                      ...(sprint.status === 'planned' ? [{ icon: <PlayArrowOutlined sx={{ fontSize: 14 }} />, label: 'Démarrer', onClick: (e: React.MouseEvent) => onSprintStatusChange(e, sprint, 'active') }] : []),
                      ...(sprint.status === 'active' ? [{ icon: <CheckOutlined sx={{ fontSize: 14 }} />, label: 'Terminer', onClick: (e: React.MouseEvent) => onSprintStatusChange(e, sprint, 'completed') }] : []),
                      ...(sprint.status !== 'archived' ? [{ icon: <ArchiveOutlined sx={{ fontSize: 14 }} />, label: 'Archiver', onClick: (e: React.MouseEvent) => onSprintStatusChange(e, sprint, 'archived') }] : []),
                      { icon: <EditOutlined sx={{ fontSize: 14 }} />, label: 'Modifier', onClick: () => onEditSprint(sprint) },
                      { icon: <DeleteOutlineOutlined sx={{ fontSize: 14 }} />, label: 'Supprimer', onClick: () => onDeleteSprint(sprint), color: 'red' as const },
                    ]} />
                  </Box>
                  <StatusChip variant={sprintStatusVariant[sprint.status] ?? 'gray'}>
                    {sprintStatusLabels[sprint.status] ?? sprint.status}
                  </StatusChip>
                  <Box sx={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                  </Box>
                </Box>
              </Box>

              {/* Ticket table */}
              {isExpanded && (
                <Box sx={{ borderTop: '1px solid var(--border)' }}>
                  {isLoadingT ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: '28px' }}>
                      <CircularProgress size={22} sx={{ color: 'var(--accent)' }} />
                    </Box>
                  ) : tickets.length === 0 ? (
                    <Box sx={{ py: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Box sx={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Aucun ticket dans ce sprint</Box>
                    </Box>
                  ) : filtered.length === 0 ? (
                    <Box sx={{ py: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                      Aucun résultat pour ces filtres
                    </Box>
                  ) : (
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <Box component="colgroup">
                        {['8%', '4%', '1fr', '13%', '10%', '11%', '6%', '52px'].map((w, i) => (
                          <Box key={i} component="col" sx={{ width: w }} />
                        ))}
                      </Box>
                      <Box component="thead">
                        <Box component="tr">
                          {['Référence', '', 'Titre', 'Statut', 'Priorité', 'Assigné', 'Est.', ''].map((h, i) => (
                            <Box component="th" key={i} sx={{
                              fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)',
                              textAlign: 'left', padding: '7px 14px',
                              borderBottom: '1px solid var(--border)',
                              background: sprint.status === 'active' ? 'rgba(34,197,94,0.03)' : 'var(--s2)',
                              whiteSpace: 'nowrap',
                            }}>
                              {h}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {filtered.map(ticket => {
                          const TypeIcon = typeIcons[ticket.type] ?? HelpOutlineOutlined
                          return (
                            <Box component="tr" key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} sx={{ cursor: 'pointer', '&:hover td': { background: 'var(--s2)' }, '&:hover .row-actions': { opacity: '1 !important' } }}>

                              <Box component="td" sx={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                {ticket.reference}
                              </Box>

                              <Box component="td" sx={{ padding: '9px 6px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                                <Tooltip title={typeLabels[ticket.type] ?? ticket.type} arrow placement="top">
                                  <Box sx={{ display: 'inline-flex', color: 'var(--muted)' }}>
                                    <TypeIcon sx={{ fontSize: 13 }} />
                                  </Box>
                                </Tooltip>
                              </Box>

                              <Box component="td" sx={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', maxWidth: 0 }}>
                                <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontSize: '13px', color: 'var(--text)' }}>
                                  {ticket.title}
                                </Box>
                              </Box>

                              <Box component="td" sx={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                                <StatusChip variant={statusVariant[ticket.status]}>{statusLabels[ticket.status]}</StatusChip>
                              </Box>

                              <Box component="td" sx={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                                <StatusChip startAdornment={<LevelBars level={priorityLevels[ticket.priority] ?? 1} />}>
                                  {priorityLabels[ticket.priority]}
                                </StatusChip>
                              </Box>

                              <Box component="td" sx={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : '—'}
                              </Box>

                              <Box component="td" sx={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                {ticket.estimatedHours ? `${ticket.estimatedHours}h` : '—'}
                              </Box>

                              <Box component="td" onClick={(e: React.MouseEvent) => e.stopPropagation()} sx={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                                <RowActions actions={[{
                                  icon: removingTicket === ticket.id
                                    ? <CircularProgress size={11} sx={{ color: 'var(--red)' }} />
                                    : <RemoveCircleOutlineOutlined sx={{ fontSize: 13 }} />,
                                  label: 'Retirer du sprint',
                                  onClick: () => handleRemoveTicket(sprint.id, ticket),
                                  color: 'red',
                                  disabled: removingTicket === ticket.id,
                                }]} />
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Footer — ajouter des tickets */}
                  {!isLoadingT && sprint.status !== 'completed' && sprint.status !== 'archived' && (
                    <Box
                      component="button"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setAddTicketsSprintId(sprint.id) }}
                      sx={{
                        all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        px: '14px', py: '8px',
                        fontSize: '12px', fontWeight: 500, color: 'var(--muted)',
                        borderTop: tickets.length > 0 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.12s, color 0.12s',
                        '&:hover': { background: 'var(--s3)', color: 'var(--accent)' },
                      }}
                    >
                      <AddOutlined sx={{ fontSize: 13 }} />
                      Ajouter des tickets
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {addTicketsSprintId && (() => {
        const sprint = sprints.find(s => s.id === addTicketsSprintId)
        if (!sprint) return null
        return (
          <AddTicketsModal
            open
            onClose={() => setAddTicketsSprintId(null)}
            sprintId={sprint.id}
            projectId={sprint.projectId}
            onAdded={() => {
              loadSprintTickets(sprint.id, true)
              onTicketChanged?.()
            }}
          />
        )
      })()}
    </Box>
  )
}
