import type React from "react";
import { useState, useEffect, useId } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { useT } from "@/contexts/I18nContext";
import { useResendVerificationMutation } from "@/domains/auth/mutations";
import { useApiError } from "@/hooks/useApiError";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { PasswordTextField } from "@/components/ui/forms/PasswordTextField";
import { AuthFormHeader } from "@/features/auth/components/AuthFormHeader";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { LoginShowcase } from "@/features/auth/components/LoginShowcase";
import { ForgotPasswordModal } from "@/features/auth/pages/ForgotPasswordModal";
import { RegisterModal } from "@/features/auth/pages/RegisterModal";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import { AUTH_FORM_SX, riseInSx } from "@/features/auth/styles";

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

const LOGIN_FOCUS_DELAY_MS = 750;

const LINKS_SX = {
  mt: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  ...riseInSx(0.74, 0.4),
} as const;

const LINK_SX = {
  fontSize: "13px",
  color: "var(--auth-gray-500)",
  textDecoration: "none",
  "&:hover": { color: "var(--auth-gray-900)" },
} as const;

const REGISTER_LINK_SX = {
  ...LINK_SX,
  fontWeight: 600,
  color: "var(--auth-register)",
  "&:hover": { color: "var(--auth-register-hover)" },
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
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    const id = setTimeout(() => setFocus("email"), LOGIN_FOCUS_DELAY_MS);
    return () => clearTimeout(id);
  }, [setFocus]);

  const clearErrorOnChange = (
    field: UseFormRegisterReturn,
  ): UseFormRegisterReturn => ({
    ...field,
    onChange: async (e) => {
      const result = await field.onChange(e);
      setHasError(false);
      return result;
    },
  });

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
        setHasError(status === 401);
        showToast(
          apiError(
            err,
            status === 401
              ? t("auth.login.invalid_credentials")
              : t("auth.login.unexpected_error"),
          ),
          "error",
        );
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
    <AuthLayout
      aside={<LoginShowcase />}
      footer={<LegalLinks tone="auth" sx={LEGAL_LINKS_SX} />}
    >
      <AuthFormHeader
        title={t("auth.login.form_title")}
        subtitle={t("auth.login.form_sub")}
      />

      <Box component="form" onSubmit={onSubmit} noValidate sx={AUTH_FORM_SX}>
        <FormTextField
          id={emailId}
          label={t("auth.login.email_label")}
          registration={clearErrorOnChange(register("email"))}
          error={errors.email}
          t={t}
          type="email"
          placeholder={t("auth.login.email_placeholder")}
          autoComplete="email"
          invalid={hasError || !!errors.email}
        />

        <PasswordTextField
          id={passwordId}
          label={t("auth.login.password_label")}
          registration={clearErrorOnChange(register("password"))}
          error={errors.password}
          invalid={hasError || !!errors.password}
          t={t}
          placeholder="••••••••••"
          autoComplete="current-password"
          showLabel={t("auth.login.password_show")}
          hideLabel={t("auth.login.password_hide")}
        />

        <AuthSubmitButton loading={loading}>
          {t("auth.login.submit")}
        </AuthSubmitButton>
      </Box>

      <Box sx={LINKS_SX}>
        <Link
          component="button"
          type="button"
          sx={LINK_SX}
          onClick={() => setForgotOpen(true)}
        >
          {t("auth.login.forgot_password_link")}
        </Link>
        <Link
          component="button"
          type="button"
          sx={REGISTER_LINK_SX}
          onClick={() => setRegisterOpen(true)}
        >
          {t("auth.login.register_link")}
        </Link>
        {showResend && (
          <Link
            component="button"
            type="button"
            sx={LINK_SX}
            onClick={handleResend}
          >
            {t("auth.login.resend_link")}
          </Link>
        )}
      </Box>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </AuthLayout>
  );
};
