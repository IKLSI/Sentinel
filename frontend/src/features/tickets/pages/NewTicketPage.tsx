import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import apiClient from '../../../services/client'
import { useToast } from '../../../hooks/useToast'
import { getProjects, ProjectDto } from '../../techHealth/api/projects'
import { getUsers } from '../../users/api/users'
import { User } from '../../../types'
import { DurationPicker } from '../../../components/DurationPicker'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import Tooltip from '@mui/material/Tooltip'

interface CreateTicketPayload {
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  type: 'Bug' | 'Feature' | 'Security' | 'Performance' | 'Maintenance' | 'Question'
  techProjectId?: string
  assignedToId?: string
  estimatedHours?: number
}

const inputSx = {
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
}

const labelSx = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  mb: '5px',
  color: 'var(--muted2)',
  letterSpacing: '0.04em',
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

  return (
    <>

      <Box sx={{ padding: '36px 28px 24px', maxWidth: '800px' }}>
        <Box sx={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', mb: '16px', overflow: 'hidden' }}>
          <Box sx={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '12px' }}>Créer un ticket</Box>
          <Box sx={{ padding: '16px 20px' }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: '14px' }}>
                <Box component="label" sx={labelSx}>Titre *</Box>
                <Box
                  component="input"
                  type="text"
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('title', e.target.value)}
                  placeholder="Description courte du problème"
                  required
                  autoFocus
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Box sx={{ mb: '14px' }}>
                  <Box component="label" sx={labelSx}>Priorité</Box>
                  <Box
                    component="select"
                    value={form.priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('priority', e.target.value as CreateTicketPayload['priority'])}
                    sx={inputSx}
                  >
                    <option value="Critical">Critique</option>
                    <option value="High">Haute</option>
                    <option value="Medium">Moyenne</option>
                    <option value="Low">Basse</option>
                  </Box>
                </Box>

                <Box sx={{ mb: '14px' }}>
                  <Box component="label" sx={labelSx}>Type</Box>
                  <Box
                    component="select"
                    value={form.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('type', e.target.value as CreateTicketPayload['type'])}
                    sx={inputSx}
                  >
                    <option value="Bug">Bug</option>
                    <option value="Feature">Évolution</option>
                    <option value="Security">Sécurité</option>
                    <option value="Performance">Performance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Question">Question</option>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Box sx={{ mb: '14px' }}>
                  <Box component="label" sx={labelSx}>Projet</Box>
                  <Box
                    component="select"
                    value={form.techProjectId ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('techProjectId', e.target.value || undefined)}
                    sx={inputSx}
                  >
                    <option value="">— Aucun projet —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: '14px' }}>
                  <Box component="label" sx={labelSx}>Assigné à</Box>
                  <Box
                    component="select"
                    value={form.assignedToId ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('assignedToId', e.target.value || undefined)}
                    sx={inputSx}
                  >
                    <option value="">— Non assigné —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: '14px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mb: '8px' }}>
                  <Box component="label" sx={labelSx}>Estimation</Box>
                  <Tooltip title="Formats acceptés : 2h, 1h30, 45m" placement="top" arrow>
                    <InfoOutlined sx={{ fontSize: 12, color: 'var(--muted)', cursor: 'help' }} />
                  </Tooltip>
                </Box>
                <DurationPicker value={estMinutes} onChange={setEstMinutes} />
              </Box>

              <Box sx={{ mb: '14px' }}>
                <Box component="label" sx={labelSx}>Description (Markdown supporté)</Box>
                <Box
                  component="textarea"
                  value={form.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                  placeholder="Décrivez le problème, les étapes de reproduction, l'impact..."
                  rows={8}
                  sx={{ ...inputSx, resize: 'vertical' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/tickets')}>
                  Annuler
                </Button>
                <Button type="submit" variant="contained" size="small" sx={{ textTransform: 'none' }} disabled={submitting}>
                  {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Créer le ticket'}
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Box>
    </>
  )
}
