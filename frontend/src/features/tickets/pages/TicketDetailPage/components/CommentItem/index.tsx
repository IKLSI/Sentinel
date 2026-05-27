import React from "react";
import Box from "@mui/material/Box";
import LockOutlined from "@mui/icons-material/LockOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { getDateFnsLocale } from "@/utils/dateFnsLocale";
import { useI18n } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import { DetailPalette, getInitials } from "../../helpers";

type Comment = Ticket["comments"][number];

interface Attachment {
  fileName: string;
  url: string;
  isImage: boolean;
}

const ATTACH_SEP = "<!-- attachments -->";

function parseComment(content: string): { mainText: string; attachments: Attachment[] } {
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
  markdownSx: object;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const CommentItem: React.FC<Props> = React.memo(function CommentItem({
  comment: c,
  isLast,
  isOwn,
  palette,
  markdownSx,
  onEdit,
  onDelete,
}) {
  const { t, culture } = useI18n();
  const { mainText, attachments } = parseComment(c.content);

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
          background: c.isInternal
            ? "linear-gradient(140deg, var(--avatar-user-1) 0%, var(--avatar-user-2) 100%)"
            : "linear-gradient(140deg, var(--avatar-peer-1) 0%, var(--avatar-peer-2) 100%)",
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
        {getInitials(c.author.firstName, c.author.lastName)}
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
            {c.author.firstName} {c.author.lastName}
          </Box>

          {c.isInternal && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "11px",
                color: palette.internalBadgeFg,
                fontWeight: 800,
                px: "10px",
                py: "4px",
                borderRadius: "var(--r)",
              }}
            >
              <LockOutlined sx={{ fontSize: 14 }} />
              {t("tickets.detail.internal_note_badge")}
            </Box>
          )}

          <Box sx={{ color: palette.chevron, fontSize: "11px" }}>·</Box>
          <Box
            sx={{
              fontFamily: "var(--font-mono)",
              color: palette.commentTime,
              fontSize: "11px",
            }}
          >
            {format(new Date(c.createdAt), "HH:mm", { locale: getDateFnsLocale(culture) })}
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
            border: c.isInternal
              ? `1px solid ${palette.commentBorderInternal}`
              : `1px solid ${palette.commentBorderExternal}`,
            borderRadius: "var(--r-lg)",
            background: c.isInternal
              ? palette.commentBgInternal
              : palette.commentBgExternal,
          }}
        >
          {mainText && (
            <Box sx={{ p: "12px 16px", ...(attachments.length > 0 ? { pb: "8px" } : {}) }}>
              <Box sx={markdownSx}>
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {mainText}
              </ReactMarkdown>
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
              {attachments.map((a, i) => (
                <Box
                  key={i}
                  component="a"
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
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
                    textDecoration: "none",
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
