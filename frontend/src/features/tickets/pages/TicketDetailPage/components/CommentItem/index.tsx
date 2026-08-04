import React from "react";
import Box from "@mui/material/Box";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { format } from "date-fns";
import { getDateFnsLocale } from "@/configs/locales";
import { useI18n } from "@/contexts/I18nContext";
import { useDownloadAttachmentMutation } from "@/domains/tickets/downloads";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import type { Ticket } from "@/domains/tickets/types";
import {
  AttachmentChip,
  type CommentAttachment,
} from "@/components/ui/common/AttachmentChip";
import {
  type DetailPalette,
  parseCommentContent,
} from "@/features/tickets/pages/TicketDetailPage/helpers";
import { initialsFromName } from "@/formatters/initials";

type Comment = Ticket["comments"][number];

interface Props {
  comment: Comment;
  isLast: boolean;
  isOwn: boolean;
  palette: DetailPalette;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const CommentItem: React.FC<Props> = React.memo(function CommentItem({
  comment: c,
  isLast,
  isOwn,
  palette,
  onEdit,
  onDelete,
}) {
  const { culture } = useI18n();
  const onDownloadError = useApiErrorToast(
    "tickets.detail.attachments_download_error",
  );
  const { text: mainText, attachments } = parseCommentContent(c.content);
  const downloadMutation = useDownloadAttachmentMutation();

  const handleDownload = (a: CommentAttachment) => {
    downloadMutation.mutate(
      { url: a.url, fileName: a.fileName },
      { onError: onDownloadError },
    );
  };

  return (
    <Box
      sx={{ display: "flex", gap: "10px", mb: "12px", position: "relative" }}
    >
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: "14px",
            top: "36px",
            height: "calc(100% - 30px)",
            width: "1px",
            background: palette.threadLine,
            zIndex: 0,
          }}
        />
      )}
      <Box
        sx={{
          width: "30px",
          height: "30px",
          borderRadius: "var(--r)",
          background:
            "linear-gradient(140deg, var(--avatar-peer-1) 0%, var(--avatar-peer-2) 100%)",
          color: "#fff",
          fontFamily: "var(--font-mono)",
          fontWeight: 800,
          fontSize: "11px",
          display: "grid",
          placeItems: "center",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {initialsFromName(c.authorName)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "6px" }}
        >
          <Box
            sx={{
              fontSize: "13px",
              color: palette.commentAuthor,
              fontWeight: 700,
            }}
          >
            {c.authorName}
          </Box>

          <Box sx={{ color: palette.chevron, fontSize: "11px" }}>·</Box>
          <Box
            sx={{
              fontFamily: "var(--font-mono)",
              color: palette.commentTime,
              fontSize: "11px",
            }}
          >
            {format(new Date(c.createdAt), "HH:mm", {
              locale: getDateFnsLocale(culture),
            })}
          </Box>

          {isOwn && (
            <Box sx={{ ml: "auto", display: "flex", gap: "4px" }}>
              <Box
                component="button"
                onClick={() => onEdit(c.id, c.content)}
                sx={{
                  all: "unset",
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  color: palette.iconBtnIdle,
                  display: "grid",
                  placeItems: "center",
                  "&:hover": {
                    background: palette.iconBtnEditHoverBg,
                    color: palette.iconBtnEditHoverFg,
                  },
                }}
              >
                <EditOutlined sx={{ fontSize: 15 }} />
              </Box>
              <Box
                component="button"
                onClick={() => onDelete(c.id)}
                sx={{
                  all: "unset",
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  color: palette.iconBtnIdle,
                  display: "grid",
                  placeItems: "center",
                  "&:hover": {
                    background: palette.iconBtnDelHoverBg,
                    color: palette.iconBtnDelHoverFg,
                  },
                }}
              >
                <DeleteOutlineOutlined sx={{ fontSize: 15 }} />
              </Box>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            border: `1px solid ${palette.commentBorderExternal}`,
            borderRadius: "var(--r-lg)",
            background: palette.commentBgExternal,
          }}
        >
          {mainText && (
            <Box
              sx={{
                p: "12px 16px",
                ...(attachments.length > 0 ? { pb: "8px" } : {}),
              }}
            >
              <Box
                sx={{
                  fontSize: "13px",
                  color: palette.bodyText,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.6,
                }}
              >
                {mainText}
              </Box>
            </Box>
          )}

          {attachments.length > 0 && (
            <Box
              sx={{
                px: "12px",
                pt: mainText ? "0px" : "10px",
                pb: "10px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {attachments.map((a) => (
                <AttachmentChip
                  key={a.url}
                  attachment={a}
                  onClick={() => handleDownload(a)}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});
