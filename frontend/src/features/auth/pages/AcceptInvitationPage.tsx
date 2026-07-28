import type React from "react";
import { useState, useEffect, useRef, useId } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { useAcceptInvitation } from "../../users/hooks/useUsers";
import { useToast } from "../../../hooks/useToast";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";
import { extractApiError } from "../../../utils/apiError";
import { ROUTES } from "@/constants/routes";

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();
  const token = searchParams.get("token") ?? "";

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

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const acceptInvitationMutation = useAcceptInvitation();
  const loading = acceptInvitationMutation.isPending;
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameId = useId();
  const lastNameId = useId();
  const passwordId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (!token) navigate(ROUTES.LOGIN, { replace: true });
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, [token, navigate]);

  useEffect(() => {
    if (mounted) setTimeout(() => firstNameRef.current?.focus(), 700);
  }, [mounted]);

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      showToast(
        t("auth.accept_invitation.error_firstname_required"),
        "warning",
      );
      return;
    }
    if (
      form.password.length < 12 ||
      !/[a-z]/.test(form.password) ||
      !/[A-Z]/.test(form.password) ||
      !/\d/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    ) {
      showToast(
        t("auth.accept_invitation.error_password_min_length"),
        "warning",
      );
      return;
    }
    if (form.password !== form.confirm) {
      showToast(
        t("auth.accept_invitation.error_passwords_mismatch"),
        "warning",
      );
      return;
    }
    acceptInvitationMutation.mutate(
      {
        token,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3500);
        },
        onError: (err) =>
          showToast(
            extractApiError(
              err,
              t("auth.accept_invitation.error_invalid_token"),
            ),
            "error",
          ),
      },
    );
  };

  const isValid = form.firstName.trim() && form.password && form.confirm;

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

                <form onSubmit={handleSubmit} noValidate>
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
                        ref={firstNameRef}
                        type="text"
                        className="lp-input"
                        value={form.firstName}
                        onChange={set("firstName")}
                        placeholder={t(
                          "auth.accept_invitation.firstname_placeholder",
                        )}
                        autoComplete="given-name"
                        required
                      />
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
                        value={form.lastName}
                        onChange={set("lastName")}
                        placeholder={t(
                          "auth.accept_invitation.lastname_placeholder",
                        )}
                        autoComplete="family-name"
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
                        className="lp-input"
                        value={form.password}
                        onChange={set("password")}
                        placeholder={t(
                          "auth.accept_invitation.password_placeholder",
                        )}
                        autoComplete="new-password"
                        sx={{ paddingRight: "44px" }}
                        required
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
                        className="lp-input"
                        value={form.confirm}
                        onChange={set("confirm")}
                        placeholder={t(
                          "auth.accept_invitation.confirm_placeholder",
                        )}
                        autoComplete="new-password"
                        required
                      />
                    </Box>
                  </Box>

                  <button
                    type="submit"
                    className="lp-submit"
                    disabled={loading || !isValid}
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
