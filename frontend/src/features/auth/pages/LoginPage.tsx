import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { useTheme } from '../../../store/ThemeContext'
import Box from '@mui/material/Box'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'

const GRID_DOTS = Array.from({ length: 20 * 16 })

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const { showToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (mounted) setTimeout(() => emailRef.current?.focus(), 400)
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      showToast('Veuillez remplir tous les champs', 'warning')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      showToast('Identifiants incorrects', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
      <Box className="lp-root d-flex" sx={{ background: 'var(--bg)', fontFamily: 'var(--font-ui)' }}>
        <Box className="lp-left d-flex flex-column position-relative overflow-hidden" sx={{ padding: '48px 52px' }}>
          <Box className="lp-grid" aria-hidden>
            {GRID_DOTS.map((_, i) => <Box key={i} className="lp-dot" />)}
          </Box>
          <Box className="lp-scanline" aria-hidden />
          <Box className="lp-glow" aria-hidden />

          <Box className="d-flex flex-column h-100 position-relative" sx={{ zIndex: 2 }}>
            <Box className="lp-logo d-flex align-items-center gap-3 mb-5">
              <Box className="lp-logo-mark d-flex align-items-center justify-content-center flex-shrink-0">T</Box>
              <Box sx={{ fontFamily: 'var(--font-ui)', fontSize: '20px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em' }}>
                TMA<Box component="span" sx={{ color: 'var(--accent)' }}>flow</Box>
              </Box>
            </Box>

            <Box className="lp-headline mb-5">
              <Box component="h1">Votre TMA,<br /><Box component="em">sans friction</Box></Box>
              <Box component="p">Tickets, SLA, time tracking et santé technique — une plateforme pour les équipes de maintenance applicative.</Box>
            </Box>

            <Box className="lp-features d-flex flex-column gap-2 mt-auto">
              {[
                { label: 'Alertes SLA en temps réel', color: 'var(--accent)', tag: 'SLA', tagBg: 'var(--accent-subtle)', tagColor: 'var(--accent)' },
                { label: 'Kanban & suivi de tickets', color: 'var(--cyan)', tag: 'TICKETS', tagBg: 'var(--cyan-subtle)', tagColor: 'var(--cyan)' },
                { label: 'Veille CVE automatique', color: 'var(--green)', tag: 'SÉCURITÉ', tagBg: 'var(--green-subtle)', tagColor: 'var(--green)' },
                { label: 'Facturation & time tracking', color: 'var(--yellow)', tag: 'BILLING', tagBg: 'var(--yellow-subtle)', tagColor: 'var(--yellow)' },
              ].map((f) => (
                <Box key={f.label} className="lp-feature d-flex align-items-center gap-3" sx={{ padding: '11px 14px', borderRadius: '8px' }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: f.color, boxShadow: `0 0 6px ${f.color}`, flexShrink: 0 }} />
                  <Box component="span" sx={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--muted2)', flex: 1 }}>{f.label}</Box>
                  <Box component="span" sx={{ fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '2px 7px', borderRadius: '20px', fontWeight: 500, letterSpacing: '0.05em', background: f.tagBg, color: f.tagColor }}>
                    {f.tag}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box className="flex-grow-1 d-flex align-items-center justify-content-center position-relative" sx={{ padding: '40px', background: 'var(--bg)', transition: 'background 0.25s' }}>
          <Box className="lp-right-bg" aria-hidden />

          <button
            className="lp-theme-toggle d-flex align-items-center justify-content-center"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <LightModeOutlined sx={{ fontSize: 15 }} /> : <DarkModeOutlined sx={{ fontSize: 15 }} />}
          </button>

          <Box className="lp-form-wrap">
            <Box className="mb-5">
              <Box className="lp-form-eyebrow mb-2">Espace de travail</Box>
              <Box component="h2" sx={{ fontFamily: 'var(--font-ui)', fontSize: '30px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em', m: '0 0 6px' }}>Connexion</Box>
              <Box component="p" sx={{ fontSize: '13px', color: 'var(--muted)', m: 0 }}>Accédez à votre tableau de bord</Box>
            </Box>

            <form onSubmit={handleSubmit} noValidate>
              <Box className="mb-3">
                <Box component="label" className="d-block mb-2" sx={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }} htmlFor="lp-email">
                  Adresse email
                </Box>
                <input
                  id="lp-email"
                  ref={emailRef}
                  type="email"
                  className="lp-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.com"
                  autoComplete="email"
                  required
                />
              </Box>

              <Box className="mb-3">
                <Box component="label" className="d-block mb-2" sx={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }} htmlFor="lp-password">
                  Mot de passe
                </Box>
                <Box className="position-relative">
                  <Box
                    component="input"
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    sx={{ paddingRight: '44px' }}
                    required
                  />
                  <button
                    type="button"
                    className="lp-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <VisibilityOffOutlined sx={{ fontSize: 16 }} /> : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                  </button>
                </Box>
              </Box>

              <button type="submit" className="lp-submit d-flex align-items-center justify-content-center gap-2 mt-4" disabled={loading}>
                {loading ? (
                  <Box className="lp-submit-loader" />
                ) : (
                  <>
                    Se connecter
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <Box className="my-4" sx={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--border2), transparent)' }} />

            <Box className="text-center" sx={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.08em', opacity: 0.6 }}>
              TMAflow &nbsp;·&nbsp; v2.0 &nbsp;·&nbsp; Plateforme TMA
            </Box>
          </Box>
        </Box>
      </Box>
  )
}
