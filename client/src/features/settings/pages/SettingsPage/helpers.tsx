import Box from "@mui/material/Box";
import { SettingsTab } from "@/enums";
import { CARD_SX } from "@/helpers/cardSx";

export { CARD_SX };

export type Tab = SettingsTab;
export { SettingsTab };

export const SEVERITY_VALUES = ["Critical", "High", "Medium", "Low"] as const;

export function CardHeader({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: "16px",
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        background: "var(--s2)",
      }}
    >
      <Box
        sx={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
