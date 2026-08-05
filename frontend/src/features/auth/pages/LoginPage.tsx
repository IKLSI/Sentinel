import type React from "react";
import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Box from "@mui/material/Box";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { useT } from "@/contexts/I18nContext";
import { useResendVerificationMutation } from "@/domains/auth/mutations";
import { useApiError } from "@/hooks/useApiError";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthPasswordField } from "@/features/auth/components/AuthPasswordField";
import { ForgotPasswordModal } from "@/features/auth/pages/ForgotPasswordModal";
import { RegisterModal } from "@/features/auth/pages/RegisterModal";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { LegalLinks } from "@/features/legal/components/LegalLinks";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const resendVerificationMutation = useResendVerificationMutation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const t = useT();
  const apiError = useApiError();
  const onResendError = useApiErrorToast("auth.login.invalid_credentials");
  const {
    register,
    handleSubmit: handleFormSubmit,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const emailField = register("email");
  const passwordField = register("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (mounted) setTimeout(() => setFocus("email"), 700);
  }, [mounted, setFocus]);

  const onSubmit = handleFormSubmit(async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate({ to: ROUTES.HOME });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 403) {
        setShowResend(true);
        showToast(apiError(err, t("auth.login.email_not_verified")), "warning");
      } else {
        setHasError(true);
        showToast(t("auth.login.invalid_credentials"), "error");
      }
    } finally {
      setLoading(false);
    }
  });

  const handleResend = () => {
    const email = getValues("email");
    if (!email) {
      showToast(t("auth.login.email_required_for_resend"), "warning");
      return;
    }
    resendVerificationMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => showToast(t("auth.login.resend_done"), "success"),
        onError: onResendError,
      },
    );
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

            <form onSubmit={onSubmit} noValidate style={{ marginTop: "30px" }}>
              <AuthFormField
                id={emailId}
                label={t("auth.login.email_label")}
                registration={{
                  ...emailField,
                  onChange: async (e) => {
                    const result = await emailField.onChange(e);
                    setHasError(false);
                    return result;
                  },
                }}
                error={errors.email}
                t={t}
                type="email"
                placeholder={t("auth.login.email_placeholder")}
                autoComplete="email"
                invalid={hasError || !!errors.email}
              />

              <AuthPasswordField
                id={passwordId}
                label={t("auth.login.password_label")}
                registration={{
                  ...passwordField,
                  onChange: async (e) => {
                    const result = await passwordField.onChange(e);
                    setHasError(false);
                    return result;
                  },
                }}
                error={errors.password}
                invalid={hasError || !!errors.password}
                t={t}
                placeholder="••••••••••"
                autoComplete="current-password"
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                showLabel={t("auth.login.password_show")}
                hideLabel={t("auth.login.password_hide")}
                toggleIconSize={19}
              />

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

            <LegalLinks tone="auth" sx={{ mt: "30px" }} />
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
