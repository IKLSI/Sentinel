import type React from "react";
import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { DetailPalette } from "@/features/tickets/pages/TicketDetailPage/helpers";
import { useUploadAttachmentMutation } from "@/domains/tickets/mutations";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { API_BASE_URL } from "@/configs/env";
import { buildUrl } from "@/helpers/url";
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "@/components/ui/forms/MarkdownEditor";
import { Theme } from "@/enums";
import { commentContentSchema } from "@/features/tickets/pages/TicketDetailPage/schemas";

interface Attachment {
  fileName: string;
  url: string;
  isImage: boolean;
}

interface Props {
  ticketId: string;
  value: string;
  onValueChange: (v: string) => void;
  submitting: boolean;
  onSubmit: (content: string) => void;
  palette: DetailPalette;
  fieldSx: object;
  markdownSx: object;
}

const BASE_URL = API_BASE_URL;
const ATTACHMENT_FORM_FIELD = "file";
const IMAGE_MIME_PREFIX = "image/";

export const CommentComposer: React.FC<Props> = ({
  ticketId,
  value,
  onValueChange,
  submitting,
  onSubmit,
  palette,
  fieldSx: _fieldSx,
  markdownSx: _markdownSx,
}) => {
  const t = useT();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const { showToast } = useToast();
  const apiError = useApiError();

  const editorRef = useRef<MarkdownEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const uploadMutation = useUploadAttachmentMutation();
  const uploading = uploadMutation.isPending;

  const hasContent = value.trim().length > 0 || attachments.length > 0;

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
          setAttachments((prev) => [
            ...prev,
            {
              fileName: created.fileName ?? file.name,
              url: `${BASE_URL}${path}`,
              isImage: file.type.startsWith(IMAGE_MIME_PREFIX),
            },
          ]);
        },
        onError: (err) =>
          showToast(
            apiError(err, t("tickets.detail.attachments_upload_error")),
            "error",
          ),
      },
    );
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const buildFullContent = (): string => {
    if (attachments.length === 0) return value;
    const links = attachments
      .map((a) =>
        a.isImage ? `![${a.fileName}](${a.url})` : `[${a.fileName}](${a.url})`,
      )
      .join("\n");
    const base = value.trimEnd();
    return base
      ? `${base}\n\n<!-- attachments -->\n${links}`
      : `<!-- attachments -->\n${links}`;
  };

  const handleSubmit = () => {
    const content = buildFullContent();
    if (!commentContentSchema.safeParse(content).success) return;
    onSubmit(content);
    setAttachments([]);
  };

  const toolbarBtnSx = {
    all: "unset" as const,
    width: "28px",
    height: "28px",
    borderRadius: "var(--r-sm)",
    cursor: "pointer",
    color: palette.toolbarIdle,
    display: "grid",
    placeItems: "center",
    "&:hover": {
      background: palette.toolbarHoverBg,
      color: palette.toolbarHoverFg,
    },
  };

  return (
    <Box sx={{ mt: "28px" }}>
      <Box
        sx={{
          border: `1px solid ${palette.composerBorder}`,
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          background: palette.composerBg,
          cursor: "text",
        }}
        onClick={() => editorRef.current?.focus()}
      >
        <MarkdownEditor
          ref={editorRef}
          value={value}
          onChange={onValueChange}
          onSubmit={handleSubmit}
          placeholder={t("tickets.detail.composer_reply_placeholder")}
          minHeight={90}
          isDark={isDark}
        />

        {/* attachment chips */}
        {attachments.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${palette.composerDivider}`,
              px: "12px",
              py: "8px",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            {attachments.map((a, i) => (
              <Box
                key={a.url}
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
                  maxWidth: "200px",
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
                <Box
                  component="button"
                  onClick={() => removeAttachment(i)}
                  sx={{
                    all: "unset",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    color: palette.toolbarIdle,
                    borderRadius: "50%",
                    width: "14px",
                    height: "14px",
                    flexShrink: 0,
                    "&:hover": { color: palette.toolbarHoverFg },
                  }}
                >
                  <CloseRounded sx={{ fontSize: 11 }} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ height: "1px", background: palette.composerDivider }} />

        {/* toolbar + send */}
        <Box
          sx={{
            px: "12px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="Pièce jointe" placement="top">
            <Box
              component="button"
              onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
              onClick={() => !uploading && fileInputRef.current?.click()}
              sx={{ ...toolbarBtnSx, opacity: uploading ? 0.5 : 1 }}
            >
              {uploading ? (
                <CircularProgress size={12} />
              ) : (
                <AttachFileOutlined sx={{ fontSize: 16 }} />
              )}
            </Box>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
          />
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={!hasContent || submitting}
            sx={{
              textTransform: "none",
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
              boxShadow: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
                boxShadow: "none",
                transform: "none",
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
            ) : (
              t("tickets.detail.send")
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
