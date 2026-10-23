import type React from "react";
import { useCallback, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useAcceptInvitationMutation } from "@/domains/users/mutations";
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
import { InvitationShowcase } from "@/features/auth/components/InvitationShowcase";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
} from "@/features/auth/schemas";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import { riseInSx } from "@/features/auth/styles";

const FORM_SX = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  ...riseInSx(0.52),
} as const;

const NAME_ROW_SX = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
} as const;

const routeApi = getRouteApi("/accept-invitation");

export const AcceptInvitationPage: React.FC = () => {
  const { token = "" } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const t = useT();
  const onError = useApiErrorToast(
    "auth.accept_invitation.error_invalid_token",
  );

  const {
    register,
    handleSubmit: handleFormSubmit,
    setFocus,
    formState: { errors },
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { firstName: "", lastName: "", password: "", confirm: "" },
  });
  const [showPassword, setShowPassword] = useState(false);
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const loading = acceptInvitationMutation.isPending;
  const [done, setDone] = useState(false);
  const firstNameId = useId();
  const lastNameId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const redirectToLogin = useCallback(
    () => navigate({ to: ROUTES.LOGIN, replace: true }),
    [navigate],
  );
  const focusFirstField = useCallback(() => setFocus("firstName"), [setFocus]);
  useTokenPageLifecycle({
    token,
    done,
    focusFirstField,
    redirectToLogin,
  });

  const onSubmit = handleFormSubmit((data) => {
    acceptInvitationMutation.mutate(
      {
        data: {
          token,
          firstName: data.firstName,
          lastName: data.lastName ?? "",
          password: data.password,
        },
      },
      {
        onSuccess: () => setDone(true),
        onError,
      },
    );
  });

  return (
    <AuthLayout aside={<InvitationShowcase />} formMaxWidth={380}>
      {done ? (
        <AuthPageSuccess
          title={t("auth.accept_invitation.success_title")}
          subtitle={
            <>
              {t("auth.accept_invitation.success_line1")}
              <br />
              {t("auth.accept_invitation.success_line2")}
            </>
          }
        />
      ) : (
        <>
          <AuthFormHeader
            title={t("auth.accept_invitation.form_title")}
            subtitle={t("auth.accept_invitation.form_sub")}
          />

          <Box component="form" onSubmit={onSubmit} noValidate sx={FORM_SX}>
            <Box sx={NAME_ROW_SX}>
              <FormTextField
                id={firstNameId}
                label={t("auth.accept_invitation.firstname_label")}
                registration={register("firstName")}
                error={errors.firstName}
                t={t}
                placeholder={t("auth.accept_invitation.firstname_placeholder")}
                autoComplete="given-name"
                required
              />
              <FormTextField
                id={lastNameId}
                label={t("auth.accept_invitation.lastname_label")}
                registration={register("lastName")}
                t={t}
                placeholder={t("auth.accept_invitation.lastname_placeholder")}
                autoComplete="family-name"
              />
            </Box>

            <PasswordTextField
              id={passwordId}
              label={t("auth.accept_invitation.password_label")}
              registration={register("password")}
              error={errors.password}
              t={t}
              placeholder={t("auth.accept_invitation.password_placeholder")}
              autoComplete="new-password"
              required
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              showLabel={t("auth.accept_invitation.password_show")}
              hideLabel={t("auth.accept_invitation.password_hide")}
            />

            <FormTextField
              id={confirmId}
              label={t("auth.accept_invitation.confirm_label")}
              registration={register("confirm")}
              error={errors.confirm}
              t={t}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.accept_invitation.confirm_placeholder")}
              autoComplete="new-password"
              required
            />

            <AuthSubmitButton loading={loading}>
              {t("auth.accept_invitation.submit")}
            </AuthSubmitButton>
          </Box>

          <LegalLinks tone="auth" sx={{ mt: "30px" }} />
        </>
      )}
    </AuthLayout>
  );
};
