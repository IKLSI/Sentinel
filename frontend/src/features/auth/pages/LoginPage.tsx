import type React from "react";
import { useState, useEffect, useRef, useId } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";
import { useResendVerificationMutation } from "../hooks/useAuthMutations";
import { extractApiError } from "../../../utils/apiError";
import { ROUTES } from "@/constants/routes";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { RegisterModal } from "./RegisterModal";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const resendVerificationMutation = useResendVerificationMutation();
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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const passwordId = useId();

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
      await login(email, password);
      navigate({ to: ROUTES.HOME });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 403) {
        setShowResend(true);
        showToast(
          extractApiError(err, t("auth.login.email_not_verified")),
          "warning",
        );
      } else {
        setHasError(true);
        showToast(t("auth.login.invalid_credentials"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!email) {
      showToast(t("auth.login.email_required_for_resend"), "warning");
      return;
    }
    resendVerificationMutation.mutate(email, {
      onSuccess: () => showToast(t("auth.login.resend_done"), "success"),
      onError: (err) =>
        showToast(
          extractApiError(err, t("auth.login.invalid_credentials")),
          "error",
        ),
    });
  };

  return (
    <Box className="lp-root">
      <Box className="lp-card">
        <Box className="lp-left">
          <Box className="lp-left-noise" aria-hidden />
          <Box className="lp-left-body">
            <Box className="lp-brand">
              <SentinelLogo width={18} height={21} />
              {t("auth.login.brand")}
            </Box>
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
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        stroke:
                          "color-mix(in srgb, var(--auth-indigo-300) 90%, transparent)",
                      }}
                      width="20"
                      height="20"
                    >
                      <path d="M4 20a8 8 0 1 1 16 0" />
                      <path d="M12 20l4.5-5.5" />
                      <path d="M4.5 15.5h.01M7 10.5h.01M12 8.5h.01M17 10.5h.01" />
                    </svg>
                  ),
                  title: t("auth.login.feature1_title"),
                  desc: t("auth.login.feature1_desc"),
                  iconBg:
                    "color-mix(in srgb, var(--auth-indigo-300) 11%, transparent)",
                },
                {
                  icon: (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        stroke:
                          "color-mix(in srgb, var(--auth-pink-300) 85%, transparent)",
                      }}
                      width="20"
                      height="20"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  ),
                  title: t("auth.login.feature2_title"),
                  desc: t("auth.login.feature2_desc"),
                  iconBg:
                    "color-mix(in srgb, var(--auth-pink-300) 11%, transparent)",
                },
                {
                  icon: (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        stroke:
                          "color-mix(in srgb, var(--auth-amber-400) 85%, transparent)",
                      }}
                      width="20"
                      height="20"
                    >
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  ),
                  title: t("auth.login.feature3_title"),
                  desc: t("auth.login.feature3_desc"),
                  iconBg:
                    "color-mix(in srgb, var(--auth-amber-400) 11%, transparent)",
                },
              ].map((f, i) => (
                <Box
                  key={f.title}
                  className="lp-feature"
                  style={{ animationDelay: `${0.52 + i * 0.1}s` }}
                >
                  <Box
                    className="lp-feature-icon"
                    style={{ background: f.iconBg }}
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

            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ marginTop: "30px" }}
            >
              <Box className="lp-field">
                <Box component="label" className="lp-label" htmlFor={emailId}>
                  {t("auth.login.email_label")}
                </Box>
                <input
                  id={emailId}
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
                  htmlFor={passwordId}
                >
                  {t("auth.login.password_label")}
                </Box>
                <Box className="lp-input-wrap">
                  <Box
                    component="input"
                    id={passwordId}
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
                      <VisibilityOffOutlined sx={{ fontSize: 19 }} />
                    ) : (
                      <VisibilityOutlined sx={{ fontSize: 19 }} />
                    )}
                  </button>
                </Box>
              </Box>

              <button
                type="submit"
                className="lp-submit"
                disabled={loading}
                style={{ fontFamily: "inherit" }}
              >
                {loading ? (
                  <Box className="lp-submit-loader" />
                ) : (
                  t("auth.login.submit")
                )}
              </button>
            </form>

            <Box className="lp-forgot-wrap">
              <button
                type="button"
                className="lp-forgot"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setForgotOpen(true)}
              >
                {t("auth.login.forgot_password_link")}
              </button>
              <button
                type="button"
                className="lp-forgot lp-forgot--register"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onClick={() => setRegisterOpen(true)}
              >
                {t("auth.login.register_link")}
              </button>
              {showResend && (
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
                  {t("auth.login.resend_link")}
                </button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </Box>
  );
};
