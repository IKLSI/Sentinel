import { useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { extractApiErrorCode } from "@/helpers/apiError";

export const useApiError = () => {
  const { t } = useI18n();

  return useCallback(
    (err: unknown, fallback: string): string => {
      const translation = extractApiErrorCode(err);

      if (!translation) return fallback;

      const message = t(translation.code, translation.params);

      return message === translation.code ? fallback : message;
    },
    [t],
  );
};
