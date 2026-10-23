import { useCallback, useEffect, useRef, useState } from "react";
import { useScanProjectMutation } from "@/domains/projects/mutations";
import type { ProjectSummary } from "@/domains/projects/types";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";
import { SCAN_FEEDBACK_TIMEOUT_MS } from "@/features/projects/pages/ProjectsPage/constants";

export function useScanFeedback(projects: ProjectSummary[]) {
  const { showToast } = useToast();
  const t = useT();
  const onScanError = useApiErrorToast("projects.toast.scan_start_error");
  const { mutate: scanProject } = useScanProjectMutation();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanBaselineRef = useRef<string | null>(null);
  const scanningIdRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    },
    [],
  );

  const stopScanFeedback = useCallback(() => {
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = null;
    scanningIdRef.current = null;
    setScanningId(null);
  }, []);

  const startScan = useCallback(
    (id: string) => {
      if (scanningIdRef.current) return;
      scanBaselineRef.current =
        projects.find((p) => p.id === id)?.lastScanAt ?? null;
      scanningIdRef.current = id;
      setScanningId(id);

      scanProject(
        { id },
        {
          onSuccess: () => {
            if (scanningIdRef.current !== id) return;
            showToast(t("projects.toast.scan_started"), "info");
            scanTimeoutRef.current = setTimeout(() => {
              stopScanFeedback();
              showToast(t("projects.toast.scan_timeout"), "warning");
            }, SCAN_FEEDBACK_TIMEOUT_MS);
          },
          onError: (err) => {
            onScanError(err);
            stopScanFeedback();
          },
        },
      );
    },
    [projects, showToast, t, scanProject, onScanError, stopScanFeedback],
  );

  useEffect(() => {
    if (!scanningId) return;
    const scanned = projects.find((p) => p.id === scanningId);
    if (!scanned || (scanned.lastScanAt ?? null) === scanBaselineRef.current)
      return;

    stopScanFeedback();
    if (scanned.lastScanError)
      showToast(t("projects.toast.scan_done_with_errors"), "warning");
    else showToast(t("projects.toast.scan_done"), "success");
  }, [projects, scanningId, stopScanFeedback, showToast, t]);

  return { scanningId, startScan };
}
