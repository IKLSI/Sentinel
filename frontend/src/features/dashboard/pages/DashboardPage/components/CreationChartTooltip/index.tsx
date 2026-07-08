import React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";

interface Props {
  active?: boolean;
  label?: string;
  payload?: ReadonlyArray<{ value?: number | string }>;
}

export const CreationChartTooltip: React.FC<Props> = ({
  active,
  label,
  payload,
}) => {
  const t = useT();

  if (!active || !payload?.length) return null;
  const count = Number(payload[0]?.value ?? 0);

  return (
    <Box
      sx={{
        background: "var(--s2)",
        border: "1px solid var(--accent-border)",
        borderRadius: "var(--r-sm)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        px: "10px",
        py: "6px",
      }}
    >
      <Box
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          textTransform: "capitalize",
        }}
      >
        {label}
      </Box>
      <Box
        sx={{
          mt: "2px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--accent)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count === 1
          ? t("dashboard.creation.tooltip_one")
          : t("dashboard.creation.tooltip_other", { count })}
      </Box>
    </Box>
  );
};
