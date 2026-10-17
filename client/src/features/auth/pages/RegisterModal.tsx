import type React from "react";
import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { AppModal } from "@/components/ui/common/AppModal";
import { ModalFormField } from "@/features/auth/components/ModalFormField";
import { ModalPasswordField } from "@/features/auth/components/ModalPasswordField";
import { AuthModalSuccess } from "@/features/auth/components/AuthSuccessPanel";
import {
  useRegisterMutation,
  useResendVerificationMutation,
} from "@/domains/auth/mutations";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ROUTES } from "@/constants/routes";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

const LEGAL_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
  sx: {
    color: "var(--accent)",
    fontWeight: 600,
    textDecoration: "none",
    "&:hover": { textDecoration: "underline" },
  },
} as const;

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
  const formId = useId();
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

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("auth.register.form_title")}
      actions={
        done ? (
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              onClick={handleResend}
              disabled={resendVerificationMutation.isPending}
              sx={{ mr: "auto" }}
            >
              {t("auth.register.resend_link")}
            </Button>
            <Button variant="contained" size="small" onClick={onClose}>
              {t("common.close")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              type="submit"
              form={formId}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
              ) : (
                t("auth.register.submit")
              )}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <AuthModalSuccess
          title={t("auth.register.success_title")}
          subtitle={t("auth.register.success_sub")}
        />
      ) : (
        <Box
          component="form"
          id={formId}
          onSubmit={onSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <ModalFormField
            id={orgId}
            label={t("auth.register.organization_label")}
            registration={register("organizationName")}
            error={errors.organizationName}
            t={t}
            placeholder={t("auth.register.organization_placeholder")}
            autoComplete="organization"
            required
          />

          <Box sx={{ display: "flex", gap: "14px" }}>
            <ModalFormField
              id={firstNameId}
              label={t("auth.register.firstname_label")}
              registration={register("firstName")}
              error={errors.firstName}
              t={t}
              placeholder={t("auth.register.firstname_placeholder")}
              autoComplete="given-name"
              required
              sx={{ flex: 1, minWidth: 0 }}
            />
            <ModalFormField
              id={lastNameId}
              label={t("auth.register.lastname_label")}
              registration={register("lastName")}
              error={errors.lastName}
              t={t}
              placeholder={t("auth.register.lastname_placeholder")}
              autoComplete="family-name"
              required
              sx={{ flex: 1, minWidth: 0 }}
            />
          </Box>

          <ModalFormField
            id={emailId}
            label={t("auth.register.email_label")}
            registration={register("email")}
            error={errors.email}
            t={t}
            type="email"
            placeholder={t("auth.register.email_placeholder")}
            autoComplete="email"
            required
          />

          <ModalPasswordField
            id={passwordId}
            label={t("auth.register.password_label")}
            registration={register("password")}
            error={errors.password}
            t={t}
            placeholder={t("auth.register.password_placeholder")}
            autoComplete="new-password"
            required
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            showLabel={t("auth.register.password_show")}
            hideLabel={t("auth.register.password_hide")}
          />

          <Box
            sx={{
              fontSize: "11.5px",
              lineHeight: 1.7,
              color: "var(--muted2)",
            }}
          >
            {t("legal.consent.prefix")}{" "}
            <Box component="a" href={ROUTES.PRIVACY} {...LEGAL_LINK_PROPS}>
              {t("legal.consent.privacy")}
            </Box>
            .
          </Box>
        </Box>
      )}
    </AppModal>
  );
};
