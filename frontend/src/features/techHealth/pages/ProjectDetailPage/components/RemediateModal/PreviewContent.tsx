import type React from "react";
import Box from "@mui/material/Box";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import type { RemediationPreviewDto } from "@/features/techHealth/api/remediation";

interface Props {
  preview: RemediationPreviewDto;
  t: (key: string) => string;
}

export const PreviewContent: React.FC<Props> = ({ preview, t }) => (
  <Box>
    {preview.hasBreakingChanges && (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          p: "8px 12px",
          mb: "12px",
          borderRadius: "var(--r)",
          background: "color-mix(in srgb, var(--orange) 12%, transparent)",
          color: "var(--orange)",
          fontSize: "12px",
        }}
      >
        <WarningAmberOutlined sx={{ fontSize: 16 }} />
        {t("remediation.breaking_warning")}
      </Box>
    )}

    <Box
      sx={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr",
          gap: "8px",
          p: "8px 12px",
          background: "var(--s2)",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
        }}
      >
        <Box>{t("remediation.col.dependency")}</Box>
        <Box>{t("remediation.col.current")}</Box>
        <Box>{t("remediation.col.target")}</Box>
      </Box>
      {preview.targets.map((target) => (
        <Box
          key={`${target.ecosystem}:${target.name}`}
          sx={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr",
            gap: "8px",
            p: "8px 12px",
            borderTop: "1px solid var(--border)",
            fontSize: "12px",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={target.name}
            >
              {target.name}
            </Box>
            {target.isBreaking && (
              <Box
                sx={{
                  flexShrink: 0,
                  fontSize: "9px",
                  px: "5px",
                  py: "1px",
                  borderRadius: "4px",
                  background:
                    "color-mix(in srgb, var(--orange) 18%, transparent)",
                  color: "var(--orange)",
                  textTransform: "uppercase",
                }}
              >
                {t("remediation.breaking_badge")}
              </Box>
            )}
          </Box>
          <Box sx={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {target.currentVersion}
          </Box>
          <Box sx={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            {target.targetVersion}
          </Box>
        </Box>
      ))}
    </Box>

    {preview.files.length > 0 && (
      <Box sx={{ mt: "12px", fontSize: "11px", color: "var(--muted)" }}>
        {t("remediation.files")} : {preview.files.join(", ")}
      </Box>
    )}

    {preview.staleLockfiles.length > 0 && (
      <Box
        sx={{
          mt: "12px",
          p: "8px 12px",
          borderRadius: "var(--r)",
          background: "color-mix(in srgb, var(--orange) 10%, transparent)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            mb: "6px",
            color: "var(--orange)",
            fontSize: "11px",
          }}
        >
          <WarningAmberOutlined sx={{ fontSize: 14 }} />
          {t("remediation.lockfiles")}
        </Box>
        {preview.staleLockfiles.map((lockfile) => (
          <Box
            key={lockfile.path}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--muted)",
            }}
          >
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={lockfile.path}
            >
              {lockfile.path}
            </Box>
            <Box sx={{ flexShrink: 0, color: "var(--accent)" }}>
              {lockfile.command}
            </Box>
          </Box>
        ))}
      </Box>
    )}
  </Box>
);
