import type React from "react";
import Box from "@mui/material/Box";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { ICONS } from "@/features/styleGuide/pages/StyleGuidePage/constants";

export const IconsSection: React.FC = () => {
  return (
    <Section
      title="Icons"
      desc="MUI Icons Outlined — sous-ensemble utilisé dans l'application."
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
          gap: "10px",
        }}
      >
        {ICONS.map(({ Icon, name }) => (
          <Box
            key={name}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              p: "14px 6px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              background: "var(--s1)",
            }}
          >
            <Icon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
            <Box sx={{ fontSize: "10px", color: "var(--muted2)" }}>{name}</Box>
          </Box>
        ))}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            p: "14px 6px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--s1)",
          }}
        >
          <AutorenewOutlined
            sx={{
              fontSize: 18,
              color: "var(--text-secondary)",
              animation: "spin 1.2s linear infinite",
              "@keyframes spin": { to: { transform: "rotate(360deg)" } },
            }}
          />
          <Box sx={{ fontSize: "10px", color: "var(--muted2)" }}>Loader</Box>
        </Box>
      </Box>
    </Section>
  );
};
