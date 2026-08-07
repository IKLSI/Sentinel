import type React from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

interface Props {
  label: string;
  active?: boolean;
  selected?: boolean;
  checkbox?: boolean;
  trailing?: ReactNode;
  onClick: () => void;
  onMouseEnter?: () => void;
}

export const OptionRow: React.FC<Props> = ({
  label,
  active,
  selected,
  checkbox,
  trailing,
  onClick,
  onMouseEnter,
}) => (
  <Box
    role="option"
    aria-selected={!!selected}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "9px",
      height: "30px",
      px: "9px",
      borderRadius: "var(--r-sm)",
      cursor: "pointer",
      fontSize: "12.5px",
      fontWeight: selected ? 600 : 500,
      color: selected ? "var(--text)" : "var(--text-secondary)",
      background: active ? "var(--s3)" : "transparent",
      transition: "background 0.1s, color 0.1s",
      "&:hover": { background: "var(--s3)" },
    }}
  >
    {checkbox && (
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          width: "15px",
          height: "15px",
          borderRadius: "var(--r-xs)",
          border: `1px solid ${selected ? "var(--accent-fill)" : "var(--border2)"}`,
          background: selected ? "var(--accent-fill)" : "transparent",
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        {selected && <CheckOutlined sx={{ fontSize: 11, color: "#fff" }} />}
      </Box>
    )}
    <Box
      component="span"
      sx={{
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
    {trailing}
  </Box>
);
