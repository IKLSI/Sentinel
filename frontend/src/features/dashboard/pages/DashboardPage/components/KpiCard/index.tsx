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
        p: "8px 15px 12px 15px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            background: `linear-gradient(135deg, ${palette.kpiLabel} 0%, color-mix(in srgb, ${valueColor} 25%, ${palette.kpiLabel}))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.3,
            fontVariantNumeric: "tabular-nums",
            transition: "all 0.2s ease",
            "&:hover": {
              background: `linear-gradient(135deg, color-mix(in srgb, ${palette.kpiLabel} 95%, white) 0%, color-mix(in srgb, ${valueColor} 35%, ${palette.kpiLabel}))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            },
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
