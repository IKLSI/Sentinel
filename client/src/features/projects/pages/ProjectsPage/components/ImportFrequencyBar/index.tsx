import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import type { ScanFrequency } from "@/enums";
import { ScanFrequencyPicker } from "@/components/ui/forms/ScanFrequencyPicker";

interface Props {
  value: ScanFrequency;
  onChange: (value: ScanFrequency) => void;
  disabled: boolean;
}

export const ImportFrequencyBar: React.FC<Props> = ({
  value,
  onChange,
  disabled,
}) => {
  const t = useT();

  return (
    <Box
      sx={{
        px: "20px",
        py: "12px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {t("projects.modal.frequency_label")}
      </Box>
      <ScanFrequencyPicker
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </Box>
  );
};
