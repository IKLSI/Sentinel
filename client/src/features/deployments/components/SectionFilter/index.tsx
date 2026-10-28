import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

interface Section {
  key: string;
  label: string;
  count: number;
  tone: string;
}

interface Props {
  sections: Section[];
  active: string | undefined;
  onChange: (key: string) => void;
}

export const SectionFilter: React.FC<Props> = ({
  sections,
  active,
  onChange,
}) => (
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      px: "16px",
      py: "12px",
      flexShrink: 0,
      borderBottom: "1px solid var(--border)",
    }}
  >
    {sections.map(({ key, label, count, tone }) => {
      const selected = key === active;

      return (
        <ButtonBase
          key={key}
          aria-pressed={selected}
          onClick={() => onChange(key)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            height: "28px",
            px: "10px",
            borderRadius: "999px",
            border: "1px solid",
            borderColor: selected
              ? `color-mix(in srgb, ${tone} 40%, transparent)`
              : "var(--border)",
            background: selected
              ? `color-mix(in srgb, ${tone} 10%, transparent)`
              : "transparent",
            fontSize: "12px",
            fontWeight: 600,
            color: selected ? "var(--text)" : "var(--muted)",
            transition: "border-color 0.15s, background 0.15s, color 0.15s",
            "&:hover": { color: "var(--text)", borderColor: "var(--border2)" },
          }}
        >
          {label}
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: selected ? tone : "var(--muted2)",
            }}
          >
            {count}
          </Box>
        </ButtonBase>
      );
    })}
  </Box>
);
