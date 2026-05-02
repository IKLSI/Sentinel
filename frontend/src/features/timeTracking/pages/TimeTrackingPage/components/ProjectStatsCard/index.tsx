import React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { formatDuration, getProjectColor } from "../../helpers";

interface Props {
  stats: { name: string | null; minutes: number }[];
  totalMinutes: number;
}

export const ProjectStatsCard: React.FC<Props> = ({ stats, totalMinutes }) => {
  const t = useT();
  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        px: "16px",
        py: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          mb: "2px",
        }}
      >
        {t("time_tracking.by_project")}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {stats.map((p) => {
          const pct =
            totalMinutes > 0 ? Math.round((p.minutes / totalMinutes) * 100) : 0;
          const displayName = p.name ?? t("time_tracking.no_project_label");
          const color = getProjectColor(displayName);
          return (
            <Box key={displayName} sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Box
                sx={{
                  fontSize: "12.5px",
                  color: "var(--text)",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  minWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  height: "3px",
                  background: "var(--s3)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${pct}%`,
                    background: color,
                    borderRadius: "2px",
                    transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </Box>
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text)",
                  minWidth: "28px",
                  textAlign: "right",
                }}
              >
                {formatDuration(p.minutes)}
              </Box>
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--muted)",
                  minWidth: "28px",
                  textAlign: "right",
                }}
              >
                {pct}%
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
