import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { SentinelLogo } from "../../../layouts/SentinelLogo";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mounted) setTimeout(() => emailRef.current?.focus(), 700);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Veuillez remplir tous les champs.", "warning");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setHasError(true);
      showToast("Identifiants incorrects.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="lp-root">
      <Box className="lp-card">
      {/* ── Panel gauche ── */}
      <Box className="lp-left">
        <Box className="lp-left-noise" aria-hidden />

        {/* Décor SVG fond */}
        <Box className="lp-decor" aria-hidden>
          <svg width="100%" height="100%" viewBox="0 0 450 600" fill="none" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="lp-glow-tr" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(165,180,252,0.2)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>

            {/* Cluster haut-droite — halo de lumière */}
            <circle cx="450" cy="0" r="160" fill="url(#lp-glow-tr)"/>

            {/* Anneaux concentriques haut-droite — du plus dense au plus fin */}
            <circle cx="450" cy="0" r="80"  stroke="rgba(255,255,255,0.30)" strokeWidth="1.2"/>
            <circle cx="450" cy="0" r="125" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
            <circle cx="450" cy="0" r="175" stroke="rgba(255,255,255,0.11)" strokeWidth="1"/>



          </svg>
        </Box>

        {/* Logo */}
        <Box className="lp-logo">
          <Box className="lp-logo-mark">
            <SentinelLogo width={20} height={23} />
          </Box>
          <Box className="lp-logo-wordmark">SENTINEL</Box>
        </Box>

        {/* Titre + features */}
        <Box className="lp-left-body">
          <Box className="lp-left-headline">
            <Box component="h1">
              Gardez une<br />
              <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                longueur{" "}
                <Box component="span" className="lp-headline-accent">d'avance.</Box>
              </Box>
            </Box>
            <Box component="p" className="lp-headline-sub">
              L'outil pensé pour les équipes support qui ne laissent rien au hasard.
            </Box>
          </Box>

          <Box className="lp-features">
            {[
              {
                icon: (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M7 4v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Délais tenus, alertes immédiates",
                desc: "Chaque dépassement détecté avant qu'il arrive.",
                iconBg: "rgba(165,180,252,0.11)",
                iconColor: "rgba(165,180,252,0.9)",
              },
              {
                icon: (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 1.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5z" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M3.5 5.5h4M3.5 8h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                ),
                title: "Facturation sans ressaisie",
                desc: "Du temps saisi à la facture, en un clic.",
                iconBg: "rgba(249,168,212,0.11)",
                iconColor: "rgba(249,168,212,0.85)",
              },
              {
                icon: (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1.5L12.5 4v4c0 2.8-2.5 5.2-5.5 6C3.5 13.2 1 10.8 1 8V4L7 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Santé technique suivie",
                desc: "Score de santé, vulnérabilités et dépendances.",
                iconBg: "rgba(251,191,36,0.11)",
                iconColor: "rgba(251,191,36,0.85)",
              },
            ].map((f, i) => (
              <Box
                key={i}
                className="lp-feature"
                style={{ animationDelay: `${0.52 + i * 0.1}s` }}
              >
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
          {/* En-tête formulaire */}
          <Box className="lp-form-header">
            <Box component="h2" className="lp-form-title">Bienvenue</Box>
            <Box component="p" className="lp-form-sub">Connectez-vous à votre espace de pilotage</Box>
          </Box>

          <form onSubmit={handleSubmit} noValidate>
            <Box className="lp-field">
              <Box component="label" className="lp-label" htmlFor="lp-email">
                Adresse email
              </Box>
              <input
                id="lp-email"
                ref={emailRef}
                type="email"
                className={`lp-input${hasError ? " lp-input--error" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setHasError(false); }}
                placeholder="utilisateur@entreprise.com"
                autoComplete="email"
                required
              />
            </Box>

            <Box className="lp-field">
              <Box component="label" className="lp-label" htmlFor="lp-password">
                Mot de passe
              </Box>
              <Box className="lp-input-wrap">
                <Box
                  component="input"
                  id="lp-password"
                  type={showPassword ? "text" : "password"}
                  className={`lp-input${hasError ? " lp-input--error" : ""}`}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value);
                    setHasError(false);
                  }}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  sx={{ paddingRight: "44px" }}
                  required
                />
                <button
                  type="button"
                  className="lp-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword
                    ? <VisibilityOffOutlined sx={{ fontSize: 16 }} />
                    : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                </button>
              </Box>
            </Box>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading ? (
                <Box className="lp-submit-loader" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <Box className="lp-forgot-wrap">
            <Link to="/forgot-password" className="lp-forgot">
              Mot de passe oublié ?
            </Link>
          </Box>

        </Box>
      </Box>
      </Box>
    </Box>
  );
};
