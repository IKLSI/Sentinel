import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import {
  PUBLIC_SCAN_DEFAULT_ERROR_KEY,
  PUBLIC_SCAN_ERROR_KEYS,
} from "@/domains/publicScan/constants";
import { usePublicScanMutation } from "@/domains/publicScan/mutations";
import { extractApiErrorCode } from "@/helpers/apiError";
import { useToast } from "@/hooks/useToast";

export const usePublicScan = () => {
  const t = useT();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { repo } = useSearch({ from: "/scan" });
  const [repositoryUrl, setRepositoryUrl] = useState(repo ?? "");
  const scanMutation = usePublicScanMutation();
  const scannedRepo = useRef<string | null>(null);
  const scanMutate = scanMutation.mutate;

  const runScan = useCallback(
    (url: string) =>
      scanMutate(
        { data: { repositoryUrl: url } },
        {
          onError: (err) => {
            const code = extractApiErrorCode(err)?.code;
            showToast(
              t(
                (code && PUBLIC_SCAN_ERROR_KEYS[code]) ||
                  PUBLIC_SCAN_DEFAULT_ERROR_KEY,
              ),
              "error",
            );
          },
        },
      ),
    [scanMutate, showToast, t],
  );

  useEffect(() => {
    if (!repo || scannedRepo.current === repo) return;
    scannedRepo.current = repo;
    setRepositoryUrl(repo);
    runScan(repo);
  }, [repo, runScan]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = repositoryUrl.trim();
    if (trimmed === repo) {
      runScan(trimmed);
      return;
    }
    navigate({ to: ROUTES.SCAN, search: { repo: trimmed } });
  };

  return {
    repositoryUrl,
    setRepositoryUrl,
    onSubmit,
    scanning: scanMutation.isPending,
    result: scanMutation.data,
  };
};
