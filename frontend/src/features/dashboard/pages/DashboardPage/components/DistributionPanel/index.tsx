import React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { DashPalette, buildPanelSx } from "../../helpers";
import { Donut } from "../Donut";

interface Props {
  ticketsByStatus: Record<string, number>;
  ticketsByStatusColor: Record<string, string>;
  palette: DashPalette;
}

export const DistributionPanel: React.FC<Props> = ({
  ticketsByStatus,
  ticketsByStatusColor,
  palette,
}) => {
  const t = useT();
  const entries = Object.entries(ticketsByStatus);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "span 4",
        p: "16px 18px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Box
            sx={{
              fontSize: "15px",
              fontWeight: 700,
              color: palette.textPrimary,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {t("dashboard.distribution.title")}
          </Box>
          <Box
            sx={{ mt: "4px", color: palette.textSecondary, fontSize: "11px" }}
          >
            {t("dashboard.distribution.subtitle")}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "20px",
          mt: "12px",
        }}
      >
        <Donut map={ticketsByStatus} colorMap={ticketsByStatusColor} palette={palette} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {entries.map(([name, count]) => {
            const color = ticketsByStatusColor[name] ?? "var(--muted2)";
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <Box
                key={name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: palette.textPrimary,
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "999px",
                      bgcolor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span>{name}</span>
                </Box>
                <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  <strong>{count}</strong>{" "}
                  <span style={{ color: palette.donutPct }}>{pct}%</span>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
