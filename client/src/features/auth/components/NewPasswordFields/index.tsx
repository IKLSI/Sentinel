import type React from "react";
import { useId, useState } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { PasswordTextField } from "@/components/ui/forms/PasswordTextField";
import { useT } from "@/contexts/I18nContext";

interface Props {
  labelPrefix: string;
  passwordRegistration: UseFormRegisterReturn;
  confirmRegistration: UseFormRegisterReturn;
  passwordError?: FieldError;
  confirmError?: FieldError;
  required?: boolean;
}

export const NewPasswordFields: React.FC<Props> = ({
  labelPrefix,
  passwordRegistration,
  confirmRegistration,
  passwordError,
  confirmError,
  required,
}) => {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const passwordId = useId();
  const confirmId = useId();

  return (
    <>
      <PasswordTextField
        id={passwordId}
        label={t(`${labelPrefix}.password_label`)}
        registration={passwordRegistration}
        error={passwordError}
        t={t}
        placeholder={t(`${labelPrefix}.password_placeholder`)}
        autoComplete="new-password"
        required={required}
        showPassword={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
        showLabel={t(`${labelPrefix}.password_show`)}
        hideLabel={t(`${labelPrefix}.password_hide`)}
      />

      <FormTextField
        id={confirmId}
        label={t(`${labelPrefix}.confirm_label`)}
        registration={confirmRegistration}
        error={confirmError}
        t={t}
        type={showPassword ? "text" : "password"}
        placeholder={t(`${labelPrefix}.confirm_placeholder`)}
        autoComplete="new-password"
        required={required}
      />
    </>
  );
};
