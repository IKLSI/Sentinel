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
  return (
    <Box sx={{ py: "12px" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: success ? "var(--accent)" : "var(--red)",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {success ? (
          <CheckCircleOutlined sx={{ fontSize: 20 }} />
        ) : (
          <WarningAmberOutlined sx={{ fontSize: 20 }} />
        )}
        {success ? t("remediation.success") : t("remediation.failed")}
      </Box>

      {!success && result.error && (
        <Box sx={{ mt: "8px", fontSize: "12px", color: "var(--muted)" }}>
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
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            mt: "12px",
            fontSize: "13px",
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          <OpenInNewOutlined sx={{ fontSize: 15 }} />
          {t("remediation.view_pr")}
        </Box>
      )}
    </Box>
  );
};
