import type { FieldErrors } from "react-hook-form";
import { useT } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/useToast";

export const useWarnFirstError = () => {
  const { showToast } = useToast();
  const t = useT();
  return (errors: FieldErrors) => {
    const message = Object.values(errors)[0]?.message;
    if (typeof message === "string") showToast(t(message), "warning");
  };
};
