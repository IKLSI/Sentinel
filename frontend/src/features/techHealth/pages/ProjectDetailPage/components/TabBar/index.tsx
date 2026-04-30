import React from "react";
import Box from "@mui/material/Box";
import { TabDef } from "../../helpers";

interface Props {
  tabs: TabDef[];
  active: number;
  onChange: (i: number) => void;
}

export const TabBar: React.FC<Props> = ({ tabs, active, onChange }) => (
  <Box sx={{ display: "flex", height: "100%" }}>
    {tabs.map((tab, i) => (
      <Box
        key={i}
        component="button"
        onClick={() => onChange(i)}
        sx={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          px: "16px",
          height: "100%",
          fontSize: "13px",
          fontWeight: active === i ? 600 : 400,
          color: active === i ? "var(--text)" : "var(--muted)",
          borderBottom:
            active === i ? "2px solid var(--accent)" : "2px solid transparent",
          marginBottom: "-1px",
          position: "relative",
          zIndex: 1,
          transition: "color 0.12s, border-color 0.12s",
          "&:hover": { color: "var(--text)" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            opacity: active === i ? 1 : 0.5,
            transition: "opacity 0.12s",
          }}
        >
          {tab.icon}
        </Box>
        {tab.label}
      </Box>
    ))}
  </Box>
);
