import type React from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { usePublicScan } from "@/features/publicScan/pages/ScanPage/hooks";
import { gradeColorOf } from "@/features/landing/helpers";
import { PANEL_SX } from "@/helpers/cardSx";
import { pluralKey } from "@/helpers/plural";

export const ScanPage: React.FC = () => {
  const t = useT();
  const { repositoryUrl, setRepositoryUrl, onSubmit, scanning, result } =
    usePublicScan();

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
            disabled={scanning}
            endIcon={
              scanning ? (
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
              ...PANEL_SX,
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
                  background: gradeColorOf(result.grade),
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
                    pluralKey(
                      "landing.cta.vulnerable",
                      result.vulnerableDependencyCount,
                    ),
                    {
                      count: result.vulnerableDependencyCount,
                      total: result.dependencyCount,
                    },
                  )}
                  {result.eolRuntimeCount > 0 &&
                    t(pluralKey("landing.cta.eol", result.eolRuntimeCount), {
                      count: result.eolRuntimeCount,
                    })}
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
