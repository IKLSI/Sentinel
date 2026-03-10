import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../../../layouts/Topbar'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import apiClient from '../../../services/client'
import { useToast } from '../../../hooks/useToast'
import { getProjects, ProjectDto } from '../../techHealth/api/projects'
import { getUsers } from '../../users/api/users'
import { User } from '../../../types'
import { DurationPicker } from '../../../components/DurationPicker'

interface CreateTicketPayload {
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  type: 'Bug' | 'Feature' | 'Security' | 'Performance' | 'Maintenance' | 'Question'
  techProjectId?: string
  assignedToId?: string
  estimatedHours?: number
}

export const NewTicketPage: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState<CreateTicketPayload>({
    title: '',
    description: '',
    priority: 'Medium',
    type: 'Bug',
  })
  const [submitting, setSubmitting] = useState(false)
  const [projects, setProjects] = useState<ProjectDto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [estMinutes, setEstMinutes] = useState(0)

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {})
    getUsers().then((res) => setUsers(res.items)).catch(() => {})
  }, [])

  const handleChange = (field: keyof CreateTicketPayload, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) {
      showToast('Veuillez remplir les champs obligatoires', 'warning')
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateTicketPayload = { ...form }
      if (!payload.techProjectId) delete payload.techProjectId
      if (!payload.assignedToId) delete payload.assignedToId
      if (estMinutes > 0) payload.estimatedHours = estMinutes / 60
      const response = await apiClient.post<{ id: string }>('/api/tickets', payload)
      showToast('Ticket créé avec succès', 'success')
      navigate(`/tickets/${response.data.id}`)
    } catch {
      showToast('Erreur lors de la création du ticket', 'error')
    } finally {
      setSubmitting(false)
    }
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

  return (
    <>
      <Topbar title="Nouveau ticket" />
      <div style={{ padding: '24px 28px', maxWidth: '800px' }}>
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '12px' }}>Créer un ticket</div>
          <div style={{ padding: '16px 20px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Description courte du problème"
                  required
                  autoFocus
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Priorité</label>
                  <select value={form.priority} onChange={(e) => handleChange('priority', e.target.value as CreateTicketPayload['priority'])} style={inputStyle}>
                    <option value="Critical">Critique</option>
                    <option value="High">Haute</option>
                    <option value="Medium">Moyenne</option>
                    <option value="Low">Basse</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Type</label>
                  <select value={form.type} onChange={(e) => handleChange('type', e.target.value as CreateTicketPayload['type'])} style={inputStyle}>
                    <option value="Bug">Bug</option>
                    <option value="Feature">Évolution</option>
                    <option value="Security">Sécurité</option>
                    <option value="Performance">Performance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Question">Question</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Projet</label>
                  <select value={form.techProjectId ?? ''} onChange={(e) => handleChange('techProjectId', e.target.value || undefined)} style={inputStyle}>
                    <option value="">— Aucun projet —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Assigné à</label>
                  <select value={form.assignedToId ?? ''} onChange={(e) => handleChange('assignedToId', e.target.value || undefined)} style={inputStyle}>
                    <option value="">— Non assigné —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Estimation</label>
                <DurationPicker value={estMinutes} onChange={setEstMinutes} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Description (Markdown supporté)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Décrivez le problème, les étapes de reproduction, l'impact..."
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/tickets')}>
                  Annuler
                </Button>
                <Button type="submit" variant="contained" size="small" sx={{ textTransform: 'none' }} disabled={submitting}>
                  {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Créer le ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
