import React from "react";
import Box from "@mui/material/Box";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import { DashPalette, buildPanelSx } from "../../helpers";

interface Props {
  label: string;
  value: number;
  valueColor: string;
  icon: React.ReactNode;
  delta?: number;
  inverse?: boolean;
  badge?: boolean;
  palette: DashPalette;
}

export const KpiCard: React.FC<Props> = ({
  label,
  value,
  valueColor,
  icon,
  delta,
  inverse = false,
  badge = false,
  palette,
}) => {
  const positive = (delta ?? 0) >= 0;
  const good = inverse ? !positive : positive;
  const upColor = palette.activityOkFg;
  const downColor = palette.activityDangerFg;

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        p: "12px 15px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: palette.kpiLabel,
          }}
        >
          {label}
        </Box>
        <Box
          sx={{
            width: "36px",
            height: "36px",
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: valueColor,
            bgcolor: `${valueColor}18`,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Box
        sx={{ mt: "8px", display: "flex", alignItems: "baseline", gap: "7px" }}
      >
        <Box
          sx={{
            fontSize: "34px",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: valueColor,
          }}
        >
          {value}
        </Box>
        {delta !== undefined &&
          delta !== 0 &&
          (badge ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                color: palette.badgeCritical,
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              <TrendingUpOutlined sx={{ fontSize: 14 }} />
              {Math.abs(delta)}
            </Box>
          ) : (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                color: good ? upColor : downColor,
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              {good ? (
                <TrendingUpOutlined sx={{ fontSize: 14 }} />
              ) : (
                <TrendingDownOutlined sx={{ fontSize: 14 }} />
              )}
              {Math.abs(delta)}
            </Box>
          ))}
      </Box>
    </Box>
  );
};
