import type React from "react";
import { useState, useId } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { useT } from "@/contexts/I18nContext";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { PasswordTextField } from "@/components/ui/forms/PasswordTextField";
import { AuthFormHeader } from "@/features/auth/components/AuthFormHeader";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { ForgotPasswordModal } from "@/features/auth/pages/LoginPage/components/ForgotPasswordModal";
import { RegisterModal } from "@/features/auth/pages/LoginPage/components/RegisterModal";
import { useLoginForm } from "@/features/auth/pages/LoginPage/hooks";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import { AUTH_FORM_SX, riseInSx, tint } from "@/features/auth/styles";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: "20",
  height: "20",
  stroke: "currentColor",
} as const;

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
  const t = useT();
  const {
    register,
    errors,
    loading,
    hasError,
    showResend,
    clearErrorOnChange,
    onSubmit,
    handleResend,
  } = useLoginForm();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  return (
    <AuthLayout
      aside={
        <AuthShowcase
          headline={t("auth.login.headline_part1")}
          headlineLead={t("auth.login.headline_part2")}
          headlineAccent={t("auth.login.headline_accent")}
          subtitle={t("auth.login.headline_sub")}
          items={[
            {
              title: t("auth.login.feature1_title"),
              description: t("auth.login.feature1_desc"),
              iconStyle: {
                background: tint("var(--auth-indigo-300)", 11),
                color: tint("var(--auth-indigo-300)", 90),
              },
              icon: (
                <svg aria-hidden="true" {...ICON_PROPS}>
                  <path d="M4 20a8 8 0 1 1 16 0" />
                  <path d="M12 20l4.5-5.5" />
                  <path d="M4.5 15.5h.01M7 10.5h.01M12 8.5h.01M17 10.5h.01" />
                </svg>
              ),
            },
            {
              title: t("auth.login.feature2_title"),
              description: t("auth.login.feature2_desc"),
              iconStyle: {
                background: tint("var(--auth-pink-300)", 11),
                color: tint("var(--auth-pink-300)", 85),
              },
              icon: (
                <svg aria-hidden="true" {...ICON_PROPS}>
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ),
            },
            {
              title: t("auth.login.feature3_title"),
              description: t("auth.login.feature3_desc"),
              iconStyle: {
                background: tint("var(--auth-amber-400)", 11),
                color: tint("var(--auth-amber-400)", 85),
              },
              icon: (
                <svg aria-hidden="true" {...ICON_PROPS}>
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              ),
            },
          ]}
        />
      }
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
