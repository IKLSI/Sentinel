import React from "react";
import Box from "@mui/material/Box";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { useI18n, useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { RowActions } from "@/components/ui/common/table/RowActions";
import {
  AttachmentChip,
  type CommentAttachment,
} from "@/components/ui/common/AttachmentChip";
import { useDownloadAttachmentMutation } from "@/domains/tickets/downloads";
import { DETAIL_PALETTE } from "@/features/tickets/pages/TicketDetailPage/constants";
import { parseCommentContent } from "@/features/tickets/pages/TicketDetailPage/helpers";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { initialsFromName } from "@/formatters/initials";
import { formatShortDateTime } from "@/formatters/date";

type Comment = Ticket["comments"][number];

interface Props {
  comment: Comment;
  isLast: boolean;
  isOwn: boolean;
  isEditing: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const CommentItem: React.FC<Props> = React.memo(function CommentItem({
  comment: c,
  isLast,
  isOwn,
  isEditing,
  onEdit,
  onDelete,
}) {
  const { culture } = useI18n();
  const t = useT();
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
      sx={{
        display: "flex",
        gap: "10px",
        mb: "12px",
        position: "relative",
        "&:hover .row-actions": { opacity: "1 !important" },
      }}
    >
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: "14px",
            top: "36px",
            height: "calc(100% - 30px)",
            width: "1px",
            background: DETAIL_PALETTE.threadLine,
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
              color: DETAIL_PALETTE.commentAuthor,
              fontWeight: 700,
            }}
          >
            {c.authorName}
          </Box>

          <Box sx={{ color: DETAIL_PALETTE.chevron, fontSize: "11px" }}>·</Box>
          <Box
            sx={{
              fontFamily: "var(--font-mono)",
              color: DETAIL_PALETTE.commentTime,
              fontSize: "11px",
            }}
          >
            {formatShortDateTime(c.createdAt, culture)}
          </Box>

          {isOwn && (
            <Box sx={{ ml: "auto" }}>
              <RowActions
                actions={[
                  {
                    icon: <EditOutlined sx={{ fontSize: 13 }} />,
                    label: t("common.edit"),
                    onClick: () => onEdit(c.id, c.content),
                    color: "accent",
                  },
                  {
                    icon: <DeleteOutlineOutlined sx={{ fontSize: 13 }} />,
                    label: t("common.delete"),
                    onClick: () => onDelete(c.id),
                    color: "red",
                  },
                ]}
              />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            border: `1px solid ${
              isEditing
                ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                : DETAIL_PALETTE.commentBorderExternal
            }`,
            borderRadius: "var(--r-lg)",
            background: isEditing
              ? "color-mix(in srgb, var(--accent) 7%, transparent)"
              : DETAIL_PALETTE.commentBgExternal,
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
                  color: DETAIL_PALETTE.bodyText,
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
