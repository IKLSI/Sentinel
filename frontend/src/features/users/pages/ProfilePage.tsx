import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { AppModal } from '../../../components/AppModal'
import { StatusChip } from '../../../components/StatusChip'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTheme } from '../../../store/ThemeContext'
import { useToast } from '../../../hooks/useToast'
import { updateMyProfile, updatePreferences, inviteUser, getUsers, toggleUserActive } from '../api/users'
import { User, UserRole } from '../../../types'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import BlockOutlined from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined'
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrateur', Developer: 'Développeur',
}
const ROLE_VARIANTS: Record<string, 'red' | 'orange' | 'blue'> = {
  Admin: 'red', Developer: 'blue',
}

const inp = {
  width: '100%', display: 'block', boxSizing: 'border-box',
  background: 'var(--s2)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '6px 10px',
  fontSize: '12px', color: 'var(--text)', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
} as const

const inpRo = { ...inp, color: 'var(--muted2)', cursor: 'default' } as const

const CARD_SX = {
  background: 'var(--s1)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
} as const

function Toggle({ on, onChange, busy }: { on: boolean; onChange: () => void; busy?: boolean }) {
  return busy ? <CircularProgress size={13} /> : (
    <Box component="button" onClick={onChange} sx={{
      all: 'unset', cursor: 'pointer', width: 32, height: 18, borderRadius: 9, flexShrink: 0,
      background: on ? 'var(--accent)' : 'var(--border2)',
      position: 'relative', transition: 'background 0.18s',
      boxShadow: on ? '0 0 6px rgba(99,102,241,0.4)' : 'none',
    }}>
      <Box sx={{
        position: 'absolute', top: 2,
        left: on ? 'calc(100% - 15px)' : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left 0.16s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </Box>
  )
}

/* ── Séparateur interne ── */
function InnerDivider({ label }: { label: string }) {
  return (
    <Box sx={{
      px: '16px', minHeight: '44px',
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--s2)',
    }}>
      <Box sx={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </Box>
    </Box>
  )
}

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()

  const isAdmin = user?.role === 'Admin'
  const [pf, setPf] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' })
  const [emailNotifs, setEmailNotifs] = useState(user?.emailNotifications ?? true)
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inv, setInv] = useState({ firstName: '', lastName: '', email: '', role: 'Developer' as UserRole, password: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try { setMembers((await getUsers()).items) }
    catch { showToast('Impossible de charger les membres', 'error') }
    finally { setLoadingMembers(false) }
  }, [showToast])

  useEffect(() => {
    if (isAdmin) loadMembers()
    else setLoadingMembers(false)
  }, [isAdmin, loadMembers])

  const filteredMembers = useMemo(() => {
    let list = members
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase()
      list = list.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      )
    }
    if (memberRoleFilter !== 'all')
      list = list.filter(m => m.role === memberRoleFilter)
    return list
  }, [members, memberSearch, memberRoleFilter])

  const handleSave = async () => {
    const unchanged = pf.firstName === user?.firstName && pf.lastName === user?.lastName
    if (unchanged) return
    if (!pf.firstName.trim() || !pf.lastName.trim()) { showToast('Prénom et nom requis', 'warning'); return }
    try {
      const updated = await updateMyProfile(pf)
      setUser({ ...user!, ...updated })
      showToast('Profil mis à jour', 'success')
    } catch { showToast('Erreur lors de la mise à jour', 'error') }
  }

  const handleThemeToggle = (t: 'dark' | 'light') => {
    if (theme === t) return
    toggleTheme()
    updatePreferences({ theme: t }).catch(() => {})
  }

  const handleToggleNotifs = async () => {
    const next = !emailNotifs
    setEmailNotifs(next)
    setSavingNotifs(true)
    try {
      await updatePreferences({ emailNotifications: next })
      setUser({ ...user!, emailNotifications: next })
    } catch {
      setEmailNotifs(!next)
      showToast('Erreur lors de la mise à jour', 'error')
    } finally { setSavingNotifs(false) }
  }

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
    if (!inv.email || !inv.firstName || !inv.password) { showToast('Champs obligatoires manquants', 'warning'); return }
    setSubmitting(true)
    try {
      await inviteUser(inv)
      showToast('Membre ajouté', 'success')
      setInviteOpen(false)
      setInv({ firstName: '', lastName: '', email: '', role: 'Developer', password: '' })
      loadMembers()
    } catch { showToast("Erreur lors de l'invitation", 'error') }
    finally { setSubmitting(false) }
  }

  return (
    <>

      <Box className="page-enter" sx={{ p: '36px 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

        {/* ════ PROFIL CARD ════ */}
        <Box sx={CARD_SX}>
          <InnerDivider label="Informations" />

          <Box sx={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            px: '16px', py: '9px',
            borderBottom: '1px solid var(--border)',
          }}>
            <Box>
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Prénom</Box>
              <Box component="input" type="text" sx={inp} value={pf.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPf(f => ({ ...f, firstName: e.target.value }))}
                onBlur={handleSave} />
            </Box>
            <Box>
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Nom</Box>
              <Box component="input" type="text" sx={inp} value={pf.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPf(f => ({ ...f, lastName: e.target.value }))}
                onBlur={handleSave} />
            </Box>
          </Box>

          <Box sx={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            px: '16px', py: '9px',
            borderBottom: '1px solid var(--border)',
          }}>
            <Box>
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>E-mail</Box>
              <Box component="input" type="email" sx={inpRo} value={user?.email ?? ''} readOnly />
            </Box>
            <Box>
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Rôle</Box>
              <Box component="input" type="text" sx={inpRo} value={ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? ''} readOnly />
            </Box>
          </Box>

          <InnerDivider label="Préférences" />

          <Box sx={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            px: '16px', py: '9px',
            borderBottom: '1px solid var(--border)',
          }}>
            <Box>
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Apparence</Box>
              <Box sx={{ display: 'flex', gap: '8px' }}>
                {(['dark', 'light'] as const).map((t) => (
                  <Box
                    key={t}
                    component="button"
                    type="button"
                    onClick={() => handleThemeToggle(t)}
                    sx={{
                      all: 'unset', cursor: 'pointer', width: 80, borderRadius: '7px', overflow: 'hidden',
                      border: theme === t ? '2px solid var(--accent)' : '2px solid var(--border)',
                      boxShadow: theme === t ? '0 0 0 2px var(--accent-subtle)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Box sx={{
                      height: 36,
                      background: t === 'dark'
                        ? 'linear-gradient(150deg,#0d1120 55%,#1a2340 100%)'
                        : 'linear-gradient(150deg,#ffffff 55%,#f0f2f8 100%)',
                      p: '6px 8px', display: 'flex', flexDirection: 'column', gap: '3px',
                    }}>
                      <Box sx={{ height: 3, width: '60%', borderRadius: 2, background: t === 'dark' ? '#263352' : '#dde3f2' }} />
                      <Box sx={{ height: 3, width: '80%', borderRadius: 2, background: t === 'dark' ? '#192036' : '#eaedfa' }} />
                      <Box sx={{ height: 3, width: '40%', borderRadius: 2, background: t === 'dark' ? 'rgba(99,102,241,0.5)' : 'rgba(79,70,229,0.35)' }} />
                    </Box>
                    <Box sx={{
                      px: '8px', py: '4px',
                      background: t === 'dark' ? '#080c14' : '#f0f2f8',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {t === 'dark'
                          ? <DarkModeOutlined sx={{ fontSize: 8, color: 'rgba(230,234,246,0.4)' }} />
                          : <LightModeOutlined sx={{ fontSize: 8, color: 'rgba(14,18,32,0.4)' }} />
                        }
                        <Box sx={{ fontSize: '9px', fontWeight: 600, color: t === 'dark' ? 'rgba(230,234,246,0.55)' : 'rgba(14,18,32,0.45)' }}>
                          {t === 'dark' ? 'Sombre' : 'Clair'}
                        </Box>
                      </Box>
                      {theme === t && (
                        <Box sx={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckOutlined sx={{ fontSize: 7, color: '#fff' }} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Notifications e-mail</Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Toggle on={emailNotifs} onChange={handleToggleNotifs} busy={savingNotifs} />
              </Box>
            </Box>
          </Box>

        </Box>

        {/* ════ TOOLBAR MEMBRES ════ */}
        {isAdmin && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '16px', flexShrink: 0 }}>
            <Box sx={{
              flex: '0 0 260px', display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--s1)', border: '1px solid var(--border)',
              borderRadius: '9px', px: '10px', height: '32px',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              '&:focus-within': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
            }}>
              <SearchOutlined sx={{ fontSize: 14, color: 'var(--muted)', flexShrink: 0 }} />
              <Box
                component="input"
                placeholder="Rechercher un membre..."
                sx={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text)', fontFamily: 'inherit' }}
                value={memberSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)}
              />
            </Box>

            <Box sx={{ position: 'relative' }}>
              <Box
                component="select"
                sx={{ ...inp, height: '32px', py: 0, pr: '28px', pl: '14px', cursor: 'pointer', appearance: 'none', minWidth: '140px', borderRadius: '9px', fontSize: '13px', fontWeight: 500 }}
                value={memberRoleFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMemberRoleFilter(e.target.value)}
              >
                <option value="all">Tous les rôles</option>
                <option value="Admin">Administrateur</option>
                <option value="Developer">Développeur</option>
              </Box>
              <KeyboardArrowDownOutlined sx={{ fontSize: 14, color: 'var(--muted)', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </Box>

            <Box sx={{ flex: 1 }} />

            <Button variant="contained" size="small" onClick={() => setInviteOpen(true)} sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <PersonAddOutlined sx={{ fontSize: 14 }} />
              Ajouter un membre
            </Button>
          </Box>
        )}

        {/* ════ MEMBRES TABLE CARD ════ */}
        {isAdmin && (
          <Box sx={{
            background: 'var(--s1)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', overflow: 'hidden',
            flex: 1, display: 'flex', flexDirection: 'column',
          }}>
            {loadingMembers ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={22} />
              </Box>
            ) : filteredMembers.length === 0 ? (
              <Box className="empty-state">
                <Box className="empty-state-title">Aucun membre trouvé</Box>
              </Box>
            ) : (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <Box component="thead">
                  <Box component="tr" sx={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                    {['Membre', 'Rôle', 'Statut', 'Dernière connexion', ''].map((h) => (
                      <Box component="th" key={h} sx={{ px: '16px', py: '8px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {filteredMembers.map((m) => (
                    <Box component="tr" key={m.id} sx={{ borderBottom: '1px solid var(--border)', '&:last-child': { borderBottom: 'none' }, '&:hover': { background: 'var(--s2)' } }}>
                      <Box component="td" sx={{ px: '16px', py: '10px' }}>
                        <Box sx={{ fontWeight: 600, color: 'var(--text)', mb: '1px' }}>{m.firstName} {m.lastName}</Box>
                        <Box sx={{ color: 'var(--muted2)', fontSize: '11px' }}>{m.email}</Box>
                      </Box>
                      <Box component="td" sx={{ px: '16px', py: '10px' }}>
                        <StatusChip variant={ROLE_VARIANTS[m.role] ?? 'blue'}>{ROLE_LABELS[m.role] ?? m.role}</StatusChip>
                      </Box>
                      <Box component="td" sx={{ px: '16px', py: '10px' }}>
                        <StatusChip variant={m.isActive ? 'blue' : 'orange'}>{m.isActive ? 'Actif' : 'Inactif'}</StatusChip>
                      </Box>
                      <Box component="td" sx={{ px: '16px', py: '10px', color: 'var(--muted2)', fontSize: '11px' }}>
                        {m.lastLoginAt ? formatDistanceToNow(new Date(m.lastLoginAt), { addSuffix: true, locale: fr }) : '—'}
                      </Box>
                      <Box component="td" sx={{ px: '16px', py: '10px', textAlign: 'right' }}>
                        {m.id !== user?.id && (
                          <Button
                            size="small"
                            variant="outlined"
                            color={m.isActive ? 'error' : 'success'}
                            disabled={togglingId === m.id}
                            onClick={() => handleToggleActive(m.id, m.isActive)}
                            startIcon={m.isActive ? <BlockOutlined sx={{ fontSize: 12 }} /> : <CheckCircleOutlineOutlined sx={{ fontSize: 12 }} />}
                            sx={{ textTransform: 'none', fontSize: '11px', py: '3px' }}
                          >
                            {m.isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ════ MODAL INVITATION ════ */}
      <AppModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Ajouter un membre"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button variant="contained" size="small" sx={{ textTransform: 'none' }} type="submit" form="invite-form" disabled={submitting}>
              {submitting ? 'Envoi...' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <Box component="form" id="invite-form" onSubmit={handleInvite} sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Box>
              <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Prénom *</Box>
              <Box component="input" type="text" sx={inp} value={inv.firstName} placeholder="Prénom"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, firstName: e.target.value }))} />
            </Box>
            <Box>
              <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Nom</Box>
              <Box component="input" type="text" sx={inp} value={inv.lastName} placeholder="Nom"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, lastName: e.target.value }))} />
            </Box>
          </Box>
          <Box>
            <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>E-mail *</Box>
            <Box component="input" type="email" sx={inp} value={inv.email} placeholder="prenom.nom@exemple.com"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, email: e.target.value }))} />
          </Box>
          <Box sx={{ mb: '12px' }}>
            <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Rôle</Box>
            <Box component="select" sx={inp} value={inv.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInv(f => ({ ...f, role: e.target.value as UserRole }))}>
              <option value="Admin">Administrateur</option>
              <option value="Developer">Développeur</option>
            </Box>
          </Box>
          <Box>
            <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Mot de passe temporaire *</Box>
            <Box component="input" type="password" sx={inp} value={inv.password} placeholder="Min. 8 caractères"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, password: e.target.value }))} />
            <Box sx={{ fontSize: '10px', color: 'var(--muted)', mt: '4px' }}>
              Le membre pourra le modifier depuis son profil.
            </Box>
          </Box>
        </Box>
      </AppModal>
    </>
  )
}
