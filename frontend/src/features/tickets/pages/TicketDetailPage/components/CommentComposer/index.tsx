import React, { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import SendRounded from "@mui/icons-material/SendRounded";
import FormatBoldRounded from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRounded from "@mui/icons-material/FormatItalicRounded";
import CodeRounded from "@mui/icons-material/CodeRounded";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useT } from "@/i18n/I18nContext";
import { useTheme } from "@/store/ThemeContext";
import { DetailPalette } from "../../helpers";
import { uploadAttachment } from "@/features/tickets/api/tickets";
import { MarkdownEditor, MarkdownEditorHandle } from "@/components/MarkdownEditor";
import { CommentMode, Theme } from "@/types/enums";

type Mode = CommentMode;

interface Attachment {
  fileName: string;
  url: string;
  isImage: boolean;
}

interface Props {
  ticketId: string;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  value: string;
  onValueChange: (v: string) => void;
  submitting: boolean;
  onSubmit: (content: string) => void;
  palette: DetailPalette;
  fieldSx: object;
  markdownSx: object;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const CommentComposer: React.FC<Props> = ({
  ticketId,
  mode,
  onModeChange,
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

  const editorRef = useRef<MarkdownEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const hasContent = value.trim().length > 0 || attachments.length > 0;

  const applyWrap = (before: string, after: string) => {
    editorRef.current?.applyWrap(before, after);
  };

  const applyCode = () => {
    // Use code block if selection spans multiple lines, else inline
    const [from, to] = editorRef.current?.getSelection() ?? [0, 0];
    const selected = value.slice(from, to);
    if (selected.includes("\n")) applyWrap("```\n", "\n```");
    else applyWrap("`", "`");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const created = await uploadAttachment(ticketId, file);
      const path = `/api/tickets/${ticketId}/attachments/${created.id}`;
      setAttachments((prev) => [
        ...prev,
        { fileName: created.fileName, url: `${BASE_URL}${path}`, isImage: file.type.startsWith("image/") },
      ]);
    } catch {
      // upload failed
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const buildFullContent = (): string => {
    if (attachments.length === 0) return value;
    const links = attachments
      .map((a) => (a.isImage ? `![${a.fileName}](${a.url})` : `[${a.fileName}](${a.url})`))
      .join("\n");
    const base = value.trimEnd();
    return base
      ? `${base}\n\n<!-- attachments -->\n${links}`
      : `<!-- attachments -->\n${links}`;
  };

  const handleSubmit = () => {
    const content = buildFullContent();
    if (!content.trim()) return;
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
      {/* tab strip */}
      <Box
        sx={{
          display: "inline-flex",
          p: "3px",
          background: palette.tabStripBg,
          border: `1px solid ${palette.tabStripBorder}`,
          borderRadius: "var(--r-md)",
          mb: "8px",
          gap: "3px",
        }}
      >
        {[
          {
            key: "reply" as const,
            label: t("tickets.detail.tab_reply"),
            icon: <MessageOutlined sx={{ fontSize: 14 }} />,
          },
          {
            key: "internal" as const,
            label: t("tickets.detail.tab_internal_note"),
            icon: <LockOutlined sx={{ fontSize: 14 }} />,
          },
        ].map((tab) => {
          const active = mode === tab.key;
          return (
            <Box
              key={tab.key}
              component="button"
              onClick={() => onModeChange(tab.key)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                px: "12px",
                height: "34px",
                borderRadius: "var(--r)",
                color: active ? palette.tabActiveFg : palette.tabIdleFg,
                background: active ? palette.tabActiveBg : "transparent",
                boxShadow: active ? palette.tabActiveShadow : "none",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {tab.icon}
              {tab.label}
            </Box>
          );
        })}
      </Box>

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
          placeholder={
            mode === "internal"
              ? t("tickets.detail.composer_internal_placeholder")
              : t("tickets.detail.composer_reply_placeholder")
          }
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
                key={i}
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
                  <InsertDriveFileOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
                )}
                <Box
                  component="span"
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
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
          <Tooltip title="Gras" placement="top">
            <Box
              component="button"
              onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
              onClick={() => applyWrap("**", "**")}
              sx={toolbarBtnSx}
            >
              <FormatBoldRounded sx={{ fontSize: 16 }} />
            </Box>
          </Tooltip>
          <Tooltip title="Italique" placement="top">
            <Box
              component="button"
              onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
              onClick={() => applyWrap("*", "*")}
              sx={toolbarBtnSx}
            >
              <FormatItalicRounded sx={{ fontSize: 16 }} />
            </Box>
          </Tooltip>
          <Tooltip title="Code" placement="top">
            <Box
              component="button"
              onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
              onClick={applyCode}
              sx={toolbarBtnSx}
            >
              <CodeRounded sx={{ fontSize: 16 }} />
            </Box>
          </Tooltip>
          <Tooltip title="Lien" placement="top">
            <Box
              component="button"
              onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
              onClick={() => editorRef.current?.insertLink()}
              sx={toolbarBtnSx}
            >
              <LinkOutlined sx={{ fontSize: 16 }} />
            </Box>
          </Tooltip>
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
            disableElevation
            onClick={handleSubmit}
            disabled={!hasContent || submitting}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              textTransform: "none",
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
              color: "#fff",
              boxShadow: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
                boxShadow: "none",
                transform: "none",
              },
              minWidth: "100px",
              height: "32px",
              borderRadius: "var(--r)",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            {!submitting ? (
              <SendRounded sx={{ fontSize: 15 }} />
            ) : (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            )}
            {t("tickets.detail.send")}
          </Button>
        </Box>
      </Box>

    </Box>
  );
};
