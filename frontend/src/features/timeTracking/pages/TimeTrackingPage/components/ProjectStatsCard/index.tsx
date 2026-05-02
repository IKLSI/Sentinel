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

      {/* Stacked bar */}
      <Box
        sx={{
          display: "flex",
          height: "8px",
          borderRadius: "4px",
          overflow: "hidden",
          gap: "2px",
        }}
      >
        {stats.map((p) => {
          const displayName = p.name ?? t("time_tracking.no_project_label");
          const color = getProjectColor(displayName);
          return (
            <Box
              key={displayName}
              sx={{
                flex: p.minutes,
                background: color,
                transition: "flex 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          );
        })}
      </Box>

      {/* Légende — badges flex-wrap, largeur selon contenu */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {stats.map((p) => {
          const pct =
            totalMinutes > 0 ? Math.round((p.minutes / totalMinutes) * 100) : 0;
          const displayName = p.name ?? t("time_tracking.no_project_label");
          const color = getProjectColor(displayName);
          return (
            <Box
              key={displayName}
              sx={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: "7px",
                px: "8px",
                py: "6px",
                background: "var(--s2)",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            >
              <Box
                sx={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  alignSelf: "center",
                  boxShadow: `0 0 5px ${color}`,
                }}
              />
              <Box
                sx={{
                  fontSize: "11.5px",
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                {displayName}
              </Box>
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "var(--text)",
                  ml: "6px",
                  lineHeight: 1,
                }}
              >
                {formatDuration(p.minutes)}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
