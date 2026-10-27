import type React from "react";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import GppMaybeOutlined from "@mui/icons-material/GppMaybeOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useT } from "@/contexts/I18nContext";
import type { ProjectHeader } from "@/domains/projects/types";
import { isCovered } from "@/formatters/coverage";

interface Props {
  project: ProjectHeader;
  eolRuntimes: number;
}

export const HeaderStats: React.FC<Props> = ({ project, eolRuntimes }) => {
  const t = useT();
  const covered = isCovered(project);

  const stats = [
    {
      label: t("tech_health.stats.dependencies"),
      value: project.totalDependencies,
      icon: <InventoryOutlined sx={{ fontSize: 15 }} />,
      alert: null,
    },
    {
      label: t("tech_health.stats.critical"),
      value: project.criticalVulnerabilities,
      icon: <GppBadOutlined sx={{ fontSize: 15 }} />,
      alert: project.criticalVulnerabilities > 0 ? "var(--red)" : null,
    },
    {
      label: t("tech_health.stats.vulnerabilities"),
      value: project.totalVulnerabilities,
      icon: <GppMaybeOutlined sx={{ fontSize: 15 }} />,
      alert: project.totalVulnerabilities > 0 ? "var(--orange)" : null,
    },
    {
      label: t("tech_health.stats.eol"),
      value: eolRuntimes,
      icon: <StorageOutlined sx={{ fontSize: 15 }} />,
      alert: eolRuntimes > 0 ? "var(--red)" : null,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {stats.map((s, i) => (
        <Box
          key={s.label}
          sx={{
            p: "14px 20px",
            borderRight: i < 3 ? "1px solid var(--border)" : "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: s.alert ?? "var(--muted)",
              mb: "8px",
            }}
          >
            {s.icon}
            <Box
              component="span"
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
              }}
            >
              {s.label}
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: "28px",
              fontWeight: covered ? 800 : 400,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: covered ? (s.alert ?? "var(--text)") : "var(--muted)",
            }}
          >
            {covered ? s.value : "—"}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
