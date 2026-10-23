import type React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import NativeSelect from "@mui/material/NativeSelect";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { SxProps, Theme } from "@mui/material/styles";
import { FormField } from "@/components/ui/forms/FormField";

interface FormSelectFieldProps {
  id: string;
  label?: string;
  registration?: UseFormRegisterReturn;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  sx?: SxProps<Theme>;
  children: React.ReactNode;
}

export const FormSelectField: React.FC<FormSelectFieldProps> = ({
  id,
  label,
  registration,
  value,
  onValueChange,
  required,
  sx,
  children,
}) => {
  const { ref, ...field } = registration ?? {};
  const controlled = onValueChange
    ? {
        value,
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
          onValueChange(event.target.value),
      }
    : {};

  return (
    <FormField id={id} label={label} required={required} sx={sx}>
      <NativeSelect
        {...field}
        {...controlled}
        id={id}
        inputRef={ref}
        input={<OutlinedInput size="small" />}
      >
        {children}
      </NativeSelect>
    </FormField>
  );
};
