import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { useTheme } from '../../../store/ThemeContext'
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
    <>
      <style>{`
        .lp-root {
          width: 100%;
          height: 100dvh;
          display: flex;
          background: var(--bg);
          font-family: var(--font-ui);
          overflow: hidden;
          transition: background 0.25s;
        }

        .lp-left {
          width: 480px;
          flex-shrink: 0;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 48px 52px;
          overflow: hidden;
          background: var(--s1);
          border-right: 1px solid var(--border);
          transition: background 0.25s, border-color 0.25s;
        }

        .lp-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(20, 1fr);
          grid-template-rows: repeat(16, 1fr);
          pointer-events: none;
          z-index: 0;
        }

        .lp-dot {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-dot::after {
          content: '';
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: var(--accent-border);
        }

        .lp-scanline {
          position: absolute;
          inset-inline: 0;
          height: 120px;
          background: linear-gradient(180deg, transparent 0%, var(--accent-subtle) 40%, var(--accent-subtle) 60%, transparent 100%);
          animation: scan 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes scan {
          0%   { top: -120px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .lp-glow {
          position: absolute;
          top: -100px;
          left: -100px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--accent-subtle) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .lp-left-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(-8px);
          animation: fadeup 0.5s 0.1s forwards;
        }

        .lp-logo-mark {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, var(--accent) 0%, #818cf8 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          color: #fff;
          letter-spacing: -0.05em;
          box-shadow: 0 0 24px var(--accent-border), 0 4px 12px rgba(0,0,0,0.3);
          flex-shrink: 0;
        }

        .lp-logo-text {
          font-family: var(--font-ui);
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.04em;
        }

        .lp-logo-text span { color: var(--accent); }

        .lp-headline {
          opacity: 0;
          transform: translateY(12px);
          animation: fadeup 0.6s 0.25s forwards;
          margin-bottom: 48px;
        }

        .lp-headline h1 {
          font-family: var(--font-ui);
          font-size: 44px;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.04em;
          color: var(--text);
          margin: 0 0 16px 0;
        }

        .lp-headline h1 em {
          font-style: normal;
          background: linear-gradient(90deg, var(--accent), #818cf8, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-headline p {
          font-size: 13px;
          color: var(--muted2);
          line-height: 1.65;
          max-width: 320px;
          margin: 0;
        }

        .lp-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          opacity: 0;
          animation: fadeup 0.6s 0.4s forwards;
          margin-top: auto;
        }

        .lp-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 8px;
          background: var(--s2);
          border: 1px solid var(--border);
          transition: border-color 0.2s, background 0.2s;
        }

        .lp-feature:hover {
          border-color: var(--accent-border);
          background: var(--accent-subtle);
        }

        .lp-feature-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .lp-feature-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--muted2);
          flex: 1;
        }

        .lp-feature-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .lp-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: var(--bg);
          position: relative;
          transition: background 0.25s;
        }

        .lp-right-bg {
          position: absolute;
          bottom: -120px;
          right: -120px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--accent-subtle) 0%, transparent 60%);
          pointer-events: none;
        }

        .lp-theme-toggle {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--s2);
          border: 1px solid var(--border);
          color: var(--muted2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
          z-index: 10;
        }

        .lp-theme-toggle:hover {
          background: var(--s3);
          border-color: var(--accent-border);
          color: var(--accent);
          transform: rotate(20deg);
        }

        .lp-form-wrap {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(16px);
          animation: fadeup 0.7s 0.35s forwards;
        }

        .lp-form-header {
          margin-bottom: 40px;
        }

        .lp-form-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lp-form-eyebrow::before {
          content: '';
          display: inline-block;
          width: 18px;
          height: 1px;
          background: var(--accent);
        }

        .lp-form-title {
          font-family: var(--font-ui);
          font-size: 30px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.04em;
          margin: 0 0 6px 0;
        }

        .lp-form-sub {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
        }

        .lp-field {
          margin-bottom: 18px;
        }

        .lp-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          font-family: var(--font-mono);
        }

        .lp-input-wrap {
          position: relative;
        }

        .lp-input {
          width: 100%;
          padding: 13px 16px;
          background: var(--s1);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
          font-family: var(--font-ui);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          -webkit-appearance: none;
        }

        .lp-input::placeholder { color: var(--muted); opacity: 0.5; }

        .lp-input:hover { border-color: var(--border2); }

        .lp-input:focus {
          border-color: var(--accent-border);
          box-shadow: 0 0 0 3px var(--accent-subtle);
          background: var(--s2);
        }

        .lp-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .lp-pw-toggle:hover { color: var(--muted2); }

        .lp-submit {
          width: 100%;
          padding: 14px 20px;
          background: var(--accent);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: var(--font-ui);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 20px var(--accent-border);
        }

        .lp-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%);
          pointer-events: none;
        }

        .lp-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          background: var(--accent2);
          box-shadow: 0 6px 28px var(--accent-border);
        }

        .lp-submit:active:not(:disabled) { transform: translateY(0); }

        .lp-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .lp-submit-loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .lp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border2), transparent);
          margin: 32px 0;
        }

        .lp-footer {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 0.08em;
          opacity: 0.6;
        }

        @keyframes fadeup {
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .lp-left { display: none; }
          .lp-right { padding: 24px 20px; align-items: flex-start; padding-top: 60px; }
          .lp-form-wrap { max-width: 100%; }
          .lp-theme-toggle { top: 16px; right: 16px; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .lp-left { width: 340px; padding: 36px 32px; }
          .lp-headline h1 { font-size: 32px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-left">
          <div className="lp-grid" aria-hidden>
            {GRID_DOTS.map((_, i) => <div key={i} className="lp-dot" />)}
          </div>
          <div className="lp-scanline" aria-hidden />
          <div className="lp-glow" aria-hidden />

          <div className="lp-left-content">
            <div className="lp-logo">
              <div className="lp-logo-mark">T</div>
              <div className="lp-logo-text">TMA<span>flow</span></div>
            </div>

            <div className="lp-headline">
              <h1>Votre TMA,<br /><em>sans friction</em></h1>
              <p>Tickets, SLA, time tracking et santé technique — une plateforme pour les équipes de maintenance applicative.</p>
            </div>

            <div className="lp-features">
              {[
                { label: 'Alertes SLA en temps réel', color: 'var(--accent)', tag: 'SLA', tagBg: 'var(--accent-subtle)', tagColor: 'var(--accent)' },
                { label: 'Kanban & suivi de tickets', color: 'var(--cyan)', tag: 'TICKETS', tagBg: 'var(--cyan-subtle)', tagColor: 'var(--cyan)' },
                { label: 'Veille CVE automatique', color: 'var(--green)', tag: 'SÉCURITÉ', tagBg: 'var(--green-subtle)', tagColor: 'var(--green)' },
                { label: 'Facturation & time tracking', color: 'var(--yellow)', tag: 'BILLING', tagBg: 'var(--yellow-subtle)', tagColor: 'var(--yellow)' },
              ].map((f) => (
                <div key={f.label} className="lp-feature">
                  <div className="lp-feature-dot" style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }} />
                  <span className="lp-feature-name">{f.label}</span>
                  <span className="lp-feature-tag" style={{ background: f.tagBg, color: f.tagColor }}>
                    {f.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-right">
          <div className="lp-right-bg" aria-hidden />

          <button
            className="lp-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <LightModeOutlined sx={{ fontSize: 15 }} /> : <DarkModeOutlined sx={{ fontSize: 15 }} />}
          </button>

          <div className="lp-form-wrap">
            <div className="lp-form-header">
              <div className="lp-form-eyebrow">Espace de travail</div>
              <h2 className="lp-form-title">Connexion</h2>
              <p className="lp-form-sub">Accédez à votre tableau de bord</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-email">Adresse email</label>
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
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-password">Mot de passe</label>
                <div className="lp-input-wrap">
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: '44px' }}
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
                </div>
              </div>

              <button type="submit" className="lp-submit" disabled={loading}>
                {loading ? (
                  <div className="lp-submit-loader" />
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

            <div className="lp-divider" />

            <div className="lp-footer">
              TMAflow &nbsp;·&nbsp; v2.0 &nbsp;·&nbsp; Plateforme TMA
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
