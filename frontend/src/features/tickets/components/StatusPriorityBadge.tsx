import React from "react";
import Box from "@mui/material/Box";

interface Props {
  dotColor: string;
  label: string;
  noGlow?: boolean;
}

export const StatusPriorityBadge: React.FC<Props> = ({
  dotColor,
  label,
  noGlow = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        fontSize: "12px",
        color: "var(--text-secondary)",
      }}
    >
      <Box
        sx={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
          boxShadow: noGlow ? "none" : `0 0 5px ${dotColor}`,
        }}
      />
      <Box sx={{ fontSize: "12px", color: "inherit", fontWeight: 400 }}>
        {label}
      </Box>
    </Box>
  );
};

export default StatusPriorityBadge;
