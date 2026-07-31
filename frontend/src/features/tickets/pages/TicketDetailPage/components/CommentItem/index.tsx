import React from "react";
import Box from "@mui/material/Box";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import { format } from "date-fns";
import { getDateFnsLocale } from "@/configs/locales";
import { useI18n } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/useToast";
import { useDownloadAttachmentMutation } from "@/domains/tickets/downloads";
import { useApiError } from "@/hooks/useApiError";
import type { Ticket } from "@/domains/tickets/types";
import type { DetailPalette } from "@/features/tickets/pages/TicketDetailPage/helpers";
import { initialsFromName } from "@/formatters/initials";

type Comment = Ticket["comments"][number];

interface Attachment {
  fileName: string;
  url: string;
  isImage: boolean;
}

const ATTACH_SEP = "<!-- attachments -->";

function parseComment(content: string): {
  mainText: string;
  attachments: Attachment[];
} {
  const idx = content.indexOf(ATTACH_SEP);
  if (idx === -1) return { mainText: content, attachments: [] };

  const mainText = content.slice(0, idx).trimEnd();
  const section = content.slice(idx + ATTACH_SEP.length).trim();

  const attachments = section
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const img = line.match(/^!\[(.+?)\]\((.+?)\)$/);
      if (img) return { fileName: img[1], url: img[2], isImage: true };
      const lnk = line.match(/^\[(.+?)\]\((.+?)\)$/);
      if (lnk) return { fileName: lnk[1], url: lnk[2], isImage: false };
      return null;
    })
    .filter((a): a is Attachment => a !== null);

  return { mainText, attachments };
}

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
  const { t, culture } = useI18n();
  const apiError = useApiError();
  const { showToast } = useToast();
  const { mainText, attachments } = parseComment(c.content);
  const downloadMutation = useDownloadAttachmentMutation();

  const handleDownload = (a: Attachment) => {
    downloadMutation.mutate(
      { url: a.url, fileName: a.fileName },
      {
        onError: (err) =>
          showToast(
            apiError(err, t("tickets.detail.attachments_download_error")),
            "error",
          ),
      },
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
                  color: palette.mdText,
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
                <Box
                  key={a.url}
                  component="button"
                  type="button"
                  onClick={() => handleDownload(a)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    px: "8px",
                    height: "26px",
                    borderRadius: "var(--r)",
                    border: `1px solid ${palette.composerBorder}`,
                    background: palette.tabStripBg,
                    fontSize: "11px",
                    fontWeight: 500,
                    color: palette.tabIdleFg,
                    maxWidth: "220px",
                    transition: "background 0.12s, color 0.12s",
                    "&:hover": {
                      background: palette.toolbarHoverBg,
                      color: palette.toolbarHoverFg,
                    },
                  }}
                >
                  {a.isImage ? (
                    <ImageOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
                  ) : (
                    <InsertDriveFileOutlined
                      sx={{ fontSize: 13, flexShrink: 0 }}
                    />
                  )}
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.fileName}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});
