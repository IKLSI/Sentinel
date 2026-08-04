import type React from "react";
import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import { AppModal } from "@/components/ui/common/AppModal";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthPasswordField } from "@/features/auth/components/AuthPasswordField";
import { AuthModalSuccess } from "@/features/auth/components/AuthSuccessPanel";
import {
  useRegisterMutation,
  useResendVerificationMutation,
} from "@/domains/auth/mutations";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM: RegisterFormValues = {
  organizationName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

export const RegisterModal: React.FC<RegisterModalProps> = ({
  open,
  onClose,
}) => {
  const { showToast } = useToast();
  const t = useT();
  const onError = useApiErrorToast("auth.register.error_generic");
  const {
    register,
    handleSubmit: handleFormSubmit,
    getValues,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: EMPTY_FORM,
  });
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegisterMutation();
  const resendVerificationMutation = useResendVerificationMutation();
  const loading = registerMutation.isPending;
  const [done, setDone] = useState(false);
  const orgId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (open) {
      reset(EMPTY_FORM);
      setShowPassword(false);
      setDone(false);
      setTimeout(() => setFocus("organizationName"), 150);
    }
  }, [open, reset, setFocus]);

  const onSubmit = handleFormSubmit((data) => {
    registerMutation.mutate(
      { data },
      { onSuccess: () => setDone(true), onError },
    );
  });

  const handleResend = () => {
    resendVerificationMutation.mutate(
      { data: { email: getValues("email") } },
      {
        onSuccess: () => showToast(t("auth.register.resend_done"), "success"),
        onError,
      },
    );
  };

  const fieldStyle = { animation: "none !important", opacity: "1 !important" };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("auth.register.form_title")}
      maxWidthPx="460px"
      closeButton
      backdropVariant="auth"
    >
      {done ? (
        <AuthModalSuccess
          title={t("auth.register.success_title")}
          subtitle={t("auth.register.success_sub")}
          actionLabel="OK"
          onAction={onClose}
          actionClassName="lp-submit no-elevation"
          actionStyle={{
            marginBottom: "12px",
            animation: "none",
            opacity: 1,
          }}
        >
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
        </AuthModalSuccess>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <AuthFormField
            id={orgId}
            label={t("auth.register.organization_label")}
            registration={register("organizationName")}
            error={errors.organizationName}
            t={t}
            placeholder={t("auth.register.organization_placeholder")}
            autoComplete="organization"
            sx={fieldStyle}
          />

          <Box sx={{ display: "flex", gap: "12px" }}>
            <AuthFormField
              id={firstNameId}
              label={t("auth.register.firstname_label")}
              registration={register("firstName")}
              error={errors.firstName}
              t={t}
              placeholder={t("auth.register.firstname_placeholder")}
              autoComplete="given-name"
              sx={{ flex: 1, ...fieldStyle }}
            />
            <AuthFormField
              id={lastNameId}
              label={t("auth.register.lastname_label")}
              registration={register("lastName")}
              error={errors.lastName}
              t={t}
              placeholder={t("auth.register.lastname_placeholder")}
              autoComplete="family-name"
              sx={{ flex: 1, ...fieldStyle }}
            />
          </Box>

          <AuthFormField
            id={emailId}
            label={t("auth.register.email_label")}
            registration={register("email")}
            error={errors.email}
            t={t}
            type="email"
            placeholder={t("auth.register.email_placeholder")}
            autoComplete="email"
            sx={fieldStyle}
          />

          <AuthPasswordField
            id={passwordId}
            label={t("auth.register.password_label")}
            registration={register("password")}
            error={errors.password}
            t={t}
            placeholder={t("auth.register.password_placeholder")}
            autoComplete="new-password"
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            showLabel={t("auth.register.password_show")}
            hideLabel={t("auth.register.password_hide")}
            sx={fieldStyle}
          />

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
    </AppModal>
  );
};
