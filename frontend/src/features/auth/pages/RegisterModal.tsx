import type React from "react";
import { useState, useRef, useEffect, useId } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { register, resendVerification } from "../api/auth";
import { useToast } from "../../../hooks/useToast";
import { useT } from "../../../i18n/I18nContext";
import { extractApiError } from "../../../utils/apiError";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  open,
  onClose,
}) => {
  const { showToast } = useToast();
  const t = useT();
  const [organizationName, setOrganizationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const orgRef = useRef<HTMLInputElement>(null);
  const orgId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (open) {
      setOrganizationName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setDone(false);
      setTimeout(() => orgRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName || !firstName || !lastName || !email || !password) {
      showToast(t("auth.register.fill_all_fields"), "warning");
      return;
    }
    setLoading(true);
    try {
      await register({
        organizationName,
        firstName,
        lastName,
        email,
        password,
      });
      setDone(true);
    } catch (err) {
      showToast(
        extractApiError(err, t("auth.register.error_generic")),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(email);
      showToast(t("auth.register.resend_done"), "success");
    } catch (err) {
      showToast(
        extractApiError(err, t("auth.register.error_generic")),
        "error",
      );
    }
  };

  const fieldStyle = { animation: "none !important", opacity: "1 !important" };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            m: "24px",
            width: "calc(100% - 48px)",
            maxWidth: "460px",
          },
        },
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            background: "color-mix(in srgb, var(--auth-bg) 75%, transparent)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          p: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {t("auth.register.form_title")}
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 24,
            height: 24,
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--border)",
            background: "var(--s1)",
            color: "var(--muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            "&:hover": { background: "var(--s2)", color: "var(--text)" },
          }}
          aria-label="Fermer"
        >
          ×
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "20px !important", pb: "24px" }}>
        {done ? (
          <Box sx={{ textAlign: "center", py: "8px" }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-md)",
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: "14px",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10l4 4 8-8"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
            <Box
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                mb: "5px",
              }}
            >
              {t("auth.register.success_title")}
            </Box>
            <Box
              sx={{
                fontSize: "12.5px",
                color: "var(--muted2)",
                lineHeight: 1.65,
                mb: "18px",
              }}
            >
              {t("auth.register.success_sub")}
            </Box>
            <button
              type="button"
              className="lp-submit no-elevation"
              onClick={onClose}
              style={{ marginBottom: "12px", animation: "none", opacity: 1 }}
            >
              OK
            </button>
            <Box sx={{ textAlign: "center", mt: "10px" }}>
              <Box
                component="button"
                type="button"
                onClick={handleResend}
                sx={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--muted2)",
                  "&:hover": { color: "var(--text)" },
                }}
              >
                {t("auth.register.resend_link")}
              </Box>
            </Box>
          </Box>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Box className="lp-field" sx={fieldStyle}>
              <Box component="label" className="lp-label" htmlFor={orgId}>
                {t("auth.register.organization_label")}
              </Box>
              <input
                id={orgId}
                ref={orgRef}
                type="text"
                className="lp-input"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={t("auth.register.organization_placeholder")}
                autoComplete="organization"
                required
              />
            </Box>

            <Box sx={{ display: "flex", gap: "12px" }}>
              <Box className="lp-field" sx={{ flex: 1, ...fieldStyle }}>
                <Box
                  component="label"
                  className="lp-label"
                  htmlFor={firstNameId}
                >
                  {t("auth.register.firstname_label")}
                </Box>
                <input
                  id={firstNameId}
                  type="text"
                  className="lp-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("auth.register.firstname_placeholder")}
                  autoComplete="given-name"
                  required
                />
              </Box>
              <Box className="lp-field" sx={{ flex: 1, ...fieldStyle }}>
                <Box
                  component="label"
                  className="lp-label"
                  htmlFor={lastNameId}
                >
                  {t("auth.register.lastname_label")}
                </Box>
                <input
                  id={lastNameId}
                  type="text"
                  className="lp-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("auth.register.lastname_placeholder")}
                  autoComplete="family-name"
                  required
                />
              </Box>
            </Box>

            <Box className="lp-field" sx={fieldStyle}>
              <Box component="label" className="lp-label" htmlFor={emailId}>
                {t("auth.register.email_label")}
              </Box>
              <input
                id={emailId}
                type="email"
                className="lp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.register.email_placeholder")}
                autoComplete="email"
                required
              />
            </Box>

            <Box className="lp-field" sx={fieldStyle}>
              <Box component="label" className="lp-label" htmlFor={passwordId}>
                {t("auth.register.password_label")}
              </Box>
              <Box className="lp-input-wrap">
                <Box
                  component="input"
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  className="lp-input"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder={t("auth.register.password_placeholder")}
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
                      ? t("auth.register.password_hide")
                      : t("auth.register.password_show")
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

            <button
              type="submit"
              className="lp-submit no-elevation"
              disabled={loading}
              style={{ marginTop: "4px", animation: "none", opacity: 1 }}
            >
              {loading ? (
                <Box className="lp-submit-loader" />
              ) : (
                t("auth.register.submit")
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
