import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import {
  PUBLIC_SCAN_DEFAULT_ERROR_KEY,
  PUBLIC_SCAN_ERROR_KEYS,
} from "@/domains/publicScan/constants";
import { usePublicScanMutation } from "@/domains/publicScan/mutations";
import { gradeColorOf } from "@/features/landing/helpers";
import { extractApiErrorCode } from "@/helpers/apiError";
import { useToast } from "@/hooks/useToast";

export const ScanPage: React.FC = () => {
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

  const result = scanMutation.data;
  const gradeColor = gradeColorOf(result?.grade);
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--text)",
        px: { xs: "16px", md: "32px" },
        py: { xs: "24px", md: "48px" },
      }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Box
          component={Link}
          to={ROUTES.HOME}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            mb: "32px",
            color: "var(--text)",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          <SentinelWordmark height={18} />
        </Box>

        <Box component="h1" sx={{ m: 0, mb: "8px", fontSize: "28px" }}>
          {t("public_scan.title")}
        </Box>
        <Box
          component="p"
          sx={{ m: 0, mb: "24px", color: "var(--text-secondary)" }}
        >
          {t("public_scan.subtitle")}
        </Box>

        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "flex", gap: "8px", mb: "32px" }}
        >
          <TextField
            fullWidth
            required
            size="small"
            type="url"
            placeholder="https://github.com/org/repo"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={scanMutation.isPending}
            endIcon={
              scanMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ArrowForwardOutlined sx={{ fontSize: 18 }} />
              )
            }
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {t("landing.cta.scan_button")}
          </Button>
        </Box>

        {result && (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              p: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "20px",
                  background: gradeColor,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "34px",
                  flexShrink: 0,
                }}
              >
                {result.grade}
              </Box>
              <Box>
                <Box sx={{ fontSize: "20px", fontWeight: 800 }}>
                  {t("landing.cta.score", { score: result.score })}
                </Box>
                <Box
                  sx={{ fontSize: "13.5px", color: "var(--text-secondary)" }}
                >
                  {t(
                    result.vulnerableDependencyCount === 1
                      ? "landing.cta.vulnerable_one"
                      : "landing.cta.vulnerable_other",
                    {
                      count: result.vulnerableDependencyCount,
                      total: result.dependencyCount,
                    },
                  )}
                  {result.eolRuntimeCount > 0 &&
                    t(
                      result.eolRuntimeCount === 1
                        ? "landing.cta.eol_one"
                        : "landing.cta.eol_other",
                      { count: result.eolRuntimeCount },
                    )}
                </Box>
              </Box>
            </Box>

            <Button
              component={Link}
              to={ROUTES.LOGIN}
              variant="outlined"
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 18 }} />}
              sx={{ alignSelf: "flex-start" }}
            >
              {t("landing.cta.create_account")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};
