import React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { DashPalette, STATUS } from "../../helpers";

interface Props {
  map: Record<string, number>;
  palette: DashPalette;
}

export const Donut: React.FC<Props> = ({ map, palette }) => {
  const t = useT();
  const total = STATUS.reduce((sum, s) => sum + (map[s.key] ?? 0), 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Box sx={{ position: "relative", width: "140px", height: "140px" }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: "140px", height: "140px", transform: "rotate(-90deg)" }}
      >
        <defs>
          <style>{`
            @keyframes donut-draw { from { stroke-dashoffset: ${c.toFixed(1)}; } }
            .donut-seg { animation: donut-draw 0.8s ease-out both; }
          `}</style>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke={palette.donutTrack}
          strokeWidth="10"
          fill="none"
        />
        {STATUS.map((s, i) => {
          const value = map[s.key] ?? 0;
          if (!value || !total) return null;
          const seg = (value / total) * c;
          const dashOffset = -offset;
          const out = (
            <circle
              key={s.key}
              className="donut-seg"
              cx="50"
              cy="50"
              r={r}
              stroke={s.color}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(seg - 1.5, 0)} ${c}`}
              strokeDashoffset={dashOffset}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          );
          offset += seg;
          return out;
        })}
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              fontSize: "36px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: palette.donutCenter,
            }}
          >
            {total}
          </Box>
          <Box
            sx={{
              mt: "3px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.18em",
              color: palette.donutCenterLabel,
            }}
          >
            {t("dashboard.donut.total")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
