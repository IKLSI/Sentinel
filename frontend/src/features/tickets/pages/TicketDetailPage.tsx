import React, { useState, useEffect } from 'react'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Topbar } from '../../../layouts/Topbar'
import { StatusChip } from '../../../components/StatusChip'
import { SlaTimer } from '../../../components/SlaTimer'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import { getTicket, addComment, changeStatus, updateTicket, deleteTicket } from '../api/tickets'
import { getUsers } from '../../users/api/users'
import { getProjects, ProjectDto } from '../../techHealth/api/projects'
import { DurationPicker } from '../../../components/DurationPicker'
import { Ticket, TicketStatus, User } from '../../../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useToast } from '../../../hooks/useToast'

const statusLabels: Record<TicketStatus, string> = {
  new: 'Nouveau',
  analysis: 'En analyse',
  in_progress: 'En cours',
  testing: 'En test',
  resolved: 'Résolu',
  closed: 'Fermé',
}

const priorityVariant: Record<string, 'red' | 'orange' | 'yellow' | 'green'> = {
  critical: 'red', high: 'orange', medium: 'yellow', low: 'green',
}

const priorityLabels: Record<string, string> = {
  critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse',
}

const typeLabels: Record<string, string> = {
  bug: 'Bug', feature: 'Évolution', security: 'Sécurité',
  performance: 'Performance', maintenance: 'Maintenance', question: 'Question',
}

const fieldSx = {
  background: 'var(--s1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  px: '12px',
  py: '8px',
  fontSize: '13px',
  color: 'var(--text)',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
} as const

const labelSx = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  mb: '5px',
  color: 'var(--muted2)',
  letterSpacing: '0.04em',
} as const

const cardSx = {
  background: 'var(--s1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  overflow: 'hidden',
} as const

const cardHeaderSx = {
  p: '14px 18px',
  borderBottom: '1px solid var(--border)',
  fontWeight: 700,
  fontSize: '12px',
} as const

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [comment, setComment] = useState('')
  const [commentPreview, setCommentPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<ProjectDto[]>([])
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'bug',
    techProjectId: '',
    assignedToId: '',
    estimatedMinutes: 0,
  })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    Promise.all([
      getTicket(id),
      getProjects().catch(() => [] as ProjectDto[]),
    ])
      .then(([t, p]) => {
        setTicket(t)
        setProjects(p)
      })
      .catch(() => {
        setNotFound(true)
        showToast('Ticket introuvable', 'error')
      })
      .finally(() => setLoading(false))
  }, [id])

  const openEdit = async () => {
    if (!ticket) return
    setEditForm({
      title: ticket.title,
      description: ticket.description ?? '',
      priority: ticket.priority,
      type: ticket.type,
      techProjectId: ticket.projectId ?? '',
      assignedToId: ticket.assignee?.id ?? '',
      estimatedMinutes: ticket.estimatedHours != null ? Math.round(ticket.estimatedHours * 60) : 0,
    })
    const usersRes = await getUsers().catch(() => ({ items: [] as User[] }))
    setUsers(usersRes.items)
    setEditMode(true)
  }

  const handleSave = async () => {
    if (!ticket) return
    setEditSaving(true)
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        type: editForm.type,
      }
      if (editForm.techProjectId) payload.techProjectId = editForm.techProjectId
      if (editForm.assignedToId) payload.assignedToId = editForm.assignedToId
      if (editForm.estimatedMinutes > 0) payload.estimatedHours = editForm.estimatedMinutes / 60
      const updated = await updateTicket(ticket.id, payload as Partial<Ticket>)
      setTicket(updated)
      setEditMode(false)
      showToast('Ticket mis à jour', 'success')
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!ticket) return
    setDeleting(true)
    try {
      await deleteTicket(ticket.id)
      showToast('Ticket supprimé', 'success')
      navigate('/tickets')
    } catch {
      showToast('Erreur lors de la suppression', 'error')
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const handleAddComment = async () => {
    if (!ticket || !comment.trim()) return
    setSubmitting(true)
    try {
      const newComment = await addComment(ticket.id, comment, false)
      setTicket((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev)
      setComment('')
      showToast('Commentaire ajouté', 'success')
    } catch {
      showToast('Erreur lors de l\'ajout du commentaire', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return
    try {
      const updated = await changeStatus(ticket.id, status)
      setTicket(updated)
      showToast('Statut mis à jour', 'success')
    } catch {
      showToast('Erreur lors du changement de statut', 'error')
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Ticket" />
        <Box className="d-flex justify-content-center" sx={{ p: '60px' }}>
          <CircularProgress />
        </Box>
      </>
    )
  }

  if (notFound || !ticket) {
    return (
      <>
        <Topbar title="Ticket introuvable" />
        <Box className="d-flex flex-column align-items-center justify-content-center" sx={{ p: '80px', color: 'var(--muted)' }}>
          <Box sx={{ fontSize: '48px', mb: 2 }}>404</Box>
          <Box sx={{ fontSize: '15px', fontWeight: 600, mb: 1, color: 'var(--text)' }}>Ticket introuvable</Box>
          <Box sx={{ fontSize: '13px' }}>Ce ticket n'existe pas ou vous n'y avez pas accès.</Box>
        </Box>
      </>
    )
  }

  return (
    <>
      <Topbar title={ticket.reference} subtitle={ticket.projectName ?? ticket.reference} />

      <Box sx={{ p: '24px 28px' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'stretch' }}>

          <Box className="d-flex flex-column">
            {editMode ? (
              <Box sx={{ ...cardSx, mb: 2 }}>
                <Box className="d-flex align-items-center justify-content-between" sx={{ p: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <Box component="span" sx={{ fontWeight: 700, fontSize: '12px' }}>Modifier le ticket</Box>
                  <Box className="d-flex gap-2">
                    <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setEditMode(false)}>
                      Annuler
                    </Button>
                    <Button variant="contained" size="small" sx={{ textTransform: 'none' }} onClick={handleSave} disabled={editSaving || !editForm.title.trim()}>
                      {editSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Enregistrer'}
                    </Button>
                  </Box>
                </Box>
                <Box className="d-flex flex-column gap-3 p-3">
                  <Box>
                    <Box component="label" sx={labelSx}>Titre *</Box>
                    <Box component="input" sx={fieldSx} value={editForm.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <Box>
                      <Box component="label" sx={labelSx}>Priorité</Box>
                      <Box component="select" sx={fieldSx} value={editForm.priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, priority: e.target.value }))}>
                        <option value="critical">Critique</option>
                        <option value="high">Haute</option>
                        <option value="medium">Moyenne</option>
                        <option value="low">Basse</option>
                      </Box>
                    </Box>
                    <Box>
                      <Box component="label" sx={labelSx}>Type</Box>
                      <Box component="select" sx={fieldSx} value={editForm.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, type: e.target.value }))}>
                        <option value="bug">Bug</option>
                        <option value="feature">Évolution</option>
                        <option value="security">Sécurité</option>
                        <option value="performance">Performance</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="question">Question</option>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <Box>
                      <Box component="label" sx={labelSx}>Projet</Box>
                      <Box component="select" sx={fieldSx} value={editForm.techProjectId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, techProjectId: e.target.value }))}>
                        <option value="">— Aucun projet —</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Box>
                    </Box>
                    <Box>
                      <Box component="label" sx={labelSx}>Assigné à</Box>
                      <Box component="select" sx={fieldSx} value={editForm.assignedToId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm((f) => ({ ...f, assignedToId: e.target.value }))}>
                        <option value="">— Non assigné —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Box component="label" sx={{ ...labelSx, mb: '8px' }}>Estimation</Box>
                    <DurationPicker value={editForm.estimatedMinutes} onChange={(v) => setEditForm((f) => ({ ...f, estimatedMinutes: v }))} />
                  </Box>

                  <Box>
                    <Box component="label" sx={labelSx}>Description (Markdown supporté)</Box>
                    <Box component="textarea" rows={8} sx={{ ...fieldSx, resize: 'vertical' }} value={editForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Décrivez le problème..." />
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
                <Box className="mb-3">
                  <Box className="d-flex align-items-start justify-content-between gap-3 mb-2">
                    <Box component="h1" sx={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.4, m: 0 }}>
                      {ticket.title}
                    </Box>
                    <Box className="d-flex gap-1 flex-shrink-0">
                      <Box
                        component="button"
                        className="d-flex align-items-center justify-content-center"
                        onClick={openEdit}
                        title="Modifier"
                        sx={{
                          width: 32, height: 32,
                          background: 'var(--s1)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r)',
                          color: 'var(--muted2)',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, color 0.15s',
                          '&:hover': { borderColor: 'var(--accent)', color: 'var(--accent)' },
                        }}
                      >
                        <EditOutlined sx={{ fontSize: 14 }} />
                      </Box>
                      <Box
                        component="button"
                        className="d-flex align-items-center justify-content-center"
                        onClick={() => setDeleteConfirm(true)}
                        title="Supprimer"
                        sx={{
                          width: 32, height: 32,
                          background: 'var(--s1)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r)',
                          color: 'var(--muted2)',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, color 0.15s',
                          '&:hover': { borderColor: '#ef4444', color: '#ef4444' },
                        }}
                      >
                        <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
                      </Box>
                    </Box>
                  </Box>
                  <Box className="d-flex gap-2 flex-wrap align-items-center">
                    <StatusChip variant={priorityVariant[ticket.priority] ?? 'gray'}>{priorityLabels[ticket.priority] ?? ticket.priority}</StatusChip>
                    <StatusChip variant="gray">{typeLabels[ticket.type] ?? ticket.type}</StatusChip>
                    {ticket.jiraKey && <StatusChip variant="blue">JIRA: {ticket.jiraKey}</StatusChip>}
                    <SlaTimer deadline={ticket.slaDeadline} breached={ticket.slaBreached} />
                  </Box>
                </Box>

                <Box sx={{ ...cardSx, mb: 2 }}>
                  <Box sx={cardHeaderSx}>Description</Box>
                  <Box sx={{ p: '16px 20px', color: 'var(--muted2)', lineHeight: 1.7, fontSize: '13px' }}>
                    <ReactMarkdown>{ticket.description || '*Aucune description*'}</ReactMarkdown>
                  </Box>
                </Box>
              </>
            )}

            <Box className="d-flex flex-column flex-grow-1" sx={cardSx}>
              <Box sx={{ ...cardHeaderSx, flexShrink: 0 }}>
                Commentaires ({ticket.comments.length})
              </Box>
              <Box sx={{ p: '16px 20px' }}>
                {ticket.comments.map((c) => (
                  <Box key={c.id} className="mb-3" sx={{ p: '12px 16px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                    <Box className="d-flex align-items-center gap-2 mb-2">
                      <Box component="span" sx={{ fontSize: '12px', fontWeight: 700 }}>
                        {c.author.firstName} {c.author.lastName}
                      </Box>
                      <Box component="span" className="ms-auto" sx={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {format(new Date(c.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </Box>
                    </Box>
                    <Box sx={{ fontSize: '13px', color: 'var(--muted2)', lineHeight: 1.6 }}>
                      <ReactMarkdown>{c.content}</ReactMarkdown>
                    </Box>
                  </Box>
                ))}

                <Box className="mt-3">
                  <Box className="d-flex gap-2 mb-2">
                    <Button variant={!commentPreview ? 'contained' : 'outlined'} size="small" sx={{ textTransform: 'none' }} onClick={() => setCommentPreview(false)}>
                      Éditer
                    </Button>
                    <Button variant={commentPreview ? 'contained' : 'outlined'} size="small" sx={{ textTransform: 'none' }} onClick={() => setCommentPreview(true)}>
                      Aperçu
                    </Button>
                  </Box>
                  {commentPreview ? (
                    <Box sx={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', p: '12px', minHeight: '100px', fontSize: '13px', color: 'var(--muted2)', lineHeight: 1.6 }}>
                      <ReactMarkdown>{comment || '*Aucun contenu*'}</ReactMarkdown>
                    </Box>
                  ) : (
                    <Box
                      component="textarea"
                      value={comment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                      placeholder="Ajouter un commentaire (Markdown supporté)..."
                      rows={4}
                      sx={{ ...fieldSx, resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  )}
                  <Box className="d-flex justify-content-end mt-2">
                    <Button variant="contained" size="small" sx={{ textTransform: 'none' }} onClick={handleAddComment} disabled={submitting || !comment.trim()}>
                      {submitting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Publier'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className="d-flex flex-column gap-3 h-100">
            <Box sx={cardSx}>
              <Box sx={cardHeaderSx}>Informations</Box>
              <Box sx={{ p: '16px 20px' }}>
                {[
                  { label: 'Projet', value: ticket.projectName ?? '—' },
                  { label: 'Assigné', value: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Non assigné' },
                  { label: 'Estimation', value: ticket.estimatedHours != null ? (() => { const h = Math.floor(ticket.estimatedHours!); const m = Math.round((ticket.estimatedHours! % 1) * 60); return m > 0 ? `${h}h${m}` : `${h}h` })() : '—' },
                  { label: 'Temps passé', value: ticket.timeSpentMinutes ? (() => { const h = Math.floor(ticket.timeSpentMinutes / 60); const m = ticket.timeSpentMinutes % 60; return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h` })() : '—' },
                  { label: 'Créé le', value: format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: fr }) },
                ].map((item) => (
                  <Box key={item.label} className="d-flex justify-content-between mb-2" sx={{ fontSize: '12px' }}>
                    <Box component="span" sx={{ color: 'var(--muted)' }}>{item.label}</Box>
                    <Box component="span" sx={{ fontWeight: 600 }}>{item.value}</Box>
                  </Box>
                ))}
                <Box className="d-flex justify-content-between align-items-center" sx={{ fontSize: '12px' }}>
                  <Box component="span" sx={{ color: 'var(--muted)' }}>Statut</Box>
                  <Box
                    component="select"
                    value={ticket.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(e.target.value as TicketStatus)}
                    sx={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--text)', fontWeight: 600, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', p: 0, textAlign: 'right', textAlignLast: 'right' }}
                  >
                    {(Object.keys(statusLabels) as TicketStatus[]).map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box className="d-flex flex-column flex-grow-1" sx={cardSx}>
              <Box sx={{ ...cardHeaderSx, flexShrink: 0 }}>Historique</Box>
              <Box className="overflow-auto flex-grow-1" sx={{ p: '16px 20px' }}>
                <Box className="d-flex flex-column gap-2">
                  {ticket.history.length === 0 ? (
                    <Box sx={{ fontSize: '12px', color: 'var(--muted)' }}>Aucune modification</Box>
                  ) : [...ticket.history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((h) => (
                    <Box key={h.id} sx={{ fontSize: '11px' }}>
                      <Box sx={{ color: 'var(--muted2)' }}>
                        <Box component="strong" sx={{ color: 'var(--text)' }}>{h.author.firstName}</Box>{' '}
                        a modifié <strong>{h.field}</strong>
                      </Box>
                      <Box sx={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', mt: '2px' }}>
                        {h.oldValue} → {h.newValue}
                      </Box>
                      <Box sx={{ color: 'var(--muted)', fontSize: '10px', mt: '2px', fontFamily: 'var(--font-mono)' }}>
                        {format(new Date(h.createdAt), 'dd MMM HH:mm', { locale: fr })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {deleteConfirm && (
        <Box
          className="d-flex align-items-center justify-content-center"
          sx={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
        >
          <Box sx={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', p: '28px 32px', width: '380px', maxWidth: '90vw' }}>
            <Box sx={{ fontWeight: 700, fontSize: '15px', mb: '10px' }}>Supprimer ce ticket ?</Box>
            <Box className="mb-4" sx={{ fontSize: '13px', color: 'var(--muted2)' }}>
              Cette action est irréversible. Le ticket <strong>{ticket.reference}</strong> et toutes ses données associées seront définitivement supprimés.
            </Box>
            <Box className="d-flex gap-2 justify-content-end">
              <Box
                component="button"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                sx={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', p: '7px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Annuler
              </Box>
              <Box
                component="button"
                onClick={handleDelete}
                disabled={deleting}
                sx={{ background: '#ef4444', border: 'none', borderRadius: 'var(--r)', p: '7px 16px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}
