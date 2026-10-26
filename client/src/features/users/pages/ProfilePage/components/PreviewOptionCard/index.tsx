import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  selected: boolean;
  onClick: () => void;
  preview: React.ReactNode;
  previewSx: SxProps<Theme>;
  footerBackground: string;
  icon: React.ReactNode;
  label: string;
  labelColor: string;
}

export const PreviewOptionCard: React.FC<Props> = ({
  selected,
  onClick,
  preview,
  previewSx,
  footerBackground,
  icon,
  label,
  labelColor,
}) => (
  <ButtonBase
    type="button"
    onClick={onClick}
    sx={{
      font: "inherit",
      textAlign: "inherit",
      display: "block",
      cursor: "pointer",
      width: 100,
      boxSizing: "border-box",
      borderRadius: "var(--r-sm)",
      overflow: "hidden",
      border: selected ? "2px solid var(--accent)" : "2px solid var(--border)",
      boxShadow: selected ? "0 0 0 2px var(--accent-subtle)" : "none",
      transition: "all 0.15s",
    }}
  >
    <Box sx={previewSx}>{preview}</Box>
    <Box
      sx={{
        px: "8px",
        py: "4px",
        background: footerBackground,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
        {icon}
        <Box sx={{ fontSize: "9px", fontWeight: 600, color: labelColor }}>
          {label}
        </Box>
      </Box>
      {selected && (
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckOutlined sx={{ fontSize: 7, color: "var(--s1)" }} />
        </Box>
      )}
    </Box>
  </ButtonBase>
);
