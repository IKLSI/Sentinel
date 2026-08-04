import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useT } from "@/contexts/I18nContext";
import { CommentEditor } from "@/components/ui/forms/CommentEditor";
import type { CommentAttachment } from "@/components/ui/common/AttachmentChip";
import { AttachmentButton } from "@/features/tickets/pages/TicketDetailPage/components/AttachmentButton";
import { buildCommentContent } from "@/features/tickets/pages/TicketDetailPage/helpers";
import { commentContentSchema } from "@/features/tickets/pages/TicketDetailPage/schemas";

interface Props {
  ticketId: string;
  value: string;
  onValueChange: (v: string) => void;
  submitting: boolean;
  onSubmit: (content: string) => void;
}

const EDITOR_MIN_HEIGHT = 90;

export const CommentComposer: React.FC<Props> = ({
  ticketId,
  value,
  onValueChange,
  submitting,
  onSubmit,
}) => {
  const t = useT();
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);

  const hasContent = value.trim().length > 0 || attachments.length > 0;

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const content = buildCommentContent(value.trimEnd(), attachments);
    if (!commentContentSchema.safeParse(content).success) return;
    onSubmit(content);
    setAttachments([]);
  };

  return (
    <Box sx={{ mt: "28px" }}>
      <CommentEditor
        value={value}
        onValueChange={onValueChange}
        onSubmit={handleSubmit}
        placeholder={t("tickets.detail.composer_reply_placeholder")}
        minHeight={EDITOR_MIN_HEIGHT}
        attachments={attachments}
        onRemoveAttachment={removeAttachment}
        actions={
          <>
            <AttachmentButton
              ticketId={ticketId}
              onUploaded={(attachment) =>
                setAttachments((prev) => [...prev, attachment])
              }
            />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!hasContent || submitting}
            >
              {submitting ? (
                <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
              ) : (
                t("tickets.detail.send")
              )}
            </Button>
          </>
        }
      />
    </Box>
  );
};
