import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { AppModal } from '../../../components/AppModal'
import { RowActions } from '../../../components/RowActions'
import { StatusChip } from '../../../components/StatusChip'
import { useAuth } from '../../auth/hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { inviteUser, getUsers, toggleUserActive } from '../../users/api/users'
import {
  getSlaSettings, updateSlaSettings, SlaSettings,
  getOrganizationSettings, updateOrganizationSettings, OrganizationSettings,
} from '../api/settings'
import { User, UserRole } from '../../../types'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import BlockOutlined from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined'
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import BusinessOutlined from '@mui/icons-material/BusinessOutlined'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import EmailOutlined from '@mui/icons-material/EmailOutlined'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrateur', Developer: 'Développeur',
}
const ROLE_VARIANTS: Record<string, 'red' | 'orange' | 'blue'> = {
  Admin: 'red', Developer: 'blue',
}

const TIMEZONES = [
  { value: 'Europe/Paris',    label: 'Europe / Paris (CET)' },
  { value: 'Europe/London',   label: 'Europe / Londres (GMT)' },
  { value: 'Europe/Berlin',   label: 'Europe / Berlin (CET)' },
  { value: 'Europe/Madrid',   label: 'Europe / Madrid (CET)' },
  { value: 'Europe/Rome',     label: 'Europe / Rome (CET)' },
  { value: 'Europe/Zurich',   label: 'Europe / Zurich (CET)' },
  { value: 'America/New_York',    label: 'Amérique / New York (EST)' },
  { value: 'America/Chicago',     label: 'Amérique / Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'Amérique / Los Angeles (PST)' },
  { value: 'America/Sao_Paulo',   label: 'Amérique / São Paulo (BRT)' },
  { value: 'Asia/Tokyo',      label: 'Asie / Tokyo (JST)' },
  { value: 'Asia/Shanghai',   label: 'Asie / Shanghai (CST)' },
  { value: 'Asia/Dubai',      label: 'Asie / Dubaï (GST)' },
  { value: 'Australia/Sydney', label: 'Australie / Sydney (AEST)' },
  { value: 'UTC',             label: 'UTC' },
]

function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1, 2]
  if (page > 3) pages.push('...')
  if (page > 2 && page < totalPages) pages.push(page)
  if (page < totalPages - 1) pages.push('...')
  if (!pages.includes(totalPages)) pages.push(totalPages)
  return pages
}

const navBtnSx = (disabled: boolean) => ({
  all: 'unset' as const,
  cursor: disabled ? 'default' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '6px', height: '30px', px: '10px',
  borderRadius: '7px', fontSize: '12px', fontWeight: 600,
  color: disabled ? 'var(--muted)' : 'var(--text-secondary)',
  background: 'var(--s2)', border: '1px solid var(--border)',
  opacity: disabled ? 0.35 : 1,
  pointerEvents: disabled ? 'none' : 'auto',
  transition: 'background 0.12s, color 0.12s',
  ...(!disabled && { '&:hover': { background: 'var(--s3)', color: 'var(--text)' } }),
})

const pageBtnSx = (active: boolean) => ({
  all: 'unset' as const,
  cursor: active ? 'default' : 'pointer',
  minWidth: '30px', height: '30px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '7px', fontSize: '12px', fontWeight: active ? 700 : 500,
  color: active ? '#fff' : 'var(--text-secondary)',
  background: active ? 'var(--accent)' : 'transparent',
  boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
  transition: 'background 0.12s, color 0.12s',
  ...(!active && { '&:hover': { background: 'var(--s2)', color: 'var(--text)' } }),
})

const MemberPagination: React.FC<{ page: number; totalPages: number; total: number; onChange: (p: number) => void }> = ({ page, totalPages, total, onChange }) => {
  const pages = getPageNumbers(page, totalPages)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '16px', py: '10px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--s2)' }}>
      <Box sx={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        {total} membre{total > 1 ? 's' : ''}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Box component="button" sx={navBtnSx(page === 1)} onClick={() => onChange(page - 1)}>← Précédent</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', mx: '2px' }}>
          {pages.map((p, i) =>
            p === '...'
              ? <Box key={`e-${i}`} sx={{ minWidth: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>·</Box>
              : <Box key={p} component="button" sx={pageBtnSx(p === page)} onClick={() => p !== page && onChange(p as number)}>{p}</Box>
          )}
        </Box>
        <Box component="button" sx={navBtnSx(page === totalPages)} onClick={() => onChange(page + 1)}>Suivant →</Box>
      </Box>
    </Box>
  )
}

const inp = {
  width: '100%', display: 'block', boxSizing: 'border-box',
  background: 'var(--s2)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '6px 10px',
  fontSize: '12px', color: 'var(--text)', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  '&:focus': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
} as const


const CARD_SX = {
  background: 'var(--s1)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  overflow: 'hidden',
} as const

function CardHeader({ label }: { label: string }) {
  return (
    <Box sx={{
      px: '16px', minHeight: '40px',
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--s2)',
    }}>
      <Box sx={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </Box>
    </Box>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Box sx={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', mb: '5px', letterSpacing: '0.01em' }}>{children}</Box>
}

const SLA_PRIORITIES = [
  { key: 'criticalHours' as keyof SlaSettings, label: 'Critique', color: '#ef4444', bg: 'rgba(239,68,68,0.07)', desc: 'Service bloqué' },
  { key: 'highHours'     as keyof SlaSettings, label: 'Haute',    color: '#f97316', bg: 'rgba(249,115,22,0.07)', desc: 'Impact majeur' },
  { key: 'mediumHours'   as keyof SlaSettings, label: 'Moyenne',  color: '#eab308', bg: 'rgba(234,179,8,0.07)',  desc: 'Gêne fonctionnelle' },
  { key: 'lowHours'      as keyof SlaSettings, label: 'Basse',    color: '#22c55e', bg: 'rgba(34,197,94,0.07)',  desc: 'Amélioration' },
]

type Tab = 'members' | 'organisation'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'organisation', label: 'Organisation', icon: BusinessOutlined },
  { id: 'members',      label: 'Membres',      icon: PeopleOutlined   },
]

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('organisation')

  // ── Membres
  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inv, setInv] = useState({ email: '', role: 'Developer' as UserRole })
  const [submitting, setSubmitting] = useState(false)

  // ── Organisation
  const [org, setOrg] = useState<OrganizationSettings | null>(null)
  const [orgForm, setOrgForm] = useState({ name: '', timezone: 'Europe/Paris' })
  const [loadingOrg, setLoadingOrg] = useState(true)
  const [savingOrg, setSavingOrg] = useState(false)

  // ── SLA
  const [sla, setSla] = useState<SlaSettings>({ criticalHours: 4, highHours: 8, mediumHours: 24, lowHours: 48 })
  const [savedSla, setSavedSla] = useState<SlaSettings>({ criticalHours: 4, highHours: 8, mediumHours: 24, lowHours: 48 })
  const [loadingSla, setLoadingSla] = useState(true)
  const [savingSla, setSavingSla] = useState(false)

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const measure = () => setPageSize(Math.max(1, Math.floor((el.clientHeight - 52 - 41) / 52)))
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try { setMembers((await getUsers()).items) }
    catch { showToast('Impossible de charger les membres', 'error') }
    finally { setLoadingMembers(false) }
  }, [showToast])

  useEffect(() => { loadMembers() }, [loadMembers])

  useEffect(() => {
    Promise.all([getOrganizationSettings(), getSlaSettings()])
      .then(([o, s]) => {
        setOrg(o)
        setOrgForm({ name: o.name, timezone: o.timezone })
        setSla(s); setSavedSla(s)
      })
      .catch(() => showToast('Impossible de charger les paramètres', 'error'))
      .finally(() => { setLoadingOrg(false); setLoadingSla(false) })
  }, [])

  useEffect(() => { setPage(1) }, [memberSearch, memberRoleFilter])

  const filteredMembers = useMemo(() => {
    let list = members
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase()
      list = list.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      )
    }
    if (memberRoleFilter !== 'all') list = list.filter(m => m.role === memberRoleFilter)
    return list
  }, [members, memberSearch, memberRoleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize)

  const handleToggleActive = async (memberId: string, currentlyActive: boolean) => {
    setTogglingId(memberId)
    try {
      await toggleUserActive(memberId, !currentlyActive)
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: !currentlyActive } : m))
    } catch { showToast('Erreur lors de la modification', 'error') }
    finally { setTogglingId(null) }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inv.email) { showToast('Champs obligatoires manquants', 'warning'); return }
    setSubmitting(true)
    try {
      await inviteUser(inv)
      showToast('Invitation envoyée', 'success')
      setInviteOpen(false)
      setInv({ email: '', role: 'Developer' })
    } catch { showToast("Erreur lors de l'invitation", 'error') }
    finally { setSubmitting(false) }
  }

  const handleSaveOrg = async () => {
    if (!orgForm.name.trim()) { showToast('Le nom est requis', 'warning'); return }
    setSavingOrg(true)
    try {
      const updated = await updateOrganizationSettings(orgForm)
      setOrg(updated)
      setOrgForm({ name: updated.name, timezone: updated.timezone })
      showToast('Organisation mise à jour', 'success')
    } catch { showToast('Erreur lors de la mise à jour', 'error') }
    finally { setSavingOrg(false) }
  }

  const handleSaveSla = async () => {
    setSavingSla(true)
    try {
      const updated = await updateSlaSettings(sla)
      setSla(updated); setSavedSla(updated)
      showToast('Paramètres SLA sauvegardés', 'success')
    } catch { showToast('Erreur lors de la sauvegarde', 'error') }
    finally { setSavingSla(false) }
  }

  const slaUnchanged = sla.criticalHours === savedSla.criticalHours && sla.highHours === savedSla.highHours && sla.mediumHours === savedSla.mediumHours && sla.lowHours === savedSla.lowHours
  const orgUnchanged = org ? (orgForm.name === org.name && orgForm.timezone === org.timezone) : true

  return (
    <>
      <Box className="page-enter" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* ── Tab strip ── */}
        <Box sx={{ px: '28px', pt: '28px', pb: 0, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid var(--border)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <Box key={tab.id} component="button" onClick={() => setActiveTab(tab.id)} sx={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  px: '14px', pb: '11px', pt: '2px',
                  fontSize: '13px', fontWeight: active ? 600 : 450,
                  color: active ? 'var(--text)' : 'var(--muted)',
                  position: 'relative', transition: 'color 0.12s',
                  '&:hover': !active ? { color: 'var(--text-secondary)' } : {},
                  '&::after': {
                    content: '""', position: 'absolute', bottom: -1, left: 0, right: 0,
                    height: '2px', borderRadius: '2px 2px 0 0',
                    background: active ? 'var(--accent)' : 'transparent', transition: 'background 0.15s',
                  },
                }}>
                  <Icon sx={{ fontSize: 14, color: active ? 'var(--accent)' : 'inherit', transition: 'color 0.12s' }} />
                  {tab.label}
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* ── Contenu ── */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: '20px 28px 20px' }}>

          {/* ════ MEMBRES ════ */}
          <Box sx={{ display: activeTab === 'members' ? 'contents' : 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '12px', flexShrink: 0 }}>
              <Box sx={{
                flex: '0 0 240px', display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--s1)', border: '1px solid var(--border)',
                borderRadius: '8px', px: '10px', height: '32px',
                '&:focus-within': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
              }}>
                <SearchOutlined sx={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }} />
                <Box component="input" placeholder="Rechercher…"
                  sx={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text)', fontFamily: 'inherit' }}
                  value={memberSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)} />
              </Box>
              <Box component="select"
                sx={{
                  appearance: 'none', WebkitAppearance: 'none',
                  background: "var(--s1) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\") no-repeat right 12px center",
                  border: '1px solid var(--border)', borderRadius: 'var(--r)',
                  px: '12px', height: '32px', pr: '36px', boxSizing: 'border-box',
                  fontSize: '13px', color: 'var(--text)',
                  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                }}
                value={memberRoleFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMemberRoleFilter(e.target.value)}>
                <option value="all">Tous les rôles</option>
                <option value="Admin">Administrateur</option>
                <option value="Developer">Développeur</option>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" size="small" onClick={() => setInviteOpen(true)} startIcon={<PersonAddOutlined sx={{ fontSize: '13px !important' }} />}>
                Ajouter un membre
              </Button>
            </Box>

            <Box ref={tableWrapRef} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              {loadingMembers ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
              ) : filteredMembers.length === 0 ? (
                <Box className="empty-state"><Box className="empty-state-title">Aucun membre trouvé</Box></Box>
              ) : (
                <>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <Box component="thead">
                        <Box component="tr" sx={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                          {[
                            { label: 'Membre', width: 'auto' },
                            { label: 'Rôle', width: '90px' },
                            { label: 'Statut', width: '110px' },
                            { label: 'Dernière connexion', width: '160px' },
                            { label: '', width: '48px' },
                          ].map(({ label, width }) => (
                            <Box component="th" key={label} sx={{ px: '16px', py: '10px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', width }}>{label}</Box>
                          ))}
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {paginatedMembers.map(m => (
                          <Box component="tr" key={m.id} sx={{ borderBottom: '1px solid var(--border)', '&:last-child': { borderBottom: 'none' }, '&:hover': { background: 'var(--s2)' }, '&:hover .row-actions': { opacity: '1 !important' }, transition: 'background 0.1s' }}>
                            <Box component="td" sx={{ px: '16px', py: '10px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Box>
                                  <Box sx={{ fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{m.firstName} {m.lastName}</Box>
                                  <Box sx={{ color: 'var(--muted2)', fontSize: '11px' }}>{m.email}</Box>
                                </Box>
                              </Box>
                            </Box>
                            <Box component="td" sx={{ px: '16px', py: '10px' }}>
                              <StatusChip variant="gray">{ROLE_LABELS[m.role] ?? m.role}</StatusChip>
                            </Box>
                            <Box component="td" sx={{ px: '16px', py: '10px' }}>
                              <StatusChip variant="gray">{m.isActive ? 'Actif' : 'Inactif'}</StatusChip>
                            </Box>
                            <Box component="td" sx={{ px: '16px', py: '10px', color: 'var(--muted2)', fontSize: '11px' }}>
                              {m.lastLoginAt ? formatDistanceToNow(new Date(m.lastLoginAt), { addSuffix: true, locale: fr }) : '—'}
                            </Box>
                            <Box component="td" sx={{ px: '16px', py: '10px', textAlign: 'right' }}>
                              {m.id !== user?.id && (
                                togglingId === m.id ? <CircularProgress size={13} /> :
                                <RowActions actions={[
                                  { icon: m.isActive ? <BlockOutlined sx={{ fontSize: 13 }} /> : <CheckCircleOutlineOutlined sx={{ fontSize: 13 }} />, label: m.isActive ? 'Désactiver' : 'Activer', onClick: () => handleToggleActive(m.id, m.isActive), color: m.isActive ? 'red' : 'green' },
                                ]} />
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  <MemberPagination page={page} totalPages={totalPages} total={filteredMembers.length} onChange={setPage} />
                </>
              )}
            </Box>
          </Box>

          {/* ════ ORGANISATION ════ */}
          {activeTab === 'organisation' && (
            <Box sx={{ overflow: 'auto', flex: 1, pr: '4px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', pb: '8px' }}>

                {/* ── Card Identité ── */}
                <Box sx={CARD_SX}>
                  <CardHeader label="Identité" />
                  {loadingOrg ? (
                    <Box sx={{ p: '24px', display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', px: '16px', py: '12px' }}>
                        <Box>
                          <FieldLabel>Nom de l'organisation</FieldLabel>
                          <Box component="input" type="text" sx={inp}
                            value={orgForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgForm(f => ({ ...f, name: e.target.value }))} />
                        </Box>
                        <Box>
                          <FieldLabel>Fuseau horaire</FieldLabel>
                          <Box sx={{ position: 'relative' }}>
                            <Box component="select" sx={{ ...inp, pr: '28px', cursor: 'pointer', appearance: 'none' }}
                              value={orgForm.timezone}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOrgForm(f => ({ ...f, timezone: e.target.value }))}>
                              {TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                              ))}
                            </Box>
                            <KeyboardArrowDownOutlined sx={{ fontSize: 14, color: 'var(--muted)', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ px: '16px', py: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" size="small" onClick={handleSaveOrg} disabled={savingOrg || orgUnchanged} sx={{ minWidth: '110px' }}>
                          {savingOrg ? 'Sauvegarde…' : 'Sauvegarder'}
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>

                {/* ── Card SLA ── */}
                <Box sx={CARD_SX}>
                  <CardHeader label="Délais par priorité" />
                  {loadingSla ? (
                    <Box sx={{ p: '24px', display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                        {SLA_PRIORITIES.map(({ key, label, color, bg, desc }) => {
                          const hours = sla[key]
                          const dec = () => setSla(p => ({ ...p, [key]: Math.max(1, p[key] - 1) }))
                          const inc = () => setSla(p => ({ ...p, [key]: Math.min(999, p[key] + 1) }))
                          return (
                            <Box key={key} sx={{ background: 'var(--s1)', px: '16px', py: '9px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Box sx={{ width: 3, height: 24, borderRadius: 2, background: color, flexShrink: 0, opacity: 0.7 }} />
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ fontSize: '12px', fontWeight: 700, color, mb: '1px' }}>{label}</Box>
                                <Box sx={{ fontSize: '11px', color: 'var(--muted)' }}>{desc}</Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Box component="button" type="button" onClick={dec} sx={{
                                  all: 'unset', cursor: 'pointer',
                                  width: 22, height: 22, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: `1.5px solid ${color}35`, color, fontSize: '14px', lineHeight: 1,
                                  transition: 'all 0.15s',
                                  '&:hover': { background: bg, borderColor: color, boxShadow: `0 0 0 3px ${color}12` },
                                  '&:active': { transform: 'scale(0.9)' },
                                }}>−</Box>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '2px', minWidth: '36px', justifyContent: 'center' }}>
                                  <Box component="input" type="number" min={1} max={999}
                                    sx={{
                                      width: '28px', background: 'transparent', border: 'none', outline: 'none', p: 0,
                                      fontSize: '14px', fontWeight: 800, color, fontFamily: 'var(--font-mono)', textAlign: 'center',
                                      'MozAppearance': 'textfield',
                                      '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' },
                                    }}
                                    value={hours}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const v = parseInt(e.target.value)
                                      if (!isNaN(v) && v > 0) setSla(prev => ({ ...prev, [key]: v }))
                                    }}
                                  />
                                  <Box sx={{ fontSize: '10px', fontWeight: 600, color, opacity: 0.4, fontFamily: 'var(--font-mono)' }}>h</Box>
                                </Box>
                                <Box component="button" type="button" onClick={inc} sx={{
                                  all: 'unset', cursor: 'pointer',
                                  width: 22, height: 22, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: `1.5px solid ${color}35`, color, fontSize: '14px', lineHeight: 1,
                                  transition: 'all 0.15s',
                                  '&:hover': { background: bg, borderColor: color, boxShadow: `0 0 0 3px ${color}12` },
                                  '&:active': { transform: 'scale(0.9)' },
                                }}>+</Box>
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>

                      <Box sx={{ px: '16px', py: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <InfoOutlined sx={{ fontSize: 13, color: 'var(--muted2)' }} />
                          <Box sx={{
                            fontSize: '11px', fontWeight: 700,
                            color: 'var(--muted2)',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.04em',
                          }}>
                            S'applique uniquement aux nouveaux tickets
                          </Box>
                        </Box>
                        <Button variant="contained" size="small" onClick={handleSaveSla} disabled={savingSla || slaUnchanged} sx={{ minWidth: '110px' }}>
                          {savingSla ? 'Sauvegarde…' : 'Sauvegarder'}
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>

              </Box>
            </Box>
          )}

        </Box>
      </Box>

      {/* ════ MODAL INVITATION ════ */}
      <AppModal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Inviter un membre"
        actions={
          <>
            <Button variant="outlined" size="small" className="btn-cancel" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button variant="contained" size="small" type="submit" form="invite-form" disabled={submitting || !inv.email.trim()}>
              {submitting ? 'Envoi…' : "Envoyer l'invitation"}
            </Button>
          </>
        }>
        <Box component="form" id="invite-form" onSubmit={handleInvite} sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Bannière ── */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '14px',
            p: '16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(99,102,241,0.03) 100%)',
            border: '1px solid var(--accent-border)',
          }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '11px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(99,102,241,0.30)',
            }}>
              <EmailOutlined sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            <Box>
              <Box sx={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', mb: '3px' }}>
                Invitation par email
              </Box>
              <Box sx={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: 1.55 }}>
                Un lien d'activation sera envoyé.<br />Le membre définira son mot de passe à l'inscription.
              </Box>
            </Box>
          </Box>

          {/* ── Champs ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Box>
              <Box component="label" sx={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: '7px' }}>
                Adresse e-mail <Box component="span" sx={{ color: 'var(--red)' }}>*</Box>
              </Box>
              <Box component="input" type="email" sx={{ ...inp, py: '9px', px: '12px', fontSize: '13px' }}
                value={inv.email} placeholder="prenom.nom@exemple.com"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, email: e.target.value }))} />
            </Box>

            <Box>
              <Box component="label" sx={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: '7px' }}>
                Rôle
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Box component="select" sx={{
                  appearance: 'none', WebkitAppearance: 'none',
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: '6px',
                  px: '12px', py: '9px', pr: '36px',
                  fontSize: '13px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  '&:focus': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
                }} value={inv.role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInv(f => ({ ...f, role: e.target.value as UserRole }))}>
                  <option value="Admin">Administrateur</option>
                  <option value="Developer">Développeur</option>
                </Box>
                <KeyboardArrowDownOutlined sx={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, color: 'var(--muted)', pointerEvents: 'none',
                }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </AppModal>
    </>
  )
}
