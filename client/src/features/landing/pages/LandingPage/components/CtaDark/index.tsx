import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import { ROUTES } from "@/constants/routes";
import { DISPLAYED_GRADES } from "@/features/landing/constants";
import { gradeColorOf } from "@/features/landing/helpers";
import {
  PUBLIC_SCAN_DEFAULT_ERROR_KEY,
  PUBLIC_SCAN_ERROR_KEYS,
} from "@/domains/publicScan/constants";
import { usePublicScanMutation } from "@/domains/publicScan/mutations";
import type { PublicScanResponse } from "@/domains/publicScan/types";
import { useToast } from "@/hooks/useToast";
import { extractApiErrorCode } from "@/helpers/apiError";
import { useT } from "@/contexts/I18nContext";

export const CtaDark = () => {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [result, setResult] = useState<PublicScanResponse | null>(null);
  const scanMutation = usePublicScanMutation();
  const { showToast } = useToast();
  const t = useT();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    scanMutation.mutate(
      { data: { repositoryUrl } },
      {
        onSuccess: (response) => setResult(response),
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
    );
  };

  return (
    <Box
      component="section"
      id="essai"
      sx={{
        minHeight: "100dvh",
        scrollMarginTop: "88px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: "64px", md: "96px" },
        px: { xs: "16px", md: "32px" },
        background: "#f0f9ff",
      }}
    >
      <Box
        sx={{
          position: "relative",
          maxWidth: 1160,
          mx: "auto",
          width: "100%",
          overflow: "hidden",
          background: "linear-gradient(180deg, var(--s1) 0%, var(--s2) 100%)",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh-3)",
          borderRadius: "32px",
          p: { xs: "56px 24px", md: "96px 40px" },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 640px 320px at 50% 0%, var(--accent-subtle) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: { xs: "6px", sm: "10px", md: "14px" },
            mb: "40px",
          }}
        >
          {DISPLAYED_GRADES.map(([letter, color], index) => {
            const distanceFromCenter = Math.abs(
              index - (DISPLAYED_GRADES.length - 1) / 2,
            );
            const mobileSize = 38 - distanceFromCenter * 4;
            const desktopSize = 60 - distanceFromCenter * 6;
            const isActive = result?.grade === letter;
            return (
              <Box
                key={letter}
                sx={{
                  width: { xs: mobileSize, md: desktopSize },
                  height: { xs: mobileSize, md: desktopSize },
                  borderRadius: { xs: "12px", md: "16px" },
                  background: `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 70%, black) 100%)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: {
                    xs: `${14 + (mobileSize - 30) * 0.28}px`,
                    md: `${16 + (desktopSize - 44) * 0.28}px`,
                  },
                  flexShrink: 0,
                  boxShadow: isActive
                    ? `0 0 0 4px color-mix(in srgb, ${color} 35%, transparent), 0 12px 24px -8px color-mix(in srgb, ${color} 65%, transparent)`
                    : `0 12px 24px -8px color-mix(in srgb, ${color} 65%, transparent)`,
                  opacity: result && !isActive ? 0.35 : 1,
                }}
              >
                {letter}
              </Box>
            );
          })}
        </Box>

        <Box
          component="h2"
          sx={{
            position: "relative",
            m: 0,
            fontSize: { xs: "40px", md: "72px" },
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 0.98,
            mb: "20px",
            color: "var(--text)",
          }}
        >
          {t("landing.cta.title")}
        </Box>
        <Box
          component="p"
          sx={{
            position: "relative",
            m: "0 auto 32px",
            maxWidth: 460,
            fontSize: "16.5px",
            color: "var(--text-secondary)",
            lineHeight: 1.55,
          }}
        >
          {t("landing.cta.subtitle")}
        </Box>

        {result ? (
          <Box sx={{ position: "relative", maxWidth: 460, mx: "auto" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                mb: "24px",
                flexWrap: "wrap",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "20px",
                  background: gradeColorOf(result?.grade),
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
              <Box sx={{ textAlign: "left" }}>
                <Box
                  sx={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
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

            <Box
              sx={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                component={Link}
                to={ROUTES.LOGIN}
                variant="contained"
                size="large"
                endIcon={<ArrowForwardOutlined sx={{ fontSize: 18 }} />}
                sx={{
                  px: "28px",
                  py: "13px",
                  fontSize: "15px",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "0 12px 32px -8px var(--accent-border)",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {t("landing.cta.create_account")}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ position: "relative", maxWidth: 520, mx: "auto" }}>
            <Box
              component="form"
              onSubmit={onSubmit}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: "8px", sm: "6px" },
                flexDirection: { xs: "column", sm: "row" },
                p: "6px",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: { xs: "20px", sm: "999px" },
                boxShadow: "var(--sh-2)",
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:focus-within": {
                  borderColor: "var(--accent)",
                  boxShadow: "0 0 0 4px var(--accent-subtle)",
                },
              }}
            >
              <TextField
                fullWidth
                required
                type="url"
                placeholder="https://github.com/org/repo"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                variant="standard"
                slotProps={{ input: { disableUnderline: true } }}
                sx={{
                  flex: 1,
                  px: { xs: "12px", sm: "16px" },
                  "& .MuiInputBase-input": {
                    fontSize: "15px",
                    py: "10px",
                  },
                  "& .MuiInputBase-input:focus": {
                    outline: "none",
                    boxShadow: "none",
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={scanMutation.isPending}
                endIcon={
                  scanMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ArrowForwardOutlined sx={{ fontSize: 18 }} />
                  )
                }
                sx={{
                  px: "26px",
                  py: "11px",
                  fontSize: "15px",
                  borderRadius: { xs: "14px", sm: "999px" },
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {t("landing.cta.scan_button")}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
