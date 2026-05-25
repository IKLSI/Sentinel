import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { register, resendVerification } from "../api/auth";
import { useToast } from "../../../hooks/useToast";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";
import { extractApiError } from "../../../utils/apiError";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();
  const [organizationName, setOrganizationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const orgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (mounted) setTimeout(() => orgRef.current?.focus(), 700);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName || !firstName || !lastName || !email || !password) {
      showToast(t("auth.register.fill_all_fields"), "warning");
      return;
    }
    setLoading(true);
    try {
      await register({
        organizationName,
        firstName,
        lastName,
        email,
        password,
      });
      setDone(true);
    } catch (err) {
      showToast(
        extractApiError(err, t("auth.register.error_generic")),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(email);
      showToast(t("auth.register.resend_done"), "success");
    } catch (err) {
      showToast(
        extractApiError(err, t("auth.register.error_generic")),
        "error",
      );
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
            <Box className="lp-logo-wordmark">{t("auth.register.brand")}</Box>
          </Box>

          <Box className="lp-left-body">
            <Box className="lp-left-headline">
              <Box component="h1">
                {t("auth.register.headline_part1")}
                <br />
                <Box component="span" className="lp-headline-accent">
                  {t("auth.register.headline_accent")}
                </Box>
              </Box>
              <Box component="p" className="lp-headline-sub">
                {t("auth.register.headline_sub")}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="lp-right">
          <Box className="lp-form-wrap">
            {done ? (
              <Box className="aip-success">
                <Box className="aip-success-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M6 14l6 6 10-10"
                      stroke="#6366f1"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">
                  {t("auth.register.success_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.register.success_sub")}
                </Box>
                <button
                  type="button"
                  className="lp-submit"
                  style={{ marginTop: "24px" }}
                  onClick={() => navigate("/login")}
                >
                  {t("auth.register.back_to_login")}
                </button>
                <Box className="lp-forgot-wrap">
                  <button
                    type="button"
                    className="lp-forgot"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={handleResend}
                  >
                    {t("auth.register.resend_link")}
                  </button>
                </Box>
              </Box>
            ) : (
              <>
                <Box className="lp-form-header">
                  <Box component="h2" className="lp-form-title">
                    {t("auth.register.form_title")}
                  </Box>
                  <Box component="p" className="lp-form-sub">
                    {t("auth.register.form_sub")}
                  </Box>
                </Box>

                <form onSubmit={handleSubmit} noValidate>
                  <Box className="lp-field">
                    <Box
                      component="label"
                      className="lp-label"
                      htmlFor="rp-org"
                    >
                      {t("auth.register.organization_label")}
                    </Box>
                    <input
                      id="rp-org"
                      ref={orgRef}
                      type="text"
                      className="lp-input"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={t("auth.register.organization_placeholder")}
                      autoComplete="organization"
                      required
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: "12px" }}>
                    <Box className="lp-field" sx={{ flex: 1 }}>
                      <Box
                        component="label"
                        className="lp-label"
                        htmlFor="rp-firstname"
                      >
                        {t("auth.register.firstname_label")}
                      </Box>
                      <input
                        id="rp-firstname"
                        type="text"
                        className="lp-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t("auth.register.firstname_placeholder")}
                        autoComplete="given-name"
                        required
                      />
                    </Box>
                    <Box className="lp-field" sx={{ flex: 1 }}>
                      <Box
                        component="label"
                        className="lp-label"
                        htmlFor="rp-lastname"
                      >
                        {t("auth.register.lastname_label")}
                      </Box>
                      <input
                        id="rp-lastname"
                        type="text"
                        className="lp-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t("auth.register.lastname_placeholder")}
                        autoComplete="family-name"
                        required
                      />
                    </Box>
                  </Box>

                  <Box className="lp-field">
                    <Box
                      component="label"
                      className="lp-label"
                      htmlFor="rp-email"
                    >
                      {t("auth.register.email_label")}
                    </Box>
                    <input
                      id="rp-email"
                      type="email"
                      className="lp-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.register.email_placeholder")}
                      autoComplete="email"
                      required
                    />
                  </Box>

                  <Box className="lp-field">
                    <Box
                      component="label"
                      className="lp-label"
                      htmlFor="rp-password"
                    >
                      {t("auth.register.password_label")}
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="rp-password"
                        type={showPassword ? "text" : "password"}
                        className="lp-input"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPassword(e.target.value)
                        }
                        placeholder={t("auth.register.password_placeholder")}
                        autoComplete="new-password"
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
                            ? t("auth.register.password_hide")
                            : t("auth.register.password_show")
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
                    className="lp-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      t("auth.register.submit")
                    )}
                  </button>
                </form>

                <Box className="lp-forgot-wrap">
                  <Link to="/login" className="lp-forgot">
                    {t("auth.register.already_account")}
                  </Link>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
