import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import { forgotPassword } from '../api/auth'
import { useToast } from '../../../hooks/useToast'
import { SentinelLogo } from '../../../layouts/SentinelLogo'

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (mounted) setTimeout(() => emailRef.current?.focus(), 700)
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { showToast('Veuillez saisir votre adresse email.', 'warning'); return }
    setLoading(true)
    try {
      await forgotPassword(email)
      setDone(true)
    } catch {
      showToast('Une erreur est survenue. Veuillez réessayer.', 'error')
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
                Mot de passe<br />
                <Box component="span" className="lp-headline-accent">oublié ?</Box>
              </Box>
              <Box component="p" className="lp-headline-sub">
                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
                  title: 'Lien sécurisé',
                  desc: 'Le lien de réinitialisation expire dans 1 heure.',
                  iconBg: 'rgba(165,180,252,0.11)',
                  iconColor: 'rgba(165,180,252,0.9)',
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M1.5 3.5h11l-5.5 5-5.5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M1.5 3.5v7a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  ),
                  title: 'Réception rapide',
                  desc: 'Le lien vous parvient en quelques secondes.',
                  iconBg: 'rgba(249,168,212,0.11)',
                  iconColor: 'rgba(249,168,212,0.85)',
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1.5L12.5 4v4c0 2.8-2.5 5.2-5.5 6C3.5 13.2 1 10.8 1 8V4L7 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: 'Usage unique',
                  desc: 'Le lien expire après utilisation.',
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
                <Box component="p" className="aip-success-title">Email envoyé !</Box>
                <Box component="p" className="aip-success-sub">
                  Si un compte existe pour cet email, vous recevrez un lien de réinitialisation dans quelques instants.
                </Box>
                <button
                  type="button"
                  className="lp-submit"
                  style={{ marginTop: '24px' }}
                  onClick={() => navigate('/login')}
                >
                  Retour à la connexion
                </button>
              </Box>
            ) : (
              <>
                <Box className="lp-form-header">
                  <Box component="h2" className="lp-form-title">Réinitialisation</Box>
                  <Box component="p" className="lp-form-sub">Entrez l'email associé à votre compte</Box>
                </Box>

                <form onSubmit={handleSubmit} noValidate>
                  <Box className="lp-field">
                    <Box component="label" className="lp-label" htmlFor="fp-email">
                      Adresse email
                    </Box>
                    <input
                      id="fp-email"
                      ref={emailRef}
                      type="email"
                      className="lp-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="utilisateur@entreprise.com"
                      autoComplete="email"
                      required
                    />
                  </Box>

                  <button type="submit" className="lp-submit" disabled={loading}>
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      <>
                        Envoyer le lien
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <Box className="lp-forgot-wrap">
                  <Link to="/login" className="lp-forgot">Retour à la connexion</Link>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
