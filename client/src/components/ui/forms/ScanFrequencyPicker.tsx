import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useT } from "@/contexts/I18nContext";
import { ScanFrequency } from "@/enums";

const LABEL_KEYS: Record<ScanFrequency, string> = {
  [ScanFrequency.Daily]: "tech_health.scan_frequency.daily",
  [ScanFrequency.Weekly]: "tech_health.scan_frequency.weekly",
  [ScanFrequency.Monthly]: "tech_health.scan_frequency.monthly",
  [ScanFrequency.Manual]: "tech_health.scan_frequency.manual",
};

interface ScanFrequencyPickerProps {
  value: ScanFrequency;
  onChange: (frequency: ScanFrequency) => void;
  disabled?: boolean;
}

export const ScanFrequencyPicker: React.FC<ScanFrequencyPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const t = useT();

  return (
    <Box
      role="radiogroup"
      sx={{
        display: "inline-flex",
        gap: "2px",
        p: "2px",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {Object.values(ScanFrequency).map((frequency) => {
        const isActive = frequency === value;

        return (
          <ButtonBase
            key={frequency}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(frequency)}
            sx={{
              font: "inherit",
              textAlign: "inherit",
              cursor: isActive ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: "12px",
              height: "26px",
              borderRadius: "var(--r-xs)",
              fontSize: "11.5px",
              fontWeight: isActive ? 700 : 500,
              whiteSpace: "nowrap",
              color: isActive ? "var(--s1)" : "var(--text-secondary)",
              background: isActive ? "var(--accent)" : "transparent",
              boxShadow: isActive ? "0 2px 8px var(--accent-border)" : "none",
              transition: "background 0.12s, color 0.12s",
              ...(!isActive && {
                "&:hover": { background: "var(--s2)", color: "var(--text)" },
              }),
            }}
          >
            {t(LABEL_KEYS[frequency])}
          </ButtonBase>
        );
      })}
    </Box>
  );
};
