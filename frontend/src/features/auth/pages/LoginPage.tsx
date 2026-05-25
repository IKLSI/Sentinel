import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";
import { resendVerification } from "../api/auth";
import { extractApiError } from "../../../utils/apiError";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (mounted) setTimeout(() => emailRef.current?.focus(), 700);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast(t("auth.login.fill_all_fields"), "warning");
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      navigate(loggedUser.role === 'Client' ? '/tickets' : '/');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setShowResend(true);
        showToast(extractApiError(err, t("auth.login.email_not_verified")), "warning");
      } else {
        setHasError(true);
        showToast(t("auth.login.invalid_credentials"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast(t("auth.login.email_required_for_resend"), "warning");
      return;
    }
    try {
      await resendVerification(email);
      showToast(t("auth.login.resend_done"), "success");
    } catch (err) {
      showToast(extractApiError(err, t("auth.login.invalid_credentials")), "error");
    }
  };

  return (
    <Box className="lp-root">
      <Box className="lp-card">
        <Box className="lp-left">
          <Box className="lp-left-noise" aria-hidden />

          <Box className="lp-decor" aria-hidden>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 450 600"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="lp-glow-tr" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(165,180,252,0.2)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              <circle cx="450" cy="0" r="160" fill="url(#lp-glow-tr)" />

              <circle
                cx="450"
                cy="0"
                r="80"
                stroke="rgba(255,255,255,0.30)"
                strokeWidth="1.2"
              />
              <circle
                cx="450"
                cy="0"
                r="125"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
              />
              <circle
                cx="450"
                cy="0"
                r="175"
                stroke="rgba(255,255,255,0.11)"
                strokeWidth="1"
              />
            </svg>
          </Box>

          <Box className="lp-logo">
            <Box className="lp-logo-mark">
              <SentinelLogo width={20} height={23} />
            </Box>
            <Box className="lp-logo-wordmark">{t("auth.login.brand")}</Box>
          </Box>

          <Box className="lp-left-body">
            <Box className="lp-left-headline">
              <Box component="h1">
                {t("auth.login.headline_part1")}
                <br />
                <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                  {t("auth.login.headline_part2")}{" "}
                  <Box component="span" className="lp-headline-accent">
                    {t("auth.login.headline_accent")}
                  </Box>
                </Box>
              </Box>
              <Box component="p" className="lp-headline-sub">
                {t("auth.login.headline_sub")}
              </Box>
            </Box>

            <Box className="lp-features">
              {[
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M7 4v3.5l2 2"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                  title: t("auth.login.feature1_title"),
                  desc: t("auth.login.feature1_desc"),
                  iconBg: "rgba(165,180,252,0.11)",
                  iconColor: "rgba(165,180,252,0.9)",
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 1.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M3.5 5.5h4M3.5 8h5.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: t("auth.login.feature2_title"),
                  desc: t("auth.login.feature2_desc"),
                  iconBg: "rgba(249,168,212,0.11)",
                  iconColor: "rgba(249,168,212,0.85)",
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1.5L12.5 4v4c0 2.8-2.5 5.2-5.5 6C3.5 13.2 1 10.8 1 8V4L7 1.5z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.5 7l2 2 3-3"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                  title: t("auth.login.feature3_title"),
                  desc: t("auth.login.feature3_desc"),
                  iconBg: "rgba(251,191,36,0.11)",
                  iconColor: "rgba(251,191,36,0.85)",
                },
              ].map((f, i) => (
                <Box
                  key={i}
                  className="lp-feature"
                  style={{ animationDelay: `${0.52 + i * 0.1}s` }}
                >
                  <Box
                    className="lp-feature-icon"
                    style={{ background: f.iconBg, color: f.iconColor }}
                  >
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

        <Box className="lp-right">
          <Box className="lp-form-wrap">
            <Box className="lp-form-header">
              <Box component="h2" className="lp-form-title">
                {t("auth.login.form_title")}
              </Box>
              <Box component="p" className="lp-form-sub">
                {t("auth.login.form_sub")}
              </Box>
            </Box>

            <form onSubmit={handleSubmit} noValidate>
              <Box className="lp-field">
                <Box component="label" className="lp-label" htmlFor="lp-email">
                  {t("auth.login.email_label")}
                </Box>
                <input
                  id="lp-email"
                  ref={emailRef}
                  type="email"
                  className={`lp-input${hasError ? " lp-input--error" : ""}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setHasError(false);
                  }}
                  placeholder={t("auth.login.email_placeholder")}
                  autoComplete="email"
                  required
                />
              </Box>

              <Box className="lp-field">
                <Box
                  component="label"
                  className="lp-label"
                  htmlFor="lp-password"
                >
                  {t("auth.login.password_label")}
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
                    aria-label={
                      showPassword
                        ? t("auth.login.password_hide")
                        : t("auth.login.password_show")
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

              <button type="submit" className="lp-submit" disabled={loading}>
                {loading ? (
                  <Box className="lp-submit-loader" />
                ) : (
                  t("auth.login.submit")
                )}
              </button>
            </form>

            <Box className="lp-forgot-wrap">
              <Link to="/forgot-password" className="lp-forgot">
                {t("auth.login.forgot_password_link")}
              </Link>
            </Box>

            {showResend && (
              <Box className="lp-forgot-wrap">
                <button
                  type="button"
                  className="lp-forgot"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  onClick={handleResend}
                >
                  {t("auth.login.resend_link")}
                </button>
              </Box>
            )}

            <Box className="lp-forgot-wrap">
              <Link to="/register" className="lp-forgot">
                {t("auth.login.register_link")}
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
