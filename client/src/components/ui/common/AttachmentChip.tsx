import type React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";

export interface CommentAttachment {
  fileName: string;
  url: string;
  isImage: boolean;
}

interface Props {
  attachment: CommentAttachment;
  onClick?: () => void;
  onRemove?: () => void;
}

export const AttachmentChip: React.FC<Props> = ({
  attachment,
  onClick,
  onRemove,
}) => (
  <Box
    component={onClick ? "button" : "div"}
    type={onClick ? "button" : undefined}
    onClick={onClick}
    sx={{
      all: "unset",
      boxSizing: "border-box",
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      px: "8px",
      height: "26px",
      borderRadius: "var(--r)",
      border: "1px solid var(--border)",
      background: "var(--s3)",
      fontSize: "11px",
      fontWeight: 500,
      color: "var(--text-secondary)",
      maxWidth: "220px",
      ...(onClick
        ? {
            cursor: "pointer",
            transition: "background 0.12s, color 0.12s",
            "&:hover": { background: "var(--s2)" },
          }
        : {}),
    }}
  >
    {attachment.isImage ? (
      <ImageOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
    ) : (
      <InsertDriveFileOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
    )}
    <Box
      component="span"
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {attachment.fileName}
    </Box>
    {onRemove && (
      <IconButton
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          p: 0,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "var(--muted2)",
          borderRadius: "50%",
          width: "14px",
          height: "14px",
          flexShrink: 0,
          "&:hover": { color: "var(--text-secondary)" },
        }}
      >
        <CloseRounded sx={{ fontSize: 11 }} />
      </IconButton>
    )}
  </Box>
);
