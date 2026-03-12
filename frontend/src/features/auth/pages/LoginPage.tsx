import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";

const GRID_DOTS = Array.from({ length: 20 * 16 });

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mounted) setTimeout(() => emailRef.current?.focus(), 600);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Veuillez remplir tous les champs", "warning");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      showToast("Identifiants incorrects", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="lp-root">
      <Box className="lp-grid" aria-hidden>
        {GRID_DOTS.map((_, i) => (
          <Box key={i} className="lp-dot" />
        ))}
      </Box>
      <Box className="lp-scanline" aria-hidden />
      <Box className="lp-glow" aria-hidden />
      <Box className="lp-glow-2" aria-hidden />

      <Box className="lp-card">
        {/* ── Left panel ── */}
        <Box className="lp-card-left">
          <Box className="lp-logo d-flex align-items-center gap-3">
            <Box className="lp-logo-mark d-flex align-items-center justify-content-center flex-shrink-0">
              T
            </Box>
            <Box
              sx={{
                fontFamily: "var(--font-ui)",
                fontSize: "18px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.04em",
              }}
            >
              TMA
              <Box component="span" sx={{ color: "rgba(255,255,255,0.45)" }}>
                flow
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              height: "1px",
              background: "rgba(255,255,255,0.1)",
              my: "28px",
            }}
          />

          <Box className="lp-headline">
            <Box component="h1">
              Votre TMA,
              <br />
              <Box component="em">sans friction</Box>
            </Box>
            <Box component="p">
              Pilotez vos interventions, respectez vos engagements.
            </Box>
          </Box>

          <Box
            className="lp-features mt-auto"
            sx={{ display: "flex", flexDirection: "column" }}
          >
            {[
              { label: "Délais tenus, clients satisfaits", color: "#fca5a5" },
              {
                label: "Tickets priorisés, équipe coordonnée",
                color: "#c4b5fd",
              },
              { label: "Failles détectées avant l'impact", color: "#fde68a" },
              { label: "Facturez juste, payez à temps", color: "#6ee7b7" },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  py: "13px",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 8,
                    height: 8,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: "-4px",
                      borderRadius: "50%",
                      background: item.color,
                      opacity: 0.25,
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: item.color,
                    }}
                  />
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: "12.5px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.75)",
                    flex: 1,
                  }}
                >
                  {item.label}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Right panel – form ── */}
        <Box className="lp-card-right">
          <Box sx={{ mb: "36px" }}>
            <Box
              component="h2"
              sx={{
                fontFamily: "var(--font-ui)",
                fontSize: "28px",
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.04em",
                m: "0 0 6px",
              }}
            >
              Connexion
            </Box>
            <Box
              component="p"
              sx={{ fontSize: "13px", color: "#6b7280", m: 0 }}
            >
              Accédez à votre tableau de bord
            </Box>
          </Box>

          <form onSubmit={handleSubmit} noValidate>
            <Box className="mb-3">
              <Box
                component="label"
                className="d-block mb-2"
                sx={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-mono)",
                }}
                htmlFor="lp-email"
              >
                Adresse email
              </Box>
              <input
                id="lp-email"
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

            <Box className="mb-3">
              <Box
                component="label"
                className="d-block mb-2"
                sx={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-mono)",
                }}
                htmlFor="lp-password"
              >
                Mot de passe
              </Box>
              <Box className="position-relative">
                <Box
                  component="input"
                  id="lp-password"
                  type={showPassword ? "text" : "password"}
                  className="lp-input"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
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
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <VisibilityOffOutlined sx={{ fontSize: 16 }} />
                  ) : (
                    <VisibilityOutlined sx={{ fontSize: 16 }} />
                  )}
                </button>
              </Box>
            </Box>

            <button
              type="submit"
              className="lp-submit d-flex align-items-center justify-content-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? (
                <Box className="lp-submit-loader" />
              ) : (
                <>
                  Se connecter
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </Box>
      </Box>
    </Box>
  );
};
