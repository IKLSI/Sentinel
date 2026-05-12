import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { useT } from "@/i18n/I18nContext";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DeleteModal } from "@/components/DeleteModal";
import { extractApiError } from "@/utils/apiError";
import {
  TicketAttachment,
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment,
} from "@/features/tickets/api/tickets";
import { DetailPalette } from "../../helpers";

interface Props {
  ticketId: string;
  palette: DetailPalette;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];


export const AttachmentsCard: React.FC<Props> = ({ ticketId, palette }) => {
  const t = useT();
  const { showToast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TicketAttachment | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    listAttachments(ticketId)
      .then(setItems)
      .catch(() => showToast(t("tickets.detail.attachments_load_error"), "error"))
      .finally(() => setLoading(false));
  }, [ticketId, showToast, t]);

  const triggerPick = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      showToast(t("tickets.detail.attachments_size_too_big"), "error");
      return;
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      showToast(t("tickets.detail.attachments_type_not_allowed"), "error");
      return;
    }
    setUploading(true);
    try {
      const created = await uploadAttachment(ticketId, file);
      setItems((prev) => [created, ...prev]);
      showToast(t("tickets.detail.attachments_upload_success"), "success");
    } catch (err) {
      showToast(
        extractApiError(err, t("tickets.detail.attachments_upload_error")),
        "error",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (attachment: TicketAttachment) => {
    try {
      await downloadAttachment(ticketId, attachment.id, attachment.fileName);
    } catch (err) {
      showToast(
        extractApiError(err, t("tickets.detail.attachments_download_error")),
        "error",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAttachment(ticketId, deleteTarget.id);
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast(t("tickets.detail.attachments_delete_success"), "success");
    } catch (err) {
      showToast(
        extractApiError(err, t("tickets.detail.attachments_delete_error")),
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (a: TicketAttachment) =>
    isAdmin || a.uploadedById === user?.id;

  return (
    <Box
      sx={{
        border: `1px solid ${palette.panelBorder}`,
        borderRadius: "var(--r-xl)",
        background: palette.panelBg,
        boxShadow: palette.panelShadow,
        p: "8px 6px 8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "10px",
          pt: "4px",
          pb: "6px",
        }}
      >
        <Box
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontWeight: 800,
            color: palette.muted,
            fontSize: "10px",
          }}
        >
          {t("tickets.detail.section_attachments")}
          {items.length > 0 ? ` · ${items.length}` : ""}
        </Box>
        <Tooltip title={t("tickets.detail.attachments_add")} arrow>
          <Box component="span">
            <IconButton
              size="small"
              onClick={triggerPick}
              disabled={uploading}
              sx={{
                color: palette.iconBtnIdle,
                "&:hover": { color: "var(--accent)" },
              }}
            >
              {uploading ? (
                <CircularProgress size={14} />
              ) : (
                <AddOutlined sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>
        </Tooltip>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: "10px" }}>
          <CircularProgress size={16} />
        </Box>
      ) : items.length === 0 ? (
        <Box
          sx={{
            px: "10px",
            py: "12px",
            color: palette.muted,
            fontSize: "11px",
            fontStyle: "italic",
          }}
        >
          {t("tickets.detail.attachments_empty")}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {items.map((a, idx) => (
            <Box key={a.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  px: "10px",
                  py: "8px",
                  borderRadius: "var(--r)",
                  "&:hover": { background: palette.fieldRowHover },
                }}
              >
                <AttachFileOutlined
                  sx={{ fontSize: 14, color: palette.folderIcon, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    title={a.fileName}
                    sx={{
                      color: palette.fieldValue,
                      fontSize: "12px",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.fileName}
                  </Box>
                  <Box
                    sx={{
                      color: palette.muted,
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {a.uploadedByName}
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(a)}
                  sx={{
                    color: palette.iconBtnIdle,
                    "&:hover": {
                      background: palette.iconBtnEditHoverBg,
                      color: palette.iconBtnEditHoverFg,
                    },
                  }}
                >
                  <FileDownloadOutlined sx={{ fontSize: 14 }} />
                </IconButton>
                {canDelete(a) && (
                  <IconButton
                    size="small"
                    onClick={() => setDeleteTarget(a)}
                    sx={{
                      color: palette.iconBtnIdle,
                      "&:hover": {
                        background: palette.iconBtnDelHoverBg,
                        color: palette.iconBtnDelHoverFg,
                      },
                    }}
                  >
                    <DeleteOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {idx < items.length - 1 && (
                <Box
                  sx={{ mx: "8px", height: "1px", background: palette.fieldSep }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("tickets.detail.attachments_delete_title")}
      >
        {t("tickets.detail.attachments_delete_message")}
      </DeleteModal>
    </Box>
  );
};
