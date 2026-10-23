import type React from "react";
import { useCallback, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useResetPasswordMutation } from "@/domains/auth/mutations";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import { useTokenPageLifecycle } from "@/features/auth/useTokenPageLifecycle";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthPasswordField } from "@/features/auth/components/AuthPasswordField";
import { AuthPageSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";
import "@/features/auth/auth.css";

const routeApi = getRouteApi("/reset-password");

export const ResetPasswordPage: React.FC = () => {
  const { token = "" } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const t = useT();
  const onError = useApiErrorToast("auth.reset_password.error_invalid_token");

  const {
    register,
    handleSubmit: handleFormSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const [showPassword, setShowPassword] = useState(false);
  const resetPasswordMutation = useResetPasswordMutation();
  const loading = resetPasswordMutation.isPending;
  const [done, setDone] = useState(false);
  const glowId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const redirectToLogin = useCallback(
    () => navigate({ to: ROUTES.LOGIN, replace: true }),
    [navigate],
  );
  const focusFirstField = useCallback(() => setFocus("password"), [setFocus]);
  useTokenPageLifecycle({
    token,
    done,
    focusFirstField,
    redirectToLogin,
  });

  const onSubmit = handleFormSubmit((data) => {
    resetPasswordMutation.mutate(
      { data: { token, password: data.password } },
      {
        onSuccess: () => setDone(true),
        onError,
      },
    );
  });

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
              aria-hidden="true"
            >
              <defs>
                <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    style={{
                      stopColor:
                        "color-mix(in srgb, var(--auth-indigo-300) 20%, transparent)",
                    }}
                  />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="450" cy="0" r="160" fill={`url(#${glowId})`} />
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
            <Box className="lp-logo-wordmark">
              <SentinelWordmark height={14} />
            </Box>
          </Box>

          <Box className="lp-left-body">
            <Box className="lp-left-headline">
              <Box component="h1">
                {t("auth.reset_password.headline_part1")}
                <br />
                <Box component="span" className="lp-headline-accent">
                  {t("auth.reset_password.headline_accent")}
                </Box>
              </Box>
              <Box component="p" className="lp-headline-sub">
                {t("auth.reset_password.headline_sub")}
              </Box>
            </Box>

            <Box className="lp-features">
              {[
                {
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="2"
                        y="6"
                        width="10"
                        height="7"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: t("auth.reset_password.feature1_title"),
                  desc: t("auth.reset_password.feature1_desc"),
                  iconBg:
                    "color-mix(in srgb, var(--auth-indigo-300) 11%, transparent)",
                  iconColor:
                    "color-mix(in srgb, var(--auth-indigo-300) 90%, transparent)",
                },
                {
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
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
                  title: t("auth.reset_password.feature2_title"),
                  desc: t("auth.reset_password.feature2_desc"),
                  iconBg:
                    "color-mix(in srgb, var(--auth-amber-400) 11%, transparent)",
                  iconColor:
                    "color-mix(in srgb, var(--auth-amber-400) 85%, transparent)",
                },
              ].map((f, i) => (
                <Box
                  key={f.title}
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
            {done ? (
              <AuthPageSuccess
                title={t("auth.reset_password.success_title")}
                subtitle={
                  <>
                    {t("auth.reset_password.success_line1")}
                    <br />
                    {t("auth.reset_password.success_line2")}
                  </>
                }
              />
            ) : (
              <>
                <Box className="lp-form-header">
                  <Box component="h2" className="lp-form-title">
                    {t("auth.reset_password.form_title")}
                  </Box>
                  <Box component="p" className="lp-form-sub">
                    {t("auth.reset_password.form_sub")}
                  </Box>
                </Box>

                <form onSubmit={onSubmit} noValidate>
                  <AuthPasswordField
                    id={passwordId}
                    label={t("auth.reset_password.password_label")}
                    registration={register("password")}
                    error={errors.password}
                    t={t}
                    placeholder={t("auth.reset_password.password_placeholder")}
                    autoComplete="new-password"
                    showPassword={showPassword}
                    onToggleShow={() => setShowPassword((v) => !v)}
                    showLabel={t("auth.reset_password.password_show")}
                    hideLabel={t("auth.reset_password.password_hide")}
                  />

                  <AuthFormField
                    id={confirmId}
                    label={t("auth.reset_password.confirm_label")}
                    registration={register("confirm")}
                    error={errors.confirm}
                    t={t}
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.reset_password.confirm_placeholder")}
                    autoComplete="new-password"
                  />

                  <AuthSubmitButton loading={loading}>
                    {t("auth.reset_password.submit")}
                  </AuthSubmitButton>
                </form>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
