import React from "react";
import Box from "@mui/material/Box";
import LockOutlined from "@mui/icons-material/LockOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import { DetailPalette, getInitials } from "../../helpers";

type Comment = Ticket["comments"][number];

interface Props {
  comment: Comment;
  isLast: boolean;
  isOwn: boolean;
  palette: DetailPalette;
  markdownSx: object;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const CommentItem: React.FC<Props> = ({
  comment: c,
  isLast,
  isOwn,
  palette,
  markdownSx,
  onEdit,
  onDelete,
}) => {
  const t = useT();
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
          borderRadius: 'var(--r)',
          background: c.isInternal
            ? "linear-gradient(140deg, #c4b5fd 0%, #818cf8 100%)"
            : "linear-gradient(140deg, #fda4af 0%, #fb7185 100%)",
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
                borderRadius: 'var(--r)',
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
            {format(new Date(c.createdAt), "HH:mm", { locale: fr })}
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
                  borderRadius: 'var(--r)',
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
                  borderRadius: 'var(--r)',
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
            borderRadius: 'var(--r-lg)',
            background: c.isInternal
              ? palette.commentBgInternal
              : palette.commentBgExternal,
          }}
        >
          <Box sx={{ p: "12px 16px" }}>
            <Box sx={markdownSx}>
              <ReactMarkdown>{c.content}</ReactMarkdown>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
