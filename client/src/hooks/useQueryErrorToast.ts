import { useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/useToast";

export function useQueryErrorToast(failed: boolean, messageKey: string) {
  const { t } = useI18n();
  const { showToast } = useToast();

  useEffect(() => {
    if (failed) showToast(t(messageKey), "error");
  }, [failed, messageKey, showToast, t]);
}
