import type React from "react";
import { useState, useEffect, useRef, useId } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { useResetPasswordMutation } from "../hooks/useAuthMutations";
import { useToast } from "../../../hooks/useToast";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";
import { extractApiError } from "../../../utils/apiError";
import { ROUTES } from "@/constants/routes";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const resetPasswordMutation = useResetPasswordMutation();
  const loading = resetPasswordMutation.isPending;
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const glowId = useId();
  const passwordId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (!token) navigate(ROUTES.LOGIN, { replace: true });
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, [token, navigate]);

  useEffect(() => {
    if (mounted) setTimeout(() => passwordRef.current?.focus(), 700);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      password.length < 12 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      showToast(t("auth.reset_password.error_password_min_length"), "warning");
      return;
    }
    if (password !== confirm) {
      showToast(t("auth.reset_password.error_passwords_mismatch"), "warning");
      return;
    }
    resetPasswordMutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3500);
        },
        onError: (err) =>
          showToast(
            extractApiError(err, t("auth.reset_password.error_invalid_token")),
            "error",
          ),
      },
    );
  };

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
            <Box className="lp-logo-mark">
              <SentinelLogo width={20} height={23} />
            </Box>
            <Box className="lp-logo-wordmark">
              {t("auth.reset_password.brand")}
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
                  {t("auth.reset_password.success_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.reset_password.success_line1")}
                  <br />
                  {t("auth.reset_password.success_line2")}
                </Box>
              </Box>
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

                <form onSubmit={handleSubmit} noValidate>
                  <Box className="lp-field">
                    <Box
                      component="label"
                      className="lp-label"
                      htmlFor={passwordId}
                    >
                      {t("auth.reset_password.password_label")}
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id={passwordId}
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        className="lp-input"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPassword(e.target.value)
                        }
                        placeholder={t(
                          "auth.reset_password.password_placeholder",
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
                            ? t("auth.reset_password.password_hide")
                            : t("auth.reset_password.password_show")
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
                      {t("auth.reset_password.confirm_label")}
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id={confirmId}
                        type={showPassword ? "text" : "password"}
                        className="lp-input"
                        value={confirm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setConfirm(e.target.value)
                        }
                        placeholder={t(
                          "auth.reset_password.confirm_placeholder",
                        )}
                        autoComplete="new-password"
                        required
                      />
                    </Box>
                  </Box>

                  <button
                    type="submit"
                    className="lp-submit"
                    disabled={loading || !password || !confirm}
                  >
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      t("auth.reset_password.submit")
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
