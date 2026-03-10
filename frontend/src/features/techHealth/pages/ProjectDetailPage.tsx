import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Topbar } from '../../../layouts/Topbar'
import { StatusChip } from '../../../components/StatusChip'
import { HealthScoreCircle } from '../../../components/HealthScoreCircle'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import { useToast } from '../../../hooks/useToast'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import RefreshOutlined from '@mui/icons-material/RefreshOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import InventoryOutlined from '@mui/icons-material/InventoryOutlined'
import GppBadOutlined from '@mui/icons-material/GppBadOutlined'
import StorageOutlined from '@mui/icons-material/StorageOutlined'
import { getProject, deleteProject, ProjectDetailDto, DependencyDto, VulnerabilityDto, RuntimeDto } from '../api/projects'
import apiClient from '../../../services/client'

const DEP_STATUS: Record<string, { label: string; variant: 'green' | 'blue' | 'orange' | 'red' | 'gray' }> = {
  UpToDate:    { label: 'À jour',       variant: 'green'  },
  MinorUpdate: { label: 'Mise à jour',  variant: 'blue'   },
  MajorUpdate: { label: 'Majeure',      variant: 'orange' },
  Critical:    { label: 'Critique',     variant: 'red'    },
  Eol:         { label: 'EOL',          variant: 'red'    },
}

const SEV_VARIANT: Record<string, 'red' | 'orange' | 'gray' | 'blue'> = {
  Critical: 'red', High: 'orange', Medium: 'blue', Low: 'gray',
}

const SEV_LABEL: Record<string, string> = {
  Critical: 'Critique', High: 'Haute', Medium: 'Moyen', Low: 'Faible',
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [project, setProject] = useState<ProjectDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getProject(id)
      setProject(data)
    } catch {
      showToast('Impossible de charger le projet', 'error')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }, [id, showToast, navigate])

  useEffect(() => { load() }, [load])

  const handleScan = async () => {
    if (!id) return
    setScanning(true)
    try {
      await apiClient.post(`/api/tech-health/projects/${id}/scan`)
      showToast('Scan lancé avec succès', 'success')
      await load()
    } catch {
      showToast('Erreur lors du scan', 'error')
    } finally {
      setScanning(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteProject(id)
      showToast('Projet supprimé', 'success')
      navigate('/projects')
    } catch {
      showToast('Erreur lors de la suppression', 'error')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={28} />
      </div>
    )
  }

  if (!project) return null

  const allVulns = project.dependencies.flatMap((d) => d.vulnerabilities)
  const criticalVulns = allVulns.filter((v) => v.severity === 'Critical')
  const highVulns = allVulns.filter((v) => v.severity === 'High')

  return (
    <>
      <Topbar
        title={project.name}
        subtitle={project.repositoryUrl ?? 'Aucun dépôt configuré'}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outlined" size="small" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/projects')}>
              <ArrowBackOutlined sx={{ fontSize: 14 }} />Projets
            </Button>
            <Button variant="outlined" size="small" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={handleScan} disabled={scanning}>
              <RefreshOutlined sx={{ fontSize: 14 }} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
              {scanning ? 'Scan...' : 'Lancer un scan'}
            </Button>
            <Button variant="outlined" size="small" sx={{ textTransform: 'none', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setShowDeleteModal(true)}>
              <DeleteOutlineOutlined sx={{ fontSize: 14 }} />Supprimer
            </Button>
          </div>
        }
      />

      <Box sx={{ p: '24px 28px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px', marginBottom: '24px' }}>

          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Box sx={{ p: '16px 20px' }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <HealthScoreCircle
                  score={project.healthScore}
                  grade={project.healthGrade as 'A' | 'B' | 'C' | 'D' | 'F'}
                  size={80}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Score santé
                  </div>
                  {project.lastScanAt && (
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <AccessTimeOutlined sx={{ fontSize: 10 }} />
                      {new Date(project.lastScanAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </Box>
          </Paper>

          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Box sx={{ p: '16px 20px' }}>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', height: '100%' }}>
                <StatCell label="Dépendances" value={project.totalDependencies} icon={<InventoryOutlined sx={{ fontSize: 16 }} />} />
                <StatCell label="Vulnérables" value={project.vulnerableDependencies} icon={<GppBadOutlined sx={{ fontSize: 16 }} />} warn={project.vulnerableDependencies > 0} />
                <StatCell label="Critiques" value={project.criticalVulnerabilities} icon={<GppBadOutlined sx={{ fontSize: 16 }} />} warn={project.criticalVulnerabilities > 0} danger />
                <StatCell label="Runtimes" value={project.runtimes.length} icon={<StorageOutlined sx={{ fontSize: 16 }} />} />
              </div>
            </Box>
          </Paper>
        </div>

        {(project.repositoryUrl || project.scanFrequency) && (
          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Box sx={{ p: '14px 20px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {project.repositoryUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
                    <AccountTreeOutlined sx={{ fontSize: 14 }} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted2)' }}>{project.repositoryUrl}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                  <RefreshOutlined sx={{ fontSize: 12 }} />
                  Scan {project.scanFrequency === 'Daily' ? 'quotidien' : 'hebdomadaire'}
                </div>
              </div>
            </Box>
          </Paper>
        )}

        {(criticalVulns.length > 0 || highVulns.length > 0) && (
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle icon={<GppBadOutlined sx={{ fontSize: 14 }} />} label="Vulnérabilités" count={allVulns.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...criticalVulns, ...highVulns].map((v) => (
                <VulnCard key={v.id} vuln={v} />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <SectionTitle icon={<InventoryOutlined sx={{ fontSize: 14 }} />} label="Dépendances" count={project.dependencies.length} />
          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Box sx={{ p: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Paquet', 'Écosystème', 'Type', 'Installée', 'Dernière', 'Statut', 'Vulnérabilités'].map((h) => (
                      <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--s2)', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {project.dependencies.map((d: DependencyDto) => {
                    const s = DEP_STATUS[d.status] ?? { label: d.status, variant: 'gray' as const }
                    return (
                      <tr key={d.id} onMouseEnter={(e) => Array.from(e.currentTarget.cells).forEach((c) => (c.style.background = 'var(--s2)'))} onMouseLeave={(e) => Array.from(e.currentTarget.cells).forEach((c) => (c.style.background = 'transparent'))}>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{d.name}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted)' }}>{d.ecosystem}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                          <StatusChip variant={d.type === 'Prod' ? 'blue' : 'gray'}>{d.type}</StatusChip>
                        </td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.currentVersion}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: d.latestVersion && d.latestVersion !== d.currentVersion ? 'var(--orange)' : 'var(--muted)' }}>{d.latestVersion ?? '—'}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                          <StatusChip variant={s.variant}>{s.label}</StatusChip>
                        </td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                          {d.vulnerabilities.length > 0
                            ? <StatusChip variant="red">{d.vulnerabilities.length}</StatusChip>
                            : <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        </div>

        {project.runtimes.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle icon={<StorageOutlined sx={{ fontSize: 14 }} />} label="Runtimes" count={project.runtimes.length} />
            <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
              <Box sx={{ p: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Runtime', 'Version', 'Fin de support', 'Statut'].map((h) => (
                        <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--s2)', fontWeight: 500 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {project.runtimes.map((r: RuntimeDto) => (
                      <tr key={r.id} onMouseEnter={(e) => Array.from(e.currentTarget.cells).forEach((c) => (c.style.background = 'var(--s2)'))} onMouseLeave={(e) => Array.from(e.currentTarget.cells).forEach((c) => (c.style.background = 'transparent'))}>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{r.version}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                          {r.eolDate ? new Date(r.eolDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                          {r.isEol ? <StatusChip variant="red">EOL</StatusChip> : <StatusChip variant="green">Supporté</StatusChip>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
          </div>
        )}
      </Box>

      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700, pb: 1 }}>Supprimer le projet</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            Supprimer <strong>{project.name}</strong> ?
            Cette action supprimera aussi toutes les dépendances et vulnérabilités associées.
            Elle est irréversible.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: '16px', pt: 0 }}>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="contained" color="error" size="small" sx={{ textTransform: 'none' }} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const SectionTitle: React.FC<{ icon: React.ReactNode; label: string; count: number }> = ({ icon, label, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
    <span style={{ color: 'var(--muted)', display: 'flex' }}>{icon}</span>
    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, background: 'var(--s3)', color: 'var(--muted2)', padding: '1px 7px', borderRadius: '10px' }}>
      {count}
    </span>
  </div>
)

const StatCell: React.FC<{ label: string; value: number; icon: React.ReactNode; warn?: boolean; danger?: boolean }> = ({ label, value, icon, warn, danger }) => (
  <div style={{ padding: '0 20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
      {icon}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: danger && value > 0 ? 'var(--red)' : warn && value > 0 ? 'var(--orange)' : 'var(--text)', letterSpacing: '-0.02em' }}>
      {value}
    </div>
  </div>
)

const VulnCard: React.FC<{ vuln: VulnerabilityDto }> = ({ vuln }) => (
  <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
    <Box sx={{ p: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <StatusChip variant={SEV_VARIANT[vuln.severity] ?? 'gray'}>{SEV_LABEL[vuln.severity] ?? vuln.severity}</StatusChip>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>{vuln.cveId}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--orange)', fontWeight: 700 }}>CVSS {vuln.cvssScore.toFixed(1)}</span>
            {vuln.fixedVersion && (
              <span style={{ fontSize: '10px', color: 'var(--green)' }}>Fix : {vuln.fixedVersion}</span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>{vuln.description}</div>
        </div>
      </div>
    </Box>
  </Paper>
)
