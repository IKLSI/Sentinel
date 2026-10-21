import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { DEMO_USER_NAMES } from "@/features/landing/demo/fixtures/ids";

const INITIALS = DEMO_USER_NAMES.camille
  .split(" ")
  .map((part) => part[0])
  .join("");

export const DemoProfile: React.FC = () => {
  const t = useT();

  return (
    <Box
      sx={{
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        px: "10px",
        py: "10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--accent-subtle)",
          color: "var(--accent)",
          display: "grid",
          placeItems: "center",
          fontSize: "11px",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {INITIALS}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box
          sx={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {DEMO_USER_NAMES.camille}
        </Box>
        <Box
          sx={{
            fontSize: "10px",
            fontWeight: 500,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1.3,
          }}
        >
          {t("sidebar.profile")}
        </Box>
      </Box>
    </Box>
  );
};
