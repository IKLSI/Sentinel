import type React from "react";
import { useT } from "@/contexts/I18nContext";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
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

const CHIP_SX = {
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
} as const;

const CLICKABLE_CHIP_SX = {
  ...CHIP_SX,
  font: "inherit",
  fontSize: "11px",
  fontWeight: 500,
  transition: "background 0.12s, color 0.12s",
  "&:hover": { background: "var(--s2)" },
} as const;

export const AttachmentChip: React.FC<Props> = ({
  attachment,
  onClick,
  onRemove,
}) => {
  const t = useT();
  const content = (
    <>
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
          aria-label={t("common.remove_attachment", {
            name: attachment.fileName,
          })}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{
            p: 0,
            display: "grid",
            placeItems: "center",
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
    </>
  );

  return onClick ? (
    <ButtonBase onClick={onClick} sx={CLICKABLE_CHIP_SX}>
      {content}
    </ButtonBase>
  ) : (
    <Box sx={CHIP_SX}>{content}</Box>
  );
};
