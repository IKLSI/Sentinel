import type React from "react";
import { useEffect, useRef } from "react";
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
  attachments: CommentAttachment[];
  onAttachmentsChange: (attachments: CommentAttachment[]) => void;
  submitting: boolean;
  onSubmit: (content: string) => void;
  editingCommentId: string | null;
  onCancelEdit: () => void;
}

const EDITOR_MIN_HEIGHT = 90;

export const CommentComposer: React.FC<Props> = ({
  ticketId,
  value,
  onValueChange,
  attachments,
  onAttachmentsChange,
  submitting,
  onSubmit,
  editingCommentId,
  onCancelEdit,
}) => {
  const t = useT();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = editingCommentId !== null;

  useEffect(() => {
    if (!editingCommentId) return;
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editingCommentId]);

  const hasContent = value.trim().length > 0 || attachments.length > 0;

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const content = buildCommentContent(value.trimEnd(), attachments);
    if (!commentContentSchema.safeParse(content).success) return;
    onSubmit(content);
  };

  return (
    <Box sx={{ mt: "28px" }}>
      <CommentEditor
        value={value}
        onValueChange={onValueChange}
        onSubmit={handleSubmit}
        placeholder={t("tickets.detail.composer_reply_placeholder")}
        minHeight={EDITOR_MIN_HEIGHT}
        borderColor={
          isEditing
            ? "color-mix(in srgb, var(--accent) 32%, transparent)"
            : undefined
        }
        attachments={attachments}
        onRemoveAttachment={removeAttachment}
        inputRef={inputRef}
        actions={
          <>
            <AttachmentButton
              ticketId={ticketId}
              onUploaded={(attachment) =>
                onAttachmentsChange([...attachments, attachment])
              }
            />
            <Box sx={{ flex: 1 }} />
            {isEditing && (
              <Button
                variant="contained"
                size="small"
                className="btn-cancel"
                onClick={onCancelEdit}
                disabled={submitting}
              >
                {t("common.cancel")}
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!hasContent || submitting}
            >
              {submitting ? (
                <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
              ) : isEditing ? (
                t("common.save")
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
