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
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur', manager: 'Manager',
  technician: 'Technicien', developer: 'Développeur',
}
const ROLE_VARIANTS: Record<string, 'red' | 'orange' | 'blue'> = {
  admin: 'red', manager: 'orange', technician: 'blue', developer: 'blue',
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

  const role = user?.role?.toLowerCase() ?? ''
  const isAdmin = role === 'admin'
  const isAdminOrManager = role === 'admin' || role === 'manager'
  const [pf, setPf] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' })
  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inv, setInv] = useState({ firstName: '', lastName: '', email: '', role: 'technician' as UserRole, password: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try { setMembers((await getUsers()).items) }
    catch { showToast('Impossible de charger les membres', 'error') }
    finally { setLoadingMembers(false) }
  }, [showToast])

  useEffect(() => {
    if (isAdminOrManager) loadMembers()
    else setLoadingMembers(false)
  }, [isAdminOrManager, loadMembers])

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
      list = list.filter(m => m.role?.toLowerCase() === memberRoleFilter)
    return list
  }, [members, memberSearch, memberRoleFilter])

  const handleSave = async () => {
    const unchanged = pf.firstName === user?.firstName && pf.lastName === user?.lastName
    if (unchanged) return
    if (!pf.firstName.trim() || !pf.lastName.trim()) { showToast('Prénom et nom requis', 'warning'); return }
    try {
      const updated = await updateMyProfile(pf)
      setUser({ ...user!, ...updated })
      showToast('Profil enregistré', 'success')
    } catch { showToast('Erreur lors de la sauvegarde', 'error') }
  }

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    toggleTheme()
    updatePreferences({ theme: next }).then(() => setUser({ ...user!, theme: next })).catch(() => {})
  }

  const handleToggleActive = async (m: User) => {
    setTogglingId(m.id)
    try {
      const updated = await toggleUserActive(m.id, !m.isActive)
      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, isActive: updated.isActive } : x))
    } catch { showToast('Erreur lors de la mise à jour', 'error') }
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
      setInv({ firstName: '', lastName: '', email: '', role: 'technician', password: '' })
      loadMembers()
    } catch { showToast("Erreur lors de l'invitation", 'error') }
    finally { setSubmitting(false) }
  }

  return (
    <>


      <Box className="page-enter" sx={{
        p: '36px 28px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* ════ PROFIL CARD ════ */}
        <Box sx={{ ...CARD_SX, mb: '16px', flexShrink: 0 }}>
          {/* Form */}
          <div>
            <InnerDivider label="Informations" />
            <Box sx={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              px: '16px', py: '9px',
              borderBottom: '1px solid var(--border)',
            }}>
              <Box>
                <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Prénom</Box>
                <Box component="input" type="text" placeholder="Prénom"
                  value={pf.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPf(f => ({ ...f, firstName: e.target.value }))}
                  onBlur={handleSave}
                  sx={inp} />
              </Box>
              <Box>
                <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Nom</Box>
                <Box component="input" type="text" placeholder="Nom"
                  value={pf.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPf(f => ({ ...f, lastName: e.target.value }))}
                  onBlur={handleSave}
                  sx={inp} />
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
                <Box component="input" type="text" sx={inpRo} value={ROLE_LABELS[role] ?? role} readOnly />
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
                      onClick={() => { if (theme !== t) handleToggleTheme() }}
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
            </Box>

          </div>
        </Box>

        {/* ════ TOOLBAR MEMBRES ════ */}
        {isAdminOrManager && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '16px', flexShrink: 0 }}>
            <Box sx={{
              flex: '0 0 260px', display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--s1)', border: '1px solid var(--border)',
              borderRadius: '9px', px: '10px', height: '32px',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              '&:focus-within': { borderColor: 'var(--accent-border)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
            }}>
              <SearchOutlined sx={{ color: 'var(--muted)', fontSize: '14px', flexShrink: 0 }} />
              <Box
                component="input"
                placeholder="Rechercher..."
                value={memberSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)}
                sx={{
                  all: 'unset', flex: 1, fontSize: '12.5px', color: 'var(--text)',
                  '&::placeholder': { color: 'var(--muted)' },
                }}
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
                <option value="admin">Administrateur</option>
                <option value="manager">Manager</option>
                <option value="developer">Développeur</option>
                <option value="technician">Technicien</option>
              </Box>
              <KeyboardArrowDownOutlined sx={{ fontSize: 14, color: 'var(--muted)', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </Box>

            <Box sx={{ flex: 1 }} />

            {isAdmin && (
              <Button variant="contained" size="small" onClick={() => setInviteOpen(true)} sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <PersonAddOutlined sx={{ fontSize: 14 }} />
                Ajouter un membre
              </Button>
            )}
          </Box>
        )}

        {/* ════ MEMBRES TABLE CARD ════ */}
        {isAdminOrManager && (
          <Box sx={{
            background: 'var(--s1)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', overflow: 'hidden',
            flex: 1, display: 'flex', flexDirection: 'column',
          }}>
            {loadingMembers ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={22} />
              </Box>
            ) : members.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box className="empty-state">
                  <Box className="empty-state-title">Aucun membre</Box>
                  <Box className="empty-state-subtitle">Ajoutez vos premiers collaborateurs.</Box>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead" sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <Box component="tr">
                        {['Membre', 'Rôle', 'Statut', 'Dernière connexion', 'Ajouté le', ''].map((h) => (
                          <Box component="th" key={h} sx={{
                            fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500,
                            textAlign: 'left', padding: '10px 14px',
                            borderBottom: '1px solid var(--border)', background: 'var(--s2)',
                            whiteSpace: 'nowrap', userSelect: 'none',
                          }}>{h}</Box>
                        ))}
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {filteredMembers.length === 0 ? (
                        <Box component="tr">
                          <Box component="td" colSpan={6} sx={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                            Aucun résultat pour « {memberSearch} »
                          </Box>
                        </Box>
                      ) : filteredMembers.map((m) => {
                        const mRole = m.role?.toLowerCase() ?? ''
                        const isMe = m.id === user?.id
                        const isToggling = togglingId === m.id
                        return (
                          <Box component="tr" key={m.id} sx={{
                            opacity: !m.isActive ? 0.5 : 1,
                            background: isMe ? 'color-mix(in srgb, var(--accent-subtle) 30%, transparent)' : 'transparent',
                            transition: 'background 0.1s, opacity 0.15s',
                            '&:hover': { background: isMe ? 'color-mix(in srgb, var(--accent-subtle) 50%, transparent)' : 'var(--s2)' },
                            '& td': { borderBottom: '1px solid var(--border)' },
                          }}>
                            <Box component="td" sx={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Box sx={{
                                  width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
                                  background: isMe ? 'linear-gradient(135deg, var(--accent), #818cf8)' : `hsl(${(m.firstName.charCodeAt(0) * 53 + m.lastName.charCodeAt(0) * 29) % 360}, 45%, 38%)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)',
                                }}>
                                  {m.firstName[0]}{m.lastName[0]}
                                </Box>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Box sx={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{m.firstName} {m.lastName}</Box>
                                    {isMe && <Box sx={{ fontSize: '8px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', px: '3px', borderRadius: '3px' }}>vous</Box>}
                                  </Box>
                                  <Box sx={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{m.email}</Box>
                                </Box>
                              </Box>
                            </Box>
                            <Box component="td" sx={{ padding: '10px 14px' }}>
                              <StatusChip variant={ROLE_VARIANTS[mRole] ?? 'blue'}>{ROLE_LABELS[mRole] ?? m.role}</StatusChip>
                            </Box>
                            <Box component="td" sx={{ padding: '10px 14px' }}>
                              <StatusChip variant={m.isActive ? 'green' : 'gray'}>{m.isActive ? 'Actif' : 'Inactif'}</StatusChip>
                            </Box>
                            <Box component="td" sx={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
                              {m.lastLoginAt ? formatDistanceToNow(new Date(m.lastLoginAt), { locale: fr, addSuffix: true }) : '—'}
                            </Box>
                            <Box component="td" sx={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted2)' }}>
                              {format(new Date(m.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </Box>
                            <Box component="td" sx={{ padding: '6px 10px', textAlign: 'right' }}>
                              {isAdmin && !isMe && (
                                <Box component="button" onClick={() => handleToggleActive(m)} disabled={isToggling} title={m.isActive ? 'Désactiver' : 'Réactiver'} sx={{
                                  all: 'unset', cursor: isToggling ? 'default' : 'pointer',
                                  width: 28, height: 28, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--muted)', transition: 'background 0.12s, color 0.12s',
                                  '&:hover': {
                                    background: m.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                    color: m.isActive ? 'var(--red)' : 'var(--green)',
                                  },
                                }}>
                                  {isToggling ? <CircularProgress size={11} /> : m.isActive ? <BlockOutlined sx={{ fontSize: 14 }} /> : <CheckCircleOutlineOutlined sx={{ fontSize: 14 }} />}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                </Box>

                {/* Footer */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: '16px', py: '10px',
                  borderTop: '1px solid var(--border)',
                  flexShrink: 0, background: 'var(--s2)',
                }}>
                  <Box sx={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                    {filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''}
                    {filteredMembers.length !== members.length && ` sur ${members.length}`}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Modal invitation */}
      <AppModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Ajouter un membre"
        actions={
          <>
            <Button variant="outlined" size="small" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button variant="contained" size="small" onClick={handleInvite} disabled={submitting}>
              {submitting ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : 'Ajouter'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', mb: '12px' }}>
            <Box>
              <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Prénom *</Box>
              <Box component="input" type="text" sx={inp} value={inv.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, firstName: e.target.value }))} />
            </Box>
            <Box>
              <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Nom</Box>
              <Box component="input" type="text" sx={inp} value={inv.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, lastName: e.target.value }))} />
            </Box>
          </Box>
          <Box sx={{ mb: '12px' }}>
            <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>E-mail *</Box>
            <Box component="input" type="email" sx={inp} value={inv.email} placeholder="prenom.nom@exemple.com"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInv(f => ({ ...f, email: e.target.value }))} />
          </Box>
          <Box sx={{ mb: '12px' }}>
            <Box component="label" sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', mb: '4px' }}>Rôle</Box>
            <Box component="select" sx={inp} value={inv.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInv(f => ({ ...f, role: e.target.value as UserRole }))}>
              <option value="admin">Administrateur</option>
              <option value="manager">Manager</option>
              <option value="developer">Développeur</option>
              <option value="technician">Technicien</option>
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
        </form>
      </AppModal>
    </>
  )
}
