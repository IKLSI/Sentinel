import type React from "react";
import { useMemo } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { CommentEditor } from "@/components/ui/forms/CommentEditor";
import { AttachmentButton } from "@/features/tickets/pages/TicketDetailPage/components/AttachmentButton";
import {
  buildCommentContent,
  parseCommentContent,
} from "@/features/tickets/pages/TicketDetailPage/helpers";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
  value: string;
  onValueChange: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
}

const EDITOR_MIN_HEIGHT = 180;

export const EditCommentModal: React.FC<Props> = ({
  ticketId,
  open,
  onClose,
  value,
  onValueChange,
  saving,
  onSubmit,
}) => {
  const t = useT();
  const { text, attachments } = useMemo(
    () => parseCommentContent(value),
    [value],
  );

  const canSave = text.trim().length > 0 || attachments.length > 0;

  return (
    <AppModal
      open={open}
      onClose={() => !saving && onClose()}
      title={t("tickets.detail.edit_comment_title")}
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSubmit}
            disabled={!canSave || saving}
          >
            {saving ? (
              <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
            ) : (
              t("common.save")
            )}
          </Button>
        </>
      }
    >
      <CommentEditor
        value={text}
        onValueChange={(next) =>
          onValueChange(buildCommentContent(next, attachments))
        }
        onSubmit={onSubmit}
        minHeight={EDITOR_MIN_HEIGHT}
        background="var(--s2)"
        autoFocus
        attachments={attachments}
        onRemoveAttachment={(index) =>
          onValueChange(
            buildCommentContent(
              text,
              attachments.filter((_, i) => i !== index),
            ),
          )
        }
        actions={
          <AttachmentButton
            ticketId={ticketId}
            onUploaded={(attachment) =>
              onValueChange(
                buildCommentContent(text, [...attachments, attachment]),
              )
            }
          />
        }
      />
    </AppModal>
  );
};
