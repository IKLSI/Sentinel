import type React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  onClick: () => void;
  exporting: boolean;
  label: string;
  showIcon?: boolean;
  sx?: SxProps<Theme>;
}

export const ExportButton: React.FC<Props> = ({
  onClick,
  exporting,
  label,
  showIcon = true,
  sx,
}) => (
  <Button
    variant="contained"
    color="secondary"
    size="small"
    disabled={exporting}
    sx={[
      {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexShrink: 0,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    onClick={onClick}
  >
    {exporting && <CircularProgress size={12} sx={{ color: "#fff" }} />}
    {!exporting && showIcon && <FileDownloadOutlined sx={{ fontSize: 14 }} />}
    {label}
  </Button>
);
