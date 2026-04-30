import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { acceptInvitation } from "../../users/api/users";
import { useToast } from "../../../hooks/useToast";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";
import { extractApiError } from "../../../utils/apiError";

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
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
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
    if (form.password.length < 8) {
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
    setLoading(true);
    try {
      await acceptInvitation({
        token,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 3500);
    } catch (err) {
      showToast(extractApiError(err, t("auth.accept_invitation.error_invalid_token")), "error");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.firstName.trim() && form.password && form.confirm;

  return (
    <Box className="aip-root">
      <Box className="aip-card">
        <Box className="aip-left">
          <Box className="aip-noise" aria-hidden />

          <Box className="aip-decor" aria-hidden>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 450 600"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="aip-glow-tr" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(165,180,252,0.2)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="450" cy="0" r="160" fill="url(#aip-glow-tr)" />
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

          <Box className="aip-logo">
            <Box className="aip-logo-mark">
              <SentinelLogo width={20} height={23} />
            </Box>
            <Box className="aip-logo-text">
              {t("auth.accept_invitation.brand")}
            </Box>
          </Box>

          <Box className="aip-body">
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
                  key={i}
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
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M6 14l6 6 10-10"
                      stroke="#6366f1"
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
                        htmlFor="aip-firstname"
                      >
                        {t("auth.accept_invitation.firstname_label")}{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </Box>
                      <input
                        id="aip-firstname"
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
                        htmlFor="aip-lastname"
                      >
                        {t("auth.accept_invitation.lastname_label")}
                      </Box>
                      <input
                        id="aip-lastname"
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
                      htmlFor="aip-password"
                    >
                      {t("auth.accept_invitation.password_label")}{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="aip-password"
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
                      htmlFor="aip-confirm"
                    >
                      {t("auth.accept_invitation.confirm_label")}{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </Box>
                    <Box className="lp-input-wrap">
                      <Box
                        component="input"
                        id="aip-confirm"
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
                  >
                    {loading ? (
                      <Box className="lp-submit-loader" />
                    ) : (
                      <>
                        {t("auth.accept_invitation.submit")}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3 8h10M9 4l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </>
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
