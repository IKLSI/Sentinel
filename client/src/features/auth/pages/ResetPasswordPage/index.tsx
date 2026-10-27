import type React from "react";
import { useCallback, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useResetPasswordMutation } from "@/domains/auth/mutations";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import { useTokenPageLifecycle } from "@/features/auth/useTokenPageLifecycle";
import { AuthFormHeader } from "@/features/auth/components/AuthFormHeader";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { AuthPageSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { NewPasswordFields } from "@/features/auth/components/NewPasswordFields";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";
import { AUTH_FORM_SX, tint } from "@/features/auth/styles";

const RINGS = [
  { r: 80, opacity: 0.3, width: 1.2 },
  { r: 125, opacity: 0.18, width: 1 },
  { r: 175, opacity: 0.11, width: 1 },
];

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
  const resetPasswordMutation = useResetPasswordMutation();
  const loading = resetPasswordMutation.isPending;
  const [done, setDone] = useState(false);
  const glowId = useId();

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
    <AuthLayout
      aside={
        <AuthShowcase
          showLogo
          decor={
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
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
                      style={{ stopColor: tint("var(--auth-indigo-300)", 20) }}
                    />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <circle cx="450" cy="0" r="160" fill={`url(#${glowId})`} />
                {RINGS.map((ring) => (
                  <circle
                    key={ring.r}
                    cx="450"
                    cy="0"
                    r={ring.r}
                    stroke={`rgba(255,255,255,${ring.opacity})`}
                    strokeWidth={ring.width}
                  />
                ))}
              </svg>
            </Box>
          }
          headline={t("auth.reset_password.headline_part1")}
          headlineAccent={t("auth.reset_password.headline_accent")}
          subtitle={t("auth.reset_password.headline_sub")}
          items={[
            {
              title: t("auth.reset_password.feature1_title"),
              description: t("auth.reset_password.feature1_desc"),
              iconStyle: {
                background: tint("var(--auth-indigo-300)", 11),
                color: tint("var(--auth-indigo-300)", 90),
              },
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
            },
            {
              title: t("auth.reset_password.feature2_title"),
              description: t("auth.reset_password.feature2_desc"),
              iconStyle: {
                background: tint("var(--auth-amber-400)", 11),
                color: tint("var(--auth-amber-400)", 85),
              },
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
            },
          ]}
        />
      }
    >
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
          <AuthFormHeader
            title={t("auth.reset_password.form_title")}
            subtitle={t("auth.reset_password.form_sub")}
          />

          <Box
            component="form"
            onSubmit={onSubmit}
            noValidate
            sx={AUTH_FORM_SX}
          >
            <NewPasswordFields
              labelPrefix="auth.reset_password"
              passwordRegistration={register("password")}
              confirmRegistration={register("confirm")}
              passwordError={errors.password}
              confirmError={errors.confirm}
            />

            <AuthSubmitButton loading={loading}>
              {t("auth.reset_password.submit")}
            </AuthSubmitButton>
          </Box>
        </>
      )}
    </AuthLayout>
  );
};
