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
import { AuthFormHeader } from "@/features/auth/components/AuthFormHeader";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { AuthPageSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { NewPasswordFields } from "@/features/auth/components/NewPasswordFields";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
} from "@/features/auth/schemas";
import { LegalLinks } from "@/features/legal/components/LegalLinks";
import { AUTH_FORM_SX } from "@/features/auth/styles";

const NAME_ROW_SX = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
} as const;

const STEP_KEYS = ["step1", "step2", "step3"] as const;

const STEP_ICON_STYLE: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "color-mix(in srgb, var(--auth-indigo-300) 15%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--auth-indigo-300) 30%, transparent)",
  color: "color-mix(in srgb, var(--auth-indigo-300) 90%, transparent)",
  fontSize: 11,
  fontWeight: 700,
};

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
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const loading = acceptInvitationMutation.isPending;
  const [done, setDone] = useState(false);
  const firstNameId = useId();
  const lastNameId = useId();

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
    <AuthLayout
      aside={
        <AuthShowcase
          showLogo
          headline={t("auth.accept_invitation.headline_part1")}
          headlineAccent={t("auth.accept_invitation.headline_accent")}
          subtitle={t("auth.accept_invitation.headline_sub")}
          items={STEP_KEYS.map((step, index) => ({
            title: t(`auth.accept_invitation.${step}_title`),
            description: t(`auth.accept_invitation.${step}_desc`),
            iconStyle: STEP_ICON_STYLE,
            icon: index + 1,
          }))}
        />
      }
      formMaxWidth={380}
    >
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

          <Box
            component="form"
            onSubmit={onSubmit}
            noValidate
            sx={AUTH_FORM_SX}
          >
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

            <NewPasswordFields
              labelPrefix="auth.accept_invitation"
              passwordRegistration={register("password")}
              confirmRegistration={register("confirm")}
              passwordError={errors.password}
              confirmError={errors.confirm}
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
