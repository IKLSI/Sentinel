import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    value?: number | string | null;
    dataKey?: string | number;
    color?: string;
  }>;
  labels: Record<string, string>;
  hideZeroValues?: boolean;
}

export const ChartTooltip: React.FC<Props> = ({
  active,
  label,
  payload,
  labels,
  hideZeroValues = false,
}) => {
  const rows = (payload ?? []).filter(
    (entry) =>
      entry.value !== null &&
      entry.value !== undefined &&
      !(hideZeroValues && Number(entry.value) === 0),
  );

  if (!active || rows.length === 0) return null;

  return (
    <Box
      sx={{
        background: "var(--s2)",
        border: "1px solid var(--accent-border)",
        borderRadius: "var(--r-sm)",
        boxShadow: "var(--sh-2)",
        px: "10px",
        py: "6px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <Box
        sx={{
          fontSize: "9.5px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          textTransform: "capitalize",
        }}
      >
        {label}
      </Box>
      {rows.map((entry) => (
        <Box
          key={String(entry.dataKey)}
          sx={{
            mt: "2px",
            fontSize: "12px",
            fontWeight: 700,
            color: entry.color,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {entry.value} {labels[String(entry.dataKey)]}
        </Box>
      ))}
    </Box>
  );
};
