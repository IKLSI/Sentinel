import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import { acceptInvitation } from '../../users/api/users'
import { useToast } from '../../../hooks/useToast'

const STEPS = [
  {
    num: '1',
    title: 'Complétez votre profil',
    desc: 'Saisissez votre prénom, nom et un mot de passe.',
  },
  {
    num: '2',
    title: "Accédez à l'espace de travail",
    desc: 'Tickets, suivi du temps et projets techniques.',
  },
  {
    num: '3',
    title: 'Collaborez avec votre équipe',
    desc: 'Commentez, assignez et suivez vos demandes.',
  },
]

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const firstNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [token, navigate])

  useEffect(() => {
    if (mounted) setTimeout(() => firstNameRef.current?.focus(), 700)
  }, [mounted])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim()) { showToast('Le prénom est requis', 'warning'); return }
    if (form.password.length < 8) { showToast('Le mot de passe doit contenir au moins 8 caractères', 'warning'); return }
    if (form.password !== form.confirm) { showToast('Les mots de passe ne correspondent pas', 'warning'); return }
    setLoading(true)
    try {
      await acceptInvitation({ token, firstName: form.firstName, lastName: form.lastName, password: form.password })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 3500)
    } catch {
      showToast('Invitation invalide ou expirée', 'error')
    } finally {
      setLoading(false)
    }
  }

  const isValid = form.firstName.trim() && form.password && form.confirm

  return (
    <Box className="aip-root">
      <Box className="aip-card">

        {/* ── Panel gauche ── */}
        <Box className="aip-left">
          <Box className="aip-noise" aria-hidden />

          <Box className="aip-decor" aria-hidden>
            <svg width="100%" height="100%" viewBox="0 0 450 600" fill="none" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="aip-glow-tr" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(165,180,252,0.2)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="450" cy="0" r="160" fill="url(#aip-glow-tr)" />
              <circle cx="450" cy="0" r="80"  stroke="rgba(255,255,255,0.30)" strokeWidth="1.2" />
              <circle cx="450" cy="0" r="125" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <circle cx="450" cy="0" r="175" stroke="rgba(255,255,255,0.11)" strokeWidth="1" />
            </svg>
          </Box>

          <Box className="aip-logo">
            <Box className="aip-logo-mark">
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 4.5V9C16 12.5 12.8 15.7 9 17C5.2 15.7 2 12.5 2 9V4.5L9 1Z" fill="white" fillOpacity="0.95" />
              </svg>
            </Box>
            <Box className="aip-logo-text">SENTINEL</Box>
          </Box>

          <Box className="aip-body">
            <Box className="aip-headline">
              <Box component="h1">
                Rejoignez<br />
                <Box component="span" className="aip-headline-accent">votre équipe.</Box>
              </Box>
              <Box component="p" className="aip-headline-sub">
                Créez votre compte en quelques secondes.
              </Box>
            </Box>

            <Box className="aip-steps">
              {STEPS.map((s, i) => (
                <Box key={i} className="aip-step" style={{ animationDelay: `${0.52 + i * 0.1}s` }}>
                  <Box className="aip-step-num">{s.num}</Box>
                  <Box>
                    <Box className="aip-step-title">{s.title}</Box>
                    <Box className="aip-step-desc">{s.desc}</Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── Panel droit ── */}
        <Box className="aip-right">
          <Box className="aip-form-wrap">
            {done ? (
              <Box className="aip-success">
                <Box className="aip-success-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M6 14l6 6 10-10" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">Compte créé !</Box>
                <Box component="p" className="aip-success-sub">
                  Bienvenue sur Sentinel.<br />Redirection vers la connexion…
                </Box>
              </Box>
            ) : (
              <>
                <Box className="aip-form-header">
                  <Box component="h2" className="aip-form-title">Créez votre compte</Box>
                  <Box component="p" className="aip-form-sub">Complétez votre profil pour accéder à l'espace de travail</Box>
                </Box>

                <form onSubmit={handleSubmit} noValidate>
                  <Box className="lp-field aip-row">
                    <Box>
                      <Box component="label" className="lp-label" htmlFor="aip-firstname">Prénom <span style={{ color: '#ef4444' }}>*</span></Box>
                      <input
                        id="aip-firstname"
                        ref={firstNameRef}
                        type="text"
                        className="lp-input"
                        value={form.firstName}
                        onChange={set('firstName')}
                        placeholder="Votre prénom"
                        autoComplete="given-name"
                        required
                      />
                    </Box>
                    <Box>
                      <Box component="label" className="lp-label" htmlFor="aip-lastname">Nom</Box>
                      <input
                        id="aip-lastname"
                        type="text"
                        className="lp-input"
                        value={form.lastName}
                        onChange={set('lastName')}
                        placeholder="Votre nom"
                        autoComplete="family-name"
                      />
                    </Box>
                  </Box>

                  <Box className="lp-field">
                    <Box component="label" className="lp-label" htmlFor="aip-password">Mot de passe <span style={{ color: '#ef4444' }}>*</span></Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="aip-password"
                        type={showPassword ? 'text' : 'password'}
                        className="lp-input"
                        value={form.password}
                        onChange={set('password')}
                        placeholder="Min. 8 caractères"
                        autoComplete="new-password"
                        sx={{ paddingRight: '44px' }}
                        required
                      />
                      <button
                        type="button"
                        className="lp-pw-toggle"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword
                          ? <VisibilityOffOutlined sx={{ fontSize: 16 }} />
                          : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                      </button>
                    </Box>
                  </Box>

                  <Box className="lp-field">
                    <Box component="label" className="lp-label" htmlFor="aip-confirm">Confirmation <span style={{ color: '#ef4444' }}>*</span></Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="aip-confirm"
                        type={showPassword ? 'text' : 'password'}
                        className="lp-input"
                        value={form.confirm}
                        onChange={set('confirm')}
                        placeholder="Répétez le mot de passe"
                        autoComplete="new-password"
                        required
                      />
                    </Box>
                  </Box>

                  <button type="submit" className="lp-submit" disabled={loading || !isValid}>
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      <>
                        Créer mon compte
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
