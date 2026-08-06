import type React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";

interface Props {
  onClick: () => void;
  exporting: boolean;
  label: string;
}

export const ExportButton: React.FC<Props> = ({
  onClick,
  exporting,
  label,
}) => (
  <Button
    variant="contained"
    color="secondary"
    size="small"
    disabled={exporting}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      flexShrink: 0,
    }}
    onClick={onClick}
  >
    {exporting ? (
      <CircularProgress size={12} sx={{ color: "#fff" }} />
    ) : (
      <FileDownloadOutlined sx={{ fontSize: 14 }} />
    )}
    {label}
  </Button>
);
