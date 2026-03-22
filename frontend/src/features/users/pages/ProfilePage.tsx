import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTheme } from '../../../store/ThemeContext'
import { useToast } from '../../../hooks/useToast'
import { updateMyProfile, updatePreferences } from '../api/users'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrateur', Developer: 'Développeur',
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

  const [pf, setPf] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' })
  const [savingPf, setSavingPf] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(user?.emailNotifications ?? true)
  const [savingNotifs, setSavingNotifs] = useState(false)

  const pfUnchanged = pf.firstName === user?.firstName && pf.lastName === user?.lastName

  const handleSave = async () => {
    if (pfUnchanged) return
    if (!pf.firstName.trim() || !pf.lastName.trim()) { showToast('Prénom et nom requis', 'warning'); return }
    setSavingPf(true)
    try {
      const updated = await updateMyProfile(pf)
      setUser({ ...user!, ...updated })
      showToast('Profil mis à jour', 'success')
    } catch { showToast('Erreur lors de la mise à jour', 'error') }
    finally { setSavingPf(false) }
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

  return (
    <Box className="page-enter" sx={{ p: '36px 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100vh', overflow: 'hidden' }}>

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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPf(f => ({ ...f, firstName: e.target.value }))} />
          </Box>
          <Box>
            <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', mb: '5px' }}>Nom</Box>
            <Box component="input" type="text" sx={inp} value={pf.lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPf(f => ({ ...f, lastName: e.target.value }))} />
          </Box>
        </Box>

        <Box sx={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
          px: '16px', py: '9px',
          pb: '16px',
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

        <Box sx={{ px: '16px', py: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="small" onClick={handleSave} disabled={savingPf || pfUnchanged} sx={{ minWidth: '110px' }}>
            {savingPf ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </Box>

      </Box>
    </Box>
  )
}
