import { useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useApiError } from "@/hooks/useApiError";
import { useToast } from "@/hooks/useToast";

export function useApiErrorToast(fallbackKey: string) {
  const { t } = useI18n();
  const apiError = useApiError();
  const { showToast } = useToast();

  return useCallback(
    (err: unknown) => {
      showToast(apiError(err, t(fallbackKey)), "error");
    },
    [apiError, showToast, t, fallbackKey],
  );
}
