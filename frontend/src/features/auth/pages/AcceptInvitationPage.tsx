import type React from "react";
import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { useAcceptInvitationMutation } from "@/domains/users/mutations";
import { useToast } from "@/hooks/useToast";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { useT } from "@/contexts/I18nContext";
import { useApiError } from "@/hooks/useApiError";
import { ROUTES } from "@/constants/routes";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
} from "@/features/auth/schemas";
import { resolveFieldError } from "@/helpers/validation/resolveFieldError";

const routeApi = getRouteApi("/accept-invitation");

export const AcceptInvitationPage: React.FC = () => {
  const { token = "" } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { showToast } = useToast();
  const t = useT();
  const apiError = useApiError();

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
  const [mounted, setMounted] = useState(false);
  const firstNameId = useId();
  const lastNameId = useId();
  const passwordId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (!token) navigate({ to: ROUTES.LOGIN, replace: true });
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, [token, navigate]);

  useEffect(() => {
    if (mounted) setTimeout(() => setFocus("firstName"), 700);
  }, [mounted, setFocus]);

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
        onSuccess: () => {
          setDone(true);
          setTimeout(() => navigate({ to: ROUTES.LOGIN, replace: true }), 3500);
        },
        onError: (err) =>
          showToast(
            apiError(err, t("auth.accept_invitation.error_invalid_token")),
            "error",
          ),
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
              <Box className="aip-logo-mark">
                <SentinelLogo width={18} height={21} />
              </Box>
              <Box className="aip-logo-text">
                {t("auth.accept_invitation.brand")}
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
              <Box className="aip-success">
                <Box className="aip-success-icon">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 14l6 6 10-10"
                      style={{ stroke: "var(--auth-indigo-500)" }}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">
                  {t("auth.accept_invitation.success_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.accept_invitation.success_line1")}
                  <br />
                  {t("auth.accept_invitation.success_line2")}
                </Box>
              </Box>
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
                      <Box
                        component="label"
                        className="lp-label"
                        htmlFor={firstNameId}
                      >
                        {t("auth.accept_invitation.firstname_label")}{" "}
                        <span style={{ color: "var(--auth-red-500)" }}>*</span>
                      </Box>
                      <input
                        id={firstNameId}
                        type="text"
                        className={`lp-input${errors.firstName ? " lp-input--error" : ""}`}
                        placeholder={t(
                          "auth.accept_invitation.firstname_placeholder",
                        )}
                        autoComplete="given-name"
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <Box className="lp-field-error">
                          {resolveFieldError(errors.firstName, t)}
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <Box
                        component="label"
                        className="lp-label"
                        htmlFor={lastNameId}
                      >
                        {t("auth.accept_invitation.lastname_label")}
                      </Box>
                      <input
                        id={lastNameId}
                        type="text"
                        className="lp-input"
                        placeholder={t(
                          "auth.accept_invitation.lastname_placeholder",
                        )}
                        autoComplete="family-name"
                        {...register("lastName")}
                      />
                    </Box>
                  </Box>

                  <Box className="lp-field">
                    <Box
                      component="label"
                      className="lp-label"
                      htmlFor={passwordId}
                    >
                      {t("auth.accept_invitation.password_label")}{" "}
                      <span style={{ color: "var(--auth-red-500)" }}>*</span>
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id={passwordId}
                        type={showPassword ? "text" : "password"}
                        className={`lp-input${errors.password ? " lp-input--error" : ""}`}
                        placeholder={t(
                          "auth.accept_invitation.password_placeholder",
                        )}
                        autoComplete="new-password"
                        sx={{ paddingRight: "44px" }}
                        {...register("password")}
                      />
                      <button
                        type="button"
                        className="lp-pw-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={
                          showPassword
                            ? t("auth.accept_invitation.password_hide")
                            : t("auth.accept_invitation.password_show")
                        }
                      >
                        {showPassword ? (
                          <VisibilityOffOutlined sx={{ fontSize: 16 }} />
                        ) : (
                          <VisibilityOutlined sx={{ fontSize: 16 }} />
                        )}
                      </button>
                    </Box>
                    {errors.password && (
                      <Box className="lp-field-error">
                        {resolveFieldError(errors.password, t)}
                      </Box>
                    )}
                  </Box>

                  <Box className="lp-field">
                    <Box
                      component="label"
                      className="lp-label"
                      htmlFor={confirmId}
                    >
                      {t("auth.accept_invitation.confirm_label")}{" "}
                      <span style={{ color: "var(--auth-red-500)" }}>*</span>
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id={confirmId}
                        type={showPassword ? "text" : "password"}
                        className={`lp-input${errors.confirm ? " lp-input--error" : ""}`}
                        placeholder={t(
                          "auth.accept_invitation.confirm_placeholder",
                        )}
                        autoComplete="new-password"
                        {...register("confirm")}
                      />
                    </Box>
                    {errors.confirm && (
                      <Box className="lp-field-error">
                        {resolveFieldError(errors.confirm, t)}
                      </Box>
                    )}
                  </Box>

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
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
