import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

export interface TabBarItem {
  icon: React.ReactNode;
  label: string;
}

interface Props {
  tabs: TabBarItem[];
  active: number;
  onChange: (i: number) => void;
}

export const TabBar: React.FC<Props> = ({ tabs, active, onChange }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-end",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0,
    }}
  >
    {tabs.map((tab, i) => {
      const isActive = active === i;
      return (
        <ButtonBase
          key={tab.label}
          onClick={() => onChange(i)}
          sx={{
            font: "inherit",
            textAlign: "inherit",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            px: "14px",
            pb: "11px",
            pt: "2px",
            fontSize: "10.5px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: isActive ? "var(--accent)" : "var(--muted2)",
            position: "relative",
            transition: "color 0.15s",
            "&:hover": !isActive ? { color: "var(--text-secondary)" } : {},
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -1,
              left: 0,
              right: 0,
              height: "2px",
              borderRadius: "2px 2px 0 0",
              background: isActive ? "var(--accent)" : "transparent",
              transition: "background 0.15s",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              color: isActive ? "var(--accent)" : "var(--muted)",
              transition: "color 0.12s",
            }}
          >
            {tab.icon}
          </Box>
          {tab.label}
        </ButtonBase>
      );
    })}
  </Box>
);
