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
        background: "var(--s1)",
        borderRadius: "8px",
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--text) 6%, transparent), 0 8px 24px -6px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)",
        px: "12px",
        py: "9px",
        minWidth: 120,
        fontFamily: "var(--font-mono)",
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "capitalize",
          pb: "6px",
          mb: "6px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {label}
      </Box>
      {rows.map((entry) => (
        <Box
          key={String(entry.dataKey)}
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
            "& + &": { mt: "4px" },
            fontSize: "12.5px",
            color: "var(--text-secondary)",
          }}
        >
          <Box
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              fontWeight: 700,
              color: entry.color ?? "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {entry.value}
          </Box>
          {labels[String(entry.dataKey)]}
        </Box>
      ))}
    </Box>
  );
};
