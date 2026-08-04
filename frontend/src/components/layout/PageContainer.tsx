import type React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

const DEFAULT_SX = {
  p: "20px 28px",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} as const;

interface Props {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const PageContainer: React.FC<Props> = ({ children, sx }) => (
  <Box className="page-enter" sx={{ ...DEFAULT_SX, ...sx }}>
    {children}
  </Box>
);
