import { useCallback, useEffect, useRef, useState } from "react";
import { useScanProjectMutation } from "@/domains/projects/mutations";
import type { ProjectSummary } from "@/domains/projects/types";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";

export function useScanFeedback(projects: ProjectSummary[]) {
  const { showToast } = useToast();
  const t = useT();
  const onScanError = useApiErrorToast("projects.toast.scan_start_error");
  const { mutate: scanProject } = useScanProjectMutation();
  const [scanningIds, setScanningIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const baselinesRef = useRef(new Map<string, string | null>());

  const stopTracking = useCallback((id: string) => {
    baselinesRef.current.delete(id);
    setScanningIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const startScan = useCallback(
    (id: string) => {
      if (baselinesRef.current.has(id)) return;
      const project = projects.find((p) => p.id === id);
      baselinesRef.current.set(id, project?.lastScanAt ?? null);
      setScanningIds((current) => new Set(current).add(id));

      scanProject(
        { id },
        {
          onSuccess: () =>
            showToast(
              t("projects.toast.scan_started", { name: project?.name ?? "" }),
              "info",
            ),
          onError: (err) => {
            onScanError(err);
            stopTracking(id);
          },
        },
      );
    },
    [projects, showToast, t, scanProject, onScanError, stopTracking],
  );

  useEffect(() => {
    for (const [id, baseline] of baselinesRef.current) {
      const scanned = projects.find((p) => p.id === id);
      if (!scanned || (scanned.lastScanAt ?? null) === baseline) continue;

      stopTracking(id);
      if (scanned.lastScanError)
        showToast(
          t("projects.toast.scan_done_with_errors", { name: scanned.name }),
          "warning",
        );
      else
        showToast(
          t("projects.toast.scan_done", { name: scanned.name }),
          "success",
        );
    }
  }, [projects, stopTracking, showToast, t]);

  return { scanningIds, startScan };
}
