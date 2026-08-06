import type React from "react";
import Box from "@mui/material/Box";

interface SortableThProps {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  active?: boolean;
  ascending?: boolean;
  onSort?: () => void;
  width?: string;
  mono?: boolean;
}

export const SortableTh: React.FC<SortableThProps> = ({
  children,
  align = "left",
  sortable = false,
  active = false,
  ascending = true,
  onSort,
  width,
  mono = false,
}) => (
  <Box
    component="th"
    onClick={() => sortable && onSort?.()}
    sx={{
      px: "16px",
      py: "10px",
      width,
      borderBottom: "1px solid var(--border)",
      background: "var(--s2)",
      fontFamily: mono ? "var(--font-mono)" : undefined,
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: active ? "var(--accent)" : "var(--muted)",
      textAlign: align,
      whiteSpace: "nowrap",
      cursor: sortable ? "pointer" : "default",
      userSelect: "none",
      transition: "color 0.12s",
      "&:hover": sortable ? { color: "var(--text-secondary)" } : {},
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        gap: "5px",
      }}
    >
      {children}
      {sortable && active && (
        <Box
          sx={{
            fontSize: "12px",
            color: "var(--accent)",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {ascending ? "↑" : "↓"}
        </Box>
      )}
    </Box>
  </Box>
);
