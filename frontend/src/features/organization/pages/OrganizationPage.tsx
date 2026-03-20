import React, { useState, useEffect } from 'react'
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

export const OrganizationPage: React.FC = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgForm, setOrgForm] = useState<OrgData>({ name: '', slug: '', timezone: 'Europe/Paris' })

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

  if (loading) {
    return (
      <>

        <Box className="d-flex justify-content-center" sx={{ p: '24px 28px' }}>
          <CircularProgress size={24} />
        </Box>
      </>
    )
  }

  return (
    <>

      <Box className="page-enter" sx={{ p: '36px 28px 24px', maxWidth: '800px' }}>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '14px 18px', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '12px', color: 'text.primary' }}>Informations générales</Box>
          <Box sx={{ p: '16px 20px' }}>
            <form onSubmit={handleSave}>
              <Box className="mb-3">
                <Box component="label" sx={labelSx}>Nom de l'organisation</Box>
                <Box component="input" type="text" sx={fieldSx} value={orgForm.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgForm((f) => ({ ...f, name: e.target.value }))} />
              </Box>
              <Box className="mb-3">
                <Box component="label" sx={labelSx}>Identifiant (slug)</Box>
                <Box component="input" type="text" sx={{ ...fieldSx, opacity: 0.6, cursor: 'not-allowed' }} value={orgForm.slug} readOnly />
              </Box>
              <Box className="mb-3">
                <Box component="label" sx={labelSx}>Fuseau horaire</Box>
                <Box component="select" sx={fieldSx} value={orgForm.timezone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOrgForm((f) => ({ ...f, timezone: e.target.value }))}>
                  <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                  <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                  <option value="UTC">UTC</option>
                </Box>
              </Box>
              <Button type="submit" variant="contained" size="small" sx={{ textTransform: 'none' }} disabled={saving}>
                {saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Sauvegarder'}
              </Button>
            </form>
          </Box>
        </Paper>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '14px 18px', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '12px', color: 'text.primary' }}>Paramètres SLA par défaut</Box>
          <Box sx={{ p: '16px 20px' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { label: 'Critique (heures)', value: 4 },
                { label: 'Haute (heures)', value: 8 },
                { label: 'Moyenne (heures)', value: 24 },
                { label: 'Basse (heures)', value: 72 },
              ].map((item) => (
                <Box key={item.label} className="mb-3">
                  <Box component="label" sx={labelSx}>{item.label}</Box>
                  <Box component="input" type="number" sx={fieldSx} defaultValue={item.value} min={1} />
                </Box>
              ))}
            </Box>
            <Button variant="contained" size="small" sx={{ textTransform: 'none' }}>Sauvegarder les SLA</Button>
          </Box>
        </Paper>
      </Box>
    </>
  )
}
