import React, { useState, useEffect } from 'react'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Topbar } from '../../../layouts/Topbar'
import { StatusChip } from '../../../components/StatusChip'
import { SlaTimer } from '../../../components/SlaTimer'
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

const inputStyle: React.CSSProperties = {
  background: 'var(--s1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--text)',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '5px',
  color: 'var(--muted2)',
  letterSpacing: '0.04em',
}

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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <CircularProgress />
        </div>
      </>
    )
  }

  if (notFound || !ticket) {
    return (
      <>
        <Topbar title="Ticket introuvable" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>404</div>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>Ticket introuvable</div>
          <div style={{ fontSize: '13px' }}>Ce ticket n'existe pas ou vous n'y avez pas accès.</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title={ticket.reference} subtitle={ticket.projectName ?? ticket.reference} />

      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'stretch' }}>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {editMode ? (
              <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>Modifier le ticket</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setEditMode(false)}>
                      Annuler
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={handleSave}
                      disabled={editSaving || !editForm.title.trim()}
                    >
                      {editSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Titre *</label>
                    <input style={inputStyle} value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Priorité</label>
                      <select style={inputStyle} value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}>
                        <option value="critical">Critique</option>
                        <option value="high">Haute</option>
                        <option value="medium">Moyenne</option>
                        <option value="low">Basse</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Type</label>
                      <select style={inputStyle} value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}>
                        <option value="bug">Bug</option>
                        <option value="feature">Évolution</option>
                        <option value="security">Sécurité</option>
                        <option value="performance">Performance</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="question">Question</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Projet</label>
                      <select style={inputStyle} value={editForm.techProjectId} onChange={(e) => setEditForm((f) => ({ ...f, techProjectId: e.target.value }))}>
                        <option value="">— Aucun projet —</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Assigné à</label>
                      <select style={inputStyle} value={editForm.assignedToId} onChange={(e) => setEditForm((f) => ({ ...f, assignedToId: e.target.value }))}>
                        <option value="">— Non assigné —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ ...labelStyle, marginBottom: '8px' }}>Estimation</label>
                    <DurationPicker
                      value={editForm.estimatedMinutes}
                      onChange={(v) => setEditForm((f) => ({ ...f, estimatedMinutes: v }))}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Description (Markdown supporté)</label>
                    <textarea
                      rows={8}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Décrivez le problème..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
                      {ticket.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={openEdit}
                        title="Modifier"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--muted2)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)' }}
                      >
                        <EditOutlined sx={{ fontSize: 14 }} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        title="Supprimer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--muted2)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)' }}
                      >
                        <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusChip variant={priorityVariant[ticket.priority] ?? 'gray'}>{priorityLabels[ticket.priority] ?? ticket.priority}</StatusChip>
                    <StatusChip variant="gray">{typeLabels[ticket.type] ?? ticket.type}</StatusChip>
                    {ticket.jiraKey && <StatusChip variant="blue">JIRA: {ticket.jiraKey}</StatusChip>}
                    <SlaTimer deadline={ticket.slaDeadline} breached={ticket.slaBreached} />
                  </div>
                </div>

                <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '12px' }}>Description</div>
                  <div style={{ padding: '16px 20px', color: 'var(--muted2)', lineHeight: 1.7, fontSize: '13px' }}>
                    <ReactMarkdown>{ticket.description || '*Aucune description*'}</ReactMarkdown>
                  </div>
                </div>
              </>
            )}

            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                Commentaires ({ticket.comments.length})
              </div>
              <div style={{ padding: '16px 20px' }}>
                {ticket.comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      background: 'var(--s2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>
                        {c.author.firstName} {c.author.lastName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                        {format(new Date(c.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted2)', lineHeight: 1.6 }}>
                      <ReactMarkdown>{c.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Button
                      variant={!commentPreview ? 'contained' : 'outlined'}
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() => setCommentPreview(false)}
                    >
                      Éditer
                    </Button>
                    <Button
                      variant={commentPreview ? 'contained' : 'outlined'}
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() => setCommentPreview(true)}
                    >
                      Aperçu
                    </Button>
                  </div>
                  {commentPreview ? (
                    <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px', minHeight: '100px', fontSize: '13px', color: 'var(--muted2)', lineHeight: 1.6 }}>
                      <ReactMarkdown>{comment || '*Aucun contenu*'}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Ajouter un commentaire (Markdown supporté)..."
                      rows={4}
                      style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: '13px', color: 'var(--text)', width: '100%', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  )}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={handleAddComment}
                      disabled={submitting || !comment.trim()}
                    >
                      {submitting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Publier'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '12px' }}>Informations</div>
              <div style={{ padding: '16px 20px' }}>
                {[
                  { label: 'Projet', value: ticket.projectName ?? '—' },
                  { label: 'Assigné', value: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Non assigné' },
                  { label: 'Estimation', value: ticket.estimatedHours != null ? (() => { const h = Math.floor(ticket.estimatedHours!); const m = Math.round((ticket.estimatedHours! % 1) * 60); return m > 0 ? `${h}h${m}` : `${h}h` })() : '—' },
                  { label: 'Temps passé', value: ticket.timeSpentMinutes ? (() => { const h = Math.floor(ticket.timeSpentMinutes / 60); const m = ticket.timeSpentMinutes % 60; return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h` })() : '—' },
                  { label: 'Créé le', value: format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: fr }) },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Statut</span>
                  <select
                    style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--text)', fontWeight: 600, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'right', textAlignLast: 'right' }}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  >
                    {(Object.keys(statusLabels) as TicketStatus[]).map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>Historique</div>
              <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ticket.history.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Aucune modification</div>
                  ) : [...ticket.history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((h) => (
                    <div key={h.id} style={{ fontSize: '11px' }}>
                      <div style={{ color: 'var(--muted2)' }}>
                        <strong style={{ color: 'var(--text)' }}>{h.author.firstName}</strong>{' '}
                        a modifié <strong>{h.field}</strong>
                      </div>
                      <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: '2px' }}>
                        {h.oldValue} → {h.newValue}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {format(new Date(h.createdAt), 'dd MMM HH:mm', { locale: fr })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '28px 32px', width: '380px', maxWidth: '90vw' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>Supprimer ce ticket ?</div>
            <div style={{ fontSize: '13px', color: 'var(--muted2)', marginBottom: '24px' }}>
              Cette action est irréversible. Le ticket <strong>{ticket.reference}</strong> et toutes ses données associées seront définitivement supprimés.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '7px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: '#ef4444', border: 'none', borderRadius: 'var(--r)', padding: '7px 16px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
