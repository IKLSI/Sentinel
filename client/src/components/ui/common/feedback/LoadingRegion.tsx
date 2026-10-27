import type React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { LoadingStatus } from "@/components/ui/common/feedback/LoadingStatus";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";

interface Props {
  label: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const LoadingRegion: React.FC<Props> = ({ label, children, sx }) => (
  <Box
    aria-busy="true"
    sx={{
      position: "relative",
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
      ...sx,
    }}
  >
    <Box sx={DELAYED_REVEAL_SX}>{children}</Box>
    <LoadingStatus label={label} />
  </Box>
);
