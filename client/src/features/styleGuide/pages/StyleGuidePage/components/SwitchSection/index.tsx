import type React from "react";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";

export const SwitchSection: React.FC = () => {
  return (
    <Section title="Switch">
      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Switch defaultChecked />
          <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Actif
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Switch />
          <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Inactif
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Switch disabled />
          <Box sx={{ fontSize: "13px", color: "var(--muted)" }}>Désactivé</Box>
        </Box>
      </Box>
    </Section>
  );
};
