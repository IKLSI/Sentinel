import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Topbar } from '../../../layouts/Topbar'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import { useToast } from '../../../hooks/useToast'
import { getInvoice, updateInvoiceStatus, deleteInvoice, downloadInvoicePdf, InvoiceDto } from '../api/invoices'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import SendOutlined from '@mui/icons-material/SendOutlined'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import EuroOutlined from '@mui/icons-material/EuroOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const fmtEur = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const fmtDate = (d?: string) =>
  d ? format(new Date(d), 'dd MMMM yyyy', { locale: fr }) : '—'

const STEPS = [
  { key: 'Draft', label: 'Brouillon' },
  { key: 'Sent', label: 'Envoyée' },
  { key: 'Paid', label: 'Payée' },
]

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [invoice, setInvoice] = useState<InvoiceDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getInvoice(id)
      setInvoice(data)
    } catch {
      showToast('Facture introuvable', 'error')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }, [id, showToast, navigate])

  useEffect(() => { load() }, [load])

  const handleSend = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      const updated = await updateInvoiceStatus(invoice.id, 'Sent')
      setInvoice(updated)
      setShowSendModal(false)
      showToast('Facture marquée comme envoyée', 'success')
    } catch {
      showToast('Erreur', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePay = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      const updated = await updateInvoiceStatus(invoice.id, 'Paid')
      setInvoice(updated)
      setShowPayModal(false)
      showToast('Facture marquée comme payée', 'success')
    } catch {
      showToast('Erreur', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      await deleteInvoice(invoice.id)
      showToast('Facture supprimée', 'success')
      navigate('/invoices')
    } catch {
      showToast('Erreur lors de la suppression', 'error')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Box className="d-flex justify-content-center align-items-center" sx={{ height: '100vh' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!invoice) return null

  const currentStep = STEPS.findIndex((s) => s.key === invoice.status)
  const overdue = invoice.isOverdue
  const hourlyRate = invoice.dailyRate > 0 ? invoice.dailyRate / 8 : 0

  return (
    <>
      <Topbar
        title={invoice.reference}
        subtitle={`${invoice.label} · ${invoice.period}`}
        actions={
          <Box className="d-flex gap-2">
            <Button variant="outlined" size="small" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/invoices')}>
              <ArrowBackOutlined sx={{ fontSize: 14 }} />Factures
            </Button>
            {invoice.hasPdf && (
              <Button variant="outlined" size="small" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => downloadInvoicePdf(invoice.id)}>
                <FileDownloadOutlined sx={{ fontSize: 14 }} />PDF
              </Button>
            )}
            {invoice.status === 'Draft' && (
              <>
                <Button variant="contained" size="small" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setShowSendModal(true)}>
                  <SendOutlined sx={{ fontSize: 14 }} />Envoyer
                </Button>
                <Button variant="outlined" size="small" sx={{ textTransform: 'none', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setShowDeleteModal(true)}>
                  <DeleteOutlineOutlined sx={{ fontSize: 14 }} />Supprimer
                </Button>
              </>
            )}
            {invoice.status === 'Sent' && (
              <Button variant="contained" size="small" sx={{ textTransform: 'none', background: 'var(--green)', borderColor: 'var(--green)', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setShowPayModal(true)}>
                <CheckCircleOutlined sx={{ fontSize: 14 }} />Marquer payée
              </Button>
            )}
          </Box>
        }
      />

      <Box sx={{ p: '24px 28px' }}>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '20px 24px' }}>
            <Box className="d-flex align-items-center" sx={{ gap: '0' }}>
              {STEPS.map((step, idx) => {
                const done = idx < currentStep
                const active = idx === currentStep
                const isOverdueStep = active && overdue

                return (
                  <React.Fragment key={step.key}>
                    <Box className="d-flex flex-column align-items-center" sx={{ gap: '6px', flex: 1 }}>
                      <Box sx={{
                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'var(--green)' : active ? (isOverdueStep ? 'var(--red)' : 'var(--accent)') : 'var(--s3)',
                        border: `2px solid ${done ? 'var(--green)' : active ? (isOverdueStep ? 'var(--red)' : 'var(--accent)') : 'var(--border)'}`,
                        color: done || active ? '#fff' : 'var(--muted)',
                        fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
                      }}>
                        {done ? <CheckCircleOutlined sx={{ fontSize: 16 }} /> : idx + 1}
                      </Box>
                      <Box component="span" sx={{ fontSize: '11px', fontWeight: active ? 700 : 400, color: active ? (isOverdueStep ? 'var(--red)' : 'var(--accent)') : done ? 'var(--green)' : 'var(--muted)' }}>
                        {isOverdueStep ? 'En retard' : step.label}
                      </Box>
                      {active && invoice.paidAt && (
                        <Box component="span" sx={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{fmtDate(invoice.paidAt)}</Box>
                      )}
                    </Box>
                    {idx < STEPS.length - 1 && (
                      <Box sx={{ flex: 2, height: '2px', background: done ? 'var(--green)' : 'var(--border)', margin: '0 4px', marginBottom: '22px', transition: 'background 0.2s' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', mb: '24px' }}>

          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Box sx={{ p: '20px 22px' }}>
              <SectionLabel icon={<ApartmentOutlined sx={{ fontSize: 13 }} />} label="Libellé" />
              <Box className="d-flex flex-column" sx={{ gap: '10px' }}>
                <InfoRow label="Libellé" value={invoice.label} bold />
                {invoice.techProjectName && <InfoRow label="Projet" value={invoice.techProjectName} />}
                <InfoRow label="Taux journalier" value={fmtEur(invoice.dailyRate)} />
                <InfoRow label="Taux horaire" value={fmtEur(hourlyRate)} />
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Box sx={{ p: '20px 22px' }}>
              <SectionLabel icon={<CalendarTodayOutlined sx={{ fontSize: 13 }} />} label="Dates" />
              <Box className="d-flex flex-column" sx={{ gap: '10px' }}>
                <InfoRow label="Période facturée" value={invoice.period} bold />
                <InfoRow label="Date d'émission" value={fmtDate(invoice.issuedAt)} />
                <InfoRow
                  label="Date d'échéance"
                  value={fmtDate(invoice.dueAt)}
                  valueColor={overdue ? 'var(--red)' : undefined}
                  suffix={overdue ? ' · DÉPASSÉE' : undefined}
                />
                {invoice.paidAt && <InfoRow label="Date de paiement" value={fmtDate(invoice.paidAt)} valueColor="var(--green)" />}
              </Box>
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Box sx={{ p: '14px 18px', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '12px', color: 'text.primary' }}>
            <SectionLabel icon={<DescriptionOutlined sx={{ fontSize: 13 }} />} label="Détail de facturation" />
          </Box>
          <Box sx={{ p: '0' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Description', 'Quantité', 'Prix unitaire', 'Montant HT'].map((h) => (
                    <Box component="th" key={h} sx={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '10px 20px', background: 'var(--s2)', fontWeight: 500 }}>
                      {h}
                    </Box>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Box component="td" sx={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                    {invoice.techProjectName ? `${invoice.techProjectName} — ` : ''}{invoice.period}
                  </Box>
                  <Box component="td" sx={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700 }}>
                    {invoice.totalHours}h
                  </Box>
                  <Box component="td" sx={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {hourlyRate > 0 ? fmtEur(hourlyRate) + '/h' : '—'}
                  </Box>
                  <Box component="td" sx={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700 }}>
                    {fmtEur(invoice.totalAmount)}
                  </Box>
                </tr>
              </tbody>
            </Box>

            <Box sx={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TotalRow label="Total HT" value={fmtEur(invoice.totalAmount)} />
                <TotalRow label={`TVA (${invoice.taxRate}%)`} value={fmtEur(invoice.taxAmount)} />
                <Box sx={{ borderTop: '1px solid var(--border)', pt: '8px' }}>
                  <TotalRow label="Total TTC" value={fmtEur(invoice.totalWithTax)} accent />
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <FinCard icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />} label="Heures prestées" value={`${invoice.totalHours}h`} />
          <FinCard icon={<EuroOutlined sx={{ fontSize: 16 }} />} label="Montant HT" value={fmtEur(invoice.totalAmount)} />
          <FinCard icon={<EuroOutlined sx={{ fontSize: 16 }} />} label="Montant TTC" value={fmtEur(invoice.totalWithTax)} accent />
        </Box>
      </Box>

      <Dialog open={showSendModal} onClose={() => setShowSendModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700, pb: 1 }}>Envoyer la facture</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box component="p" sx={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            Marquer la facture <strong>{invoice.reference}</strong> ({fmtEur(invoice.totalWithTax)}) comme envoyée à <strong>{invoice.label}</strong> ?
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '16px', pt: 0 }}>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setShowSendModal(false)}>Annuler</Button>
          <Button variant="contained" size="small" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={handleSend} disabled={actionLoading}>
            <SendOutlined sx={{ fontSize: 14 }} />
            {actionLoading ? 'Envoi...' : "Confirmer l'envoi"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPayModal} onClose={() => setShowPayModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700, pb: 1 }}>Confirmer le paiement</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box component="p" sx={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            Enregistrer le paiement de <strong>{fmtEur(invoice.totalWithTax)}</strong> pour la facture <strong>{invoice.reference}</strong> ?
            La date de paiement sera enregistrée à aujourd'hui.
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '16px', pt: 0 }}>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setShowPayModal(false)}>Annuler</Button>
          <Button variant="contained" size="small" sx={{ textTransform: 'none', background: 'var(--green)', borderColor: 'var(--green)', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={handlePay} disabled={actionLoading}>
            <CheckCircleOutlined sx={{ fontSize: 14 }} />
            {actionLoading ? 'Enregistrement...' : 'Confirmer le paiement'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700, pb: 1 }}>Supprimer le brouillon</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box component="p" sx={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            Supprimer définitivement le brouillon <strong>{invoice.reference}</strong> ?
            Cette action est irréversible.
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '16px', pt: 0 }}>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="contained" color="error" size="small" sx={{ textTransform: 'none' }} onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Box className="d-flex align-items-center" sx={{ gap: '7px', mb: '14px' }}>
    <Box component="span" sx={{ color: 'var(--muted)', display: 'flex' }}>{icon}</Box>
    <Box component="span" sx={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontWeight: 600 }}>{label}</Box>
  </Box>
)

const InfoRow: React.FC<{ label: string; value: string; bold?: boolean; valueColor?: string; suffix?: string }> = ({ label, value, bold, valueColor, suffix }) => (
  <Box className="d-flex justify-content-between align-items-center">
    <Box component="span" sx={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</Box>
    <Box component="span" sx={{ fontSize: '13px', fontWeight: bold ? 700 : 500, color: valueColor ?? 'var(--text)', fontFamily: bold ? undefined : 'var(--font-mono)' }}>
      {value}{suffix && <Box component="span" sx={{ fontSize: '10px', fontWeight: 700, ml: '6px' }}>{suffix}</Box>}
    </Box>
  </Box>
)

const TotalRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <Box className="d-flex justify-content-between align-items-center">
    <Box component="span" sx={{ fontSize: accent ? '14px' : '13px', fontWeight: accent ? 700 : 400, color: accent ? 'var(--text)' : 'var(--text-secondary)' }}>
      {label}
    </Box>
    <Box component="span" sx={{ fontFamily: 'var(--font-mono)', fontSize: accent ? '18px' : '13px', fontWeight: accent ? 800 : 600, color: accent ? 'var(--green)' : 'var(--text)' }}>
      {value}
    </Box>
  </Box>
)

const FinCard: React.FC<{ icon: React.ReactNode; label: string; value: string; accent?: boolean }> = ({ icon, label, value, accent }) => (
  <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
    <Box sx={{ p: '18px 20px' }}>
      <Box className="d-flex align-items-center" sx={{ gap: '8px', mb: '10px', color: 'var(--muted)' }}>
        {icon}
        <Box component="span" sx={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>{label}</Box>
      </Box>
      <Box sx={{ fontSize: '22px', fontWeight: 800, color: accent ? 'var(--green)' : 'var(--text)', letterSpacing: '-0.02em' }}>
        {value}
      </Box>
    </Box>
  </Paper>
)
