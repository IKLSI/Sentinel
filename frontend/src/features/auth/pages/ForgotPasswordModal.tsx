import type React from "react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import { useForgotPasswordMutation } from "../hooks/useAuthMutations";
import { useToast } from "../../../hooks/useToast";
import { useT } from "../../../i18n/I18nContext";
import { useApiError } from "@/hooks/useApiError";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas";
import { resolveFieldError } from "@/lib/validation/resolveFieldError";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  onClose,
}) => {
  const { showToast } = useToast();
  const t = useT();
  const apiError = useApiError();
  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const forgotPasswordMutation = useForgotPasswordMutation();
  const loading = forgotPasswordMutation.isPending;
  const emailId = useId();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      reset({ email: "" });
      setTimeout(() => setFocus("email"), 150);
    }
  }, [open, reset, setFocus]);

  const onSubmit = handleFormSubmit((data) => {
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => setDone(true),
      onError: (err) =>
        showToast(
          apiError(err, t("auth.forgot_password.error_generic")),
          "error",
        ),
    });
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
            maxWidth: "400px",
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
        {t("auth.forgot_password.form_title")}
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
              {t("auth.forgot_password.success_title")}
            </Box>
            <Box
              sx={{
                fontSize: "12.5px",
                color: "var(--muted2)",
                lineHeight: 1.65,
                mb: "18px",
              }}
            >
              {t("auth.forgot_password.success_sub")}
            </Box>
            <button
              type="button"
              className="lp-submit"
              onClick={onClose}
              style={{ animation: "none", opacity: 1 }}
            >
              OK
            </button>
          </Box>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <Box
              className="lp-field"
              sx={{ animation: "none !important", opacity: "1 !important" }}
            >
              <Box component="label" className="lp-label" htmlFor={emailId}>
                {t("auth.forgot_password.email_label")}
              </Box>
              <input
                id={emailId}
                type="email"
                className={`lp-input${errors.email ? " lp-input--error" : ""}`}
                placeholder={t("auth.forgot_password.email_placeholder")}
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <Box className="lp-field-error">
                  {resolveFieldError(errors.email, t)}
                </Box>
              )}
            </Box>

            <button
              type="submit"
              className="lp-submit"
              disabled={loading}
              style={{ marginTop: "4px", animation: "none", opacity: 1 }}
            >
              {loading ? (
                <Box className="lp-submit-loader" />
              ) : (
                t("auth.forgot_password.submit")
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
