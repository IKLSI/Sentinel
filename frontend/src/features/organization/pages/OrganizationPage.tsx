import React, { useState, useEffect } from 'react'
import { Topbar } from '../../../layouts/Topbar'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useToast } from '../../../hooks/useToast'
import apiClient from '../../../services/client'

interface OrgData {
  name: string
  slug: string
  timezone: string
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

export const OrganizationPage: React.FC = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingJira, setSavingJira] = useState(false)
  const [orgForm, setOrgForm] = useState<OrgData>({ name: '', slug: '', timezone: 'Europe/Paris' })
  const [jiraForm, setJiraForm] = useState({ url: '', username: '', apiToken: '' })

  useEffect(() => {
    apiClient.get<OrgData & { slug?: string }>('/api/organizations/current')
      .then((res) => {
        setOrgForm({
          name: res.data.name ?? '',
          slug: res.data.slug ?? '',
          timezone: res.data.timezone ?? 'Europe/Paris',
        })
      })
      .catch(() => showToast('Impossible de charger l\'organisation', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.put('/api/organizations/current', {
        name: orgForm.name,
        timezone: orgForm.timezone,
      })
      showToast('Configuration sauvegardée', 'success')
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveJira = async () => {
    if (!jiraForm.url || !jiraForm.username || !jiraForm.apiToken) {
      showToast('Remplissez tous les champs Jira', 'warning')
      return
    }
    setSavingJira(true)
    try {
      await apiClient.post('/api/organizations/current/jira', jiraForm)
      showToast('Intégration Jira sauvegardée', 'success')
    } catch {
      showToast('Erreur lors de la sauvegarde Jira', 'error')
    } finally {
      setSavingJira(false)
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Organisation" subtitle="Configuration" />
        <Box sx={{ p: '24px 28px', display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      </>
    )
  }

  return (
    <>
      <Topbar title="Organisation" subtitle="Configuration" />
      <Box sx={{ p: '24px 28px', maxWidth: '800px' }}>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '14px 18px', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '12px', color: 'text.primary' }}>Informations générales</Box>
          <Box sx={{ p: '16px 20px' }}>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Nom de l'organisation</label>
                <input type="text" style={inputStyle} value={orgForm.name} onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Identifiant (slug)</label>
                <input type="text" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value={orgForm.slug} readOnly />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Fuseau horaire</label>
                <select style={inputStyle} value={orgForm.timezone} onChange={(e) => setOrgForm((f) => ({ ...f, timezone: e.target.value }))}>
                  <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                  <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <Button type="submit" variant="contained" size="small" sx={{ textTransform: 'none' }} disabled={saving}>
                {saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Sauvegarder'}
              </Button>
            </form>
          </Box>
        </Paper>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '14px 18px', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '12px', color: 'text.primary' }}>Intégration Jira</Box>
          <Box sx={{ p: '16px 20px' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--accent-subtle)', borderRadius: 'var(--r)', fontSize: '12px', color: 'var(--muted2)', border: '1px solid var(--accent-border)' }}>
              ℹ Connectez votre instance Jira pour synchroniser les tickets automatiquement.
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>URL Jira</label>
              <input type="url" style={inputStyle} value={jiraForm.url} onChange={(e) => setJiraForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://votre-org.atlassian.net" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Nom d'utilisateur</label>
              <input type="text" style={inputStyle} value={jiraForm.username} onChange={(e) => setJiraForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>Token API</label>
              <input type="password" style={inputStyle} value={jiraForm.apiToken} onChange={(e) => setJiraForm((f) => ({ ...f, apiToken: e.target.value }))} placeholder="••••••••••••••••" />
            </div>
            <Button variant="contained" size="small" sx={{ textTransform: 'none' }} onClick={handleSaveJira} disabled={savingJira}>
              {savingJira ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Tester & Sauvegarder'}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '14px 18px', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '12px', color: 'text.primary' }}>Paramètres SLA par défaut</Box>
          <Box sx={{ p: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { label: 'Critique (heures)', value: 4 },
                { label: 'Haute (heures)', value: 8 },
                { label: 'Moyenne (heures)', value: 24 },
                { label: 'Basse (heures)', value: 72 },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '5px', color: 'var(--muted2)', letterSpacing: '0.04em' }}>{item.label}</label>
                  <input type="number" style={inputStyle} defaultValue={item.value} min={1} />
                </div>
              ))}
            </div>
            <Button variant="contained" size="small" sx={{ textTransform: 'none' }}>Sauvegarder les SLA</Button>
          </Box>
        </Paper>
      </Box>
    </>
  )
}
