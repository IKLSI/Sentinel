import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import { resetPassword } from '../api/auth'
import { useToast } from '../../../hooks/useToast'
import { SentinelLogo } from '../../../layouts/SentinelLogo'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [token, navigate])

  useEffect(() => {
    if (mounted) setTimeout(() => passwordRef.current?.focus(), 700)
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { showToast('Le mot de passe doit contenir au moins 8 caractères.', 'warning'); return }
    if (password !== confirm) { showToast('Les mots de passe ne correspondent pas.', 'warning'); return }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 3500)
    } catch {
      showToast('Le lien de réinitialisation est invalide ou expiré.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="lp-root">
      <Box className="lp-card">

        {/* ── Panel gauche ── */}
        <Box className="lp-left">
          <Box className="lp-left-noise" aria-hidden />

          <Box className="lp-decor" aria-hidden>
            <svg width="100%" height="100%" viewBox="0 0 450 600" fill="none" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="lp-glow-tr" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(165,180,252,0.2)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="450" cy="0" r="160" fill="url(#lp-glow-tr)" />
              <circle cx="450" cy="0" r="80"  stroke="rgba(255,255,255,0.30)" strokeWidth="1.2" />
              <circle cx="450" cy="0" r="125" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <circle cx="450" cy="0" r="175" stroke="rgba(255,255,255,0.11)" strokeWidth="1" />
            </svg>
          </Box>

          <Box className="lp-logo">
            <Box className="lp-logo-mark">
              <SentinelLogo width={20} height={23} />
            </Box>
            <Box className="lp-logo-wordmark">SENTINEL</Box>
          </Box>

          <Box className="lp-left-body">
            <Box className="lp-left-headline">
              <Box component="h1">
                Nouveau<br />
                <Box component="span" className="lp-headline-accent">mot de passe.</Box>
              </Box>
              <Box component="p" className="lp-headline-sub">
                Définissez votre nouveau mot de passe.
              </Box>
            </Box>

            <Box className="lp-features">
              {[
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  ),
                  title: 'Minimum 8 caractères',
                  desc: 'Combinez lettres, chiffres et symboles.',
                  iconBg: 'rgba(165,180,252,0.11)',
                  iconColor: 'rgba(165,180,252,0.9)',
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1.5L12.5 4v4c0 2.8-2.5 5.2-5.5 6C3.5 13.2 1 10.8 1 8V4L7 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: 'Sessions invalidées',
                  desc: 'Toutes vos sessions actives seront déconnectées.',
                  iconBg: 'rgba(251,191,36,0.11)',
                  iconColor: 'rgba(251,191,36,0.85)',
                },
              ].map((f, i) => (
                <Box key={i} className="lp-feature" style={{ animationDelay: `${0.52 + i * 0.1}s` }}>
                  <Box className="lp-feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>
                    {f.icon}
                  </Box>
                  <Box>
                    <Box className="lp-feature-title">{f.title}</Box>
                    <Box className="lp-feature-desc">{f.desc}</Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── Panel droit ── */}
        <Box className="lp-right">
          <Box className="lp-form-wrap">
            {done ? (
              <Box className="aip-success">
                <Box className="aip-success-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M6 14l6 6 10-10" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">Mot de passe mis à jour !</Box>
                <Box component="p" className="aip-success-sub">
                  Votre mot de passe a été réinitialisé.<br />Redirection vers la connexion…
                </Box>
              </Box>
            ) : (
              <>
                <Box className="lp-form-header">
                  <Box component="h2" className="lp-form-title">Nouveau mot de passe</Box>
                  <Box component="p" className="lp-form-sub">Choisissez un mot de passe sécurisé</Box>
                </Box>

                <form onSubmit={handleSubmit} noValidate>
                  <Box className="lp-field">
                    <Box component="label" className="lp-label" htmlFor="rp-password">
                      Nouveau mot de passe
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="rp-password"
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        className="lp-input"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                    <Box component="label" className="lp-label" htmlFor="rp-confirm">
                      Confirmation
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="rp-confirm"
                        type={showPassword ? 'text' : 'password'}
                        className="lp-input"
                        value={confirm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                        placeholder="Répétez le mot de passe"
                        autoComplete="new-password"
                        required
                      />
                    </Box>
                  </Box>

                  <button type="submit" className="lp-submit" disabled={loading || !password || !confirm}>
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      "Réinitialiser le mot de passe"
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
