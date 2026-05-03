import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ReactMarkdown from "react-markdown";
import { AppModal } from "@/components/AppModal";
import { useT } from "@/i18n/I18nContext";

interface Props {
  open: boolean;
  onClose: () => void;
  value: string;
  onValueChange: (v: string) => void;
  preview: boolean;
  onPreviewChange: (preview: boolean) => void;
  saving: boolean;
  onSubmit: () => void;
  markdownSx: object;
  fieldSx: object;
}

export const EditCommentModal: React.FC<Props> = ({
  open,
  onClose,
  value,
  onValueChange,
  preview,
  onPreviewChange,
  saving,
  onSubmit,
  markdownSx,
  fieldSx,
}) => {
  const t = useT();
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
            sx={{ textTransform: "none" }}
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none", background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)", boxShadow: "none", "&:hover": { background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)", boxShadow: "none", transform: "none" } }}
            onClick={onSubmit}
            disabled={!value.trim() || saving}
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: "4px",
              background: "var(--s2)",
              border: "1px solid var(--border)",
              borderRadius: 'var(--r)',
              p: "3px",
            }}
          >
            {(
              [
                { key: "edit", label: t("tickets.detail.tab_edit") },
                { key: "preview", label: t("tickets.detail.tab_preview") },
              ] as const
            ).map((tab) => {
              const active = tab.key === "edit" ? !preview : preview;
              return (
                <Box
                  key={tab.key}
                  component="button"
                  onClick={() => onPreviewChange(tab.key === "preview")}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    px: "12px",
                    height: "26px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: 'var(--r-sm)',
                    display: "flex",
                    alignItems: "center",
                    background: active ? "var(--s1)" : "transparent",
                    color: active ? "var(--text)" : "var(--muted)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    transition: "all 0.12s",
                  }}
                >
                  {tab.label}
                </Box>
              );
            })}
          </Box>
          <Box
            sx={{
              fontSize: "10px",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {t("tickets.detail.markdown_supported")}
          </Box>
        </Box>
        {preview ? (
          <Box
            sx={{
              background: "var(--s2)",
              border: "1px solid var(--border)",
              borderRadius: 'var(--r)',
              p: "14px 16px",
              minHeight: "150px",
              ...markdownSx,
            }}
          >
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
                {t("tickets.detail.preview_empty")}
              </Box>
            )}
          </Box>
        ) : (
          <Box
            component="textarea"
            autoFocus
            value={value}
            rows={7}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onValueChange(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim())
                onSubmit();
            }}
            sx={{ ...fieldSx, resize: "none", lineHeight: 1.65 }}
          />
        )}
      </Box>
    </AppModal>
  );
};
