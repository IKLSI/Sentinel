import type React from "react";
import { useCallback, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useAcceptInvitationMutation } from "@/domains/users/mutations";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import { useTokenPageLifecycle } from "@/features/auth/useTokenPageLifecycle";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthPasswordField } from "@/features/auth/components/AuthPasswordField";
import { AuthPageSuccess } from "@/features/auth/components/AuthSuccessPanel";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
} from "@/features/auth/schemas";
import { LegalLinks } from "@/features/legal/components/LegalLinks";

const routeApi = getRouteApi("/accept-invitation");

export const AcceptInvitationPage: React.FC = () => {
  const { token = "" } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const t = useT();
  const onError = useApiErrorToast(
    "auth.accept_invitation.error_invalid_token",
  );

  const STEPS = [
    {
      num: "1",
      title: t("auth.accept_invitation.step1_title"),
      desc: t("auth.accept_invitation.step1_desc"),
    },
    {
      num: "2",
      title: t("auth.accept_invitation.step2_title"),
      desc: t("auth.accept_invitation.step2_desc"),
    },
    {
      num: "3",
      title: t("auth.accept_invitation.step3_title"),
      desc: t("auth.accept_invitation.step3_desc"),
    },
  ];

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
    <Box className="aip-root">
      <Box className="aip-card">
        <Box className="aip-left">
          <Box className="aip-noise" aria-hidden />

          <Box className="aip-body">
            <Box className="aip-logo">
              <Box className="aip-logo-text">
                <SentinelWordmark height={13} />
              </Box>
            </Box>
            <Box className="aip-headline">
              <Box component="h1">
                {t("auth.accept_invitation.headline_part1")}
                <br />
                <Box component="span" className="aip-headline-accent">
                  {t("auth.accept_invitation.headline_accent")}
                </Box>
              </Box>
              <Box component="p" className="aip-headline-sub">
                {t("auth.accept_invitation.headline_sub")}
              </Box>
            </Box>

            <Box className="aip-steps">
              {STEPS.map((s, i) => (
                <Box
                  key={s.num}
                  className="aip-step"
                  style={{ animationDelay: `${0.52 + i * 0.1}s` }}
                >
                  <Box className="aip-step-num">{s.num}</Box>
                  <Box>
                    <Box className="aip-step-title">{s.title}</Box>
                    <Box className="aip-step-desc">{s.desc}</Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box className="aip-right">
          <Box className="aip-form-wrap">
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
                <Box className="aip-form-header">
                  <Box component="h2" className="aip-form-title">
                    {t("auth.accept_invitation.form_title")}
                  </Box>
                  <Box component="p" className="aip-form-sub">
                    {t("auth.accept_invitation.form_sub")}
                  </Box>
                </Box>

                <form onSubmit={onSubmit} noValidate>
                  <Box className="lp-field aip-row">
                    <Box>
                      <AuthFormField
                        bare
                        id={firstNameId}
                        label={t("auth.accept_invitation.firstname_label")}
                        registration={register("firstName")}
                        error={errors.firstName}
                        t={t}
                        placeholder={t(
                          "auth.accept_invitation.firstname_placeholder",
                        )}
                        autoComplete="given-name"
                        required
                      />
                    </Box>
                    <Box>
                      <AuthFormField
                        bare
                        id={lastNameId}
                        label={t("auth.accept_invitation.lastname_label")}
                        registration={register("lastName")}
                        t={t}
                        placeholder={t(
                          "auth.accept_invitation.lastname_placeholder",
                        )}
                        autoComplete="family-name"
                      />
                    </Box>
                  </Box>

                  <AuthPasswordField
                    id={passwordId}
                    label={t("auth.accept_invitation.password_label")}
                    registration={register("password")}
                    error={errors.password}
                    t={t}
                    placeholder={t(
                      "auth.accept_invitation.password_placeholder",
                    )}
                    autoComplete="new-password"
                    required
                    showPassword={showPassword}
                    onToggleShow={() => setShowPassword((v) => !v)}
                    showLabel={t("auth.accept_invitation.password_show")}
                    hideLabel={t("auth.accept_invitation.password_hide")}
                  />

                  <AuthFormField
                    id={confirmId}
                    label={t("auth.accept_invitation.confirm_label")}
                    registration={register("confirm")}
                    error={errors.confirm}
                    t={t}
                    type={showPassword ? "text" : "password"}
                    placeholder={t(
                      "auth.accept_invitation.confirm_placeholder",
                    )}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="submit"
                    className="lp-submit"
                    disabled={loading}
                    style={{ marginTop: "24px" }}
                  >
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      t("auth.accept_invitation.submit")
                    )}
                  </button>
                </form>

                <LegalLinks tone="auth" sx={{ mt: "30px" }} />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
