import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  size: number;
  value: number | null;
  color: string;
  thickness?: number;
  trackColor?: string;
  showTrack?: boolean;
  roundedCap?: boolean;
  decorative?: boolean;
  labelSx?: SxProps<Theme>;
  children: React.ReactNode;
}

const DEFAULT_THICKNESS = 2.5;

export const GradeRing: React.FC<Props> = ({
  size,
  value,
  color,
  thickness = DEFAULT_THICKNESS,
  trackColor = "var(--border)",
  showTrack = true,
  roundedCap = false,
  decorative = false,
  labelSx,
  children,
}) => {
  const ringProps = {
    variant: "determinate",
    size,
    thickness,
    "aria-hidden": decorative || undefined,
  } as const;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {showTrack && (
        <CircularProgress
          {...ringProps}
          value={100}
          sx={{ position: "absolute", inset: 0, color: trackColor }}
        />
      )}
      {value !== null && (
        <CircularProgress
          {...ringProps}
          value={value}
          sx={{
            position: "absolute",
            inset: 0,
            color,
            ...(roundedCap && {
              "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
            }),
          }}
        />
      )}
      <Box
        sx={[
          {
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color,
          },
          ...(Array.isArray(labelSx) ? labelSx : [labelSx]),
        ]}
      >
        {children}
      </Box>
    </Box>
  );
};
