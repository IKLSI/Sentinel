import type React from "react";
import { useRef } from "react";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useUploadAttachmentMutation } from "@/domains/tickets/mutations";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { API_BASE_URL } from "@/configs/env";
import { buildUrl } from "@/helpers/url";
import type { CommentAttachment } from "@/components/ui/common/AttachmentChip";

interface Props {
  ticketId: string;
  onUploaded: (attachment: CommentAttachment) => void;
}

const ATTACHMENT_FORM_FIELD = "file";
const IMAGE_MIME_PREFIX = "image/";
const ACCEPTED_FILE_TYPES = "image/*,.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx";

export const AttachmentButton: React.FC<Props> = ({ ticketId, onUploaded }) => {
  const t = useT();
  const onUploadError = useApiErrorToast(
    "tickets.detail.attachments_upload_error",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAttachmentMutation();
  const uploading = uploadMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const formData = new FormData();
    formData.append(ATTACHMENT_FORM_FIELD, file);
    uploadMutation.mutate(
      { id: ticketId, data: formData },
      {
        onSuccess: (created) => {
          const path = buildUrl(
            ROUTES_API.api.tickets[":id"].attachments[":attachmentId"].__path,
            { id: ticketId, attachmentId: created.id },
          );
          onUploaded({
            fileName: created.fileName ?? file.name,
            url: `${API_BASE_URL}${path}`,
            isImage: file.type.startsWith(IMAGE_MIME_PREFIX),
          });
        },
        onError: onUploadError,
      },
    );
  };

  return (
    <>
      <AppTooltip title={t("tickets.detail.attachment_tooltip")}>
        <IconButton
          type="button"
          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
          onClick={() => !uploading && fileInputRef.current?.click()}
          sx={{
            p: 0,
            width: "28px",
            height: "28px",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            color: "var(--muted2)",
            display: "grid",
            placeItems: "center",
            opacity: uploading ? 0.5 : 1,
            transition: "color .15s ease",
            "&:hover": { color: "var(--accent)" },
          }}
        >
          {uploading ? (
            <CircularProgress size={12} />
          ) : (
            <AttachFileOutlined sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </AppTooltip>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileChange}
      />
    </>
  );
};
