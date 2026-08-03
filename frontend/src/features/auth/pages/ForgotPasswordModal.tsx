import type React from "react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import { AppModal } from "@/components/ui/common/AppModal";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { AuthModalSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { useForgotPasswordMutation } from "@/domains/auth/mutations";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  onClose,
}) => {
  const t = useT();
  const onError = useApiErrorToast("auth.forgot_password.error_generic");
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
    forgotPasswordMutation.mutate(
      { data: { email: data.email } },
      { onSuccess: () => setDone(true), onError },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("auth.forgot_password.form_title")}
      maxWidthPx="400px"
      closeButton
      backdropVariant="auth"
    >
      {done ? (
        <AuthModalSuccess
          title={t("auth.forgot_password.success_title")}
          subtitle={t("auth.forgot_password.success_sub")}
          actionLabel="OK"
          onAction={onClose}
        />
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <AuthFormField
            id={emailId}
            label={t("auth.forgot_password.email_label")}
            registration={register("email")}
            error={errors.email}
            t={t}
            type="email"
            placeholder={t("auth.forgot_password.email_placeholder")}
            autoComplete="email"
            sx={{ animation: "none !important", opacity: "1 !important" }}
          />

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
    </AppModal>
  );
};
