import type React from "react";
import Box from "@mui/material/Box";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { DETAIL_PALETTE } from "@/features/tickets/pages/TicketDetailPage/helpers";
import { CommentItem } from "@/features/tickets/pages/TicketDetailPage/components/CommentItem";

interface Props {
  comments: Ticket["comments"];
  currentUserId?: string;
  editingCommentId: string | null;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const CommentThread: React.FC<Props> = ({
  comments,
  currentUserId,
  editingCommentId,
  onEdit,
  onDelete,
}) => {
  const t = useT();
  return (
    <Box sx={{ position: "relative" }}>
      {comments.map((c, idx) => (
        <CommentItem
          key={c.id}
          comment={c}
          isLast={idx === comments.length - 1}
          isOwn={currentUserId === c.authorId}
          isEditing={editingCommentId === c.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {comments.length === 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            py: "32px",
            color: DETAIL_PALETTE.emptyFg,
          }}
        >
          <ForumOutlined sx={{ fontSize: 28, opacity: 0.4 }} />
          <Box sx={{ fontSize: "13px", fontWeight: 500 }}>
            {t("tickets.detail.no_comments_title")}
          </Box>
          <Box sx={{ fontSize: "12px", color: DETAIL_PALETTE.emptySub }}>
            {t("tickets.detail.no_comments_subtitle")}
          </Box>
        </Box>
      )}
    </Box>
  );
};
