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
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { PasswordTextField } from "@/components/ui/forms/PasswordTextField";
import { AuthFormHeader } from "@/features/auth/components/AuthFormHeader";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthPageSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { ResetPasswordShowcase } from "@/features/auth/components/ResetPasswordShowcase";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";
import { AUTH_FORM_SX } from "@/features/auth/styles";

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
    <AuthLayout aside={<ResetPasswordShowcase />}>
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
            <PasswordTextField
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

            <FormTextField
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
          </Box>
        </>
      )}
    </AuthLayout>
  );
};
