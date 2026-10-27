import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { useResendVerificationMutation } from "@/domains/auth/mutations";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useApiError } from "@/hooks/useApiError";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const LOGIN_FOCUS_DELAY_MS = 750;

export function useLoginForm() {
  const { login } = useAuth();
  const resendVerificationMutation = useResendVerificationMutation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const t = useT();
  const apiError = useApiError();
  const onResendError = useApiErrorToast("auth.login.invalid_credentials");
  const {
    register,
    handleSubmit: handleFormSubmit,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFocus("email"), LOGIN_FOCUS_DELAY_MS);
    return () => clearTimeout(id);
  }, [setFocus]);

  const clearErrorOnChange = (
    field: UseFormRegisterReturn,
  ): UseFormRegisterReturn => ({
    ...field,
    onChange: async (e) => {
      const result = await field.onChange(e);
      setHasError(false);
      return result;
    },
  });

  const onSubmit = handleFormSubmit(async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate({ to: ROUTES.DASHBOARD });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 403) {
        setShowResend(true);
        showToast(apiError(err, t("auth.login.email_not_verified")), "warning");
      } else {
        setHasError(status === 401);
        showToast(
          apiError(
            err,
            status === 401
              ? t("auth.login.invalid_credentials")
              : t("auth.login.unexpected_error"),
          ),
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  });

  const handleResend = () => {
    const email = getValues("email");
    if (!email) {
      showToast(t("auth.login.email_required_for_resend"), "warning");
      return;
    }
    resendVerificationMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => showToast(t("auth.login.resend_done"), "success"),
        onError: onResendError,
      },
    );
  };

  return {
    register,
    errors,
    loading,
    hasError,
    showResend,
    clearErrorOnChange,
    onSubmit,
    handleResend,
  };
}
