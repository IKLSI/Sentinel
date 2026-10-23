import type React from "react";
import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { useResendVerificationMutation } from "@/domains/auth/mutations";
import { useApiError } from "@/hooks/useApiError";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthPasswordField } from "@/features/auth/components/AuthPasswordField";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { LoginShowcase } from "@/features/auth/components/LoginShowcase";
import { ForgotPasswordModal } from "@/features/auth/pages/ForgotPasswordModal";
import { RegisterModal } from "@/features/auth/pages/RegisterModal";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import "@/features/auth/auth.css";

const LEGAL_LINKS_SX = {
  mt: "36px",
  "@media (min-width: 901px)": {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "24px",
    mt: 0,
  },
} as const;

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
    if (!mounted) return;
    const id = setTimeout(() => setFocus("email"), 700);
    return () => clearTimeout(id);
  }, [mounted, setFocus]);

  const onSubmit = handleFormSubmit(async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate({ to: ROUTES.DASHBOARD });
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
        <LoginShowcase />

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

              <AuthSubmitButton loading={loading}>
                {t("auth.login.submit")}
              </AuthSubmitButton>
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

          <LegalLinks tone="auth" sx={LEGAL_LINKS_SX} />
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
