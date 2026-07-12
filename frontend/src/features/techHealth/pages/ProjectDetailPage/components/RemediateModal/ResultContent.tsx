import type React from "react";
import Box from "@mui/material/Box";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import type { RemediationResultDto } from "@/features/techHealth/api/remediation";
import { STATUS_SUCCESS } from "./constants";

interface Props {
  result: RemediationResultDto;
  t: (key: string) => string;
}

export const ResultContent: React.FC<Props> = ({ result, t }) => {
  const success = result.status === STATUS_SUCCESS;
  const accent = success ? "var(--accent)" : "var(--red)";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: "20px" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: `color-mix(in srgb, ${accent} 14%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
          mb: "12px",
        }}
      >
        {success ? (
          <CheckCircleOutlined sx={{ fontSize: 24, color: accent }} />
        ) : (
          <WarningAmberOutlined sx={{ fontSize: 24, color: accent }} />
        )}
      </Box>

      <Box sx={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
        {success ? t("remediation.success") : t("remediation.failed")}
      </Box>

      {!success && result.error && (
        <Box
          sx={{
            mt: "10px",
            p: "8px 12px",
            borderRadius: "var(--r)",
            background: "color-mix(in srgb, var(--red) 8%, transparent)",
            color: "var(--muted)",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          {result.error}
        </Box>
      )}

      {success && result.pullRequestUrl && (
        <Box
          component="a"
          href={result.pullRequestUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            mt: "16px",
            px: "14px",
            py: "8px",
            width: "100%",
            justifyContent: "center",
            borderRadius: "var(--r)",
            border: "1px solid var(--border)",
            background: "var(--s2)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
            transition: "all 0.12s",
            "&:hover": {
              borderColor: "var(--accent-border)",
              background: "var(--accent-subtle)",
            },
          }}
        >
          <OpenInNewOutlined sx={{ fontSize: 15 }} />
          {t("remediation.view_pr")}
        </Box>
      )}
    </Box>
  );
};
