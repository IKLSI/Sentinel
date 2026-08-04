import type React from "react";
import { useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormatBoldRounded from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRounded from "@mui/icons-material/FormatItalicRounded";
import CodeRounded from "@mui/icons-material/CodeRounded";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Theme } from "@/enums";
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "@/components/ui/forms/MarkdownEditor";

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
  preview: _preview,
  onPreviewChange: _onPreviewChange,
  saving,
  onSubmit,
  markdownSx: _markdownSx,
  fieldSx: _fieldSx,
}) => {
  const t = useT();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const applyWrap = (before: string, after: string) => {
    editorRef.current?.applyWrap(before, after);
  };

  const applyCode = () => {
    const [from, to] = editorRef.current?.getSelection() ?? [0, 0];
    const selected = value.slice(from, to);
    if (selected.includes("\n")) applyWrap("```\n", "\n```");
    else applyWrap("`", "`");
  };

  const toolbarBtnSx = {
    all: "unset" as const,
    width: "26px",
    height: "26px",
    borderRadius: "var(--r-sm)",
    cursor: "pointer",
    color: "var(--muted)",
    display: "grid",
    placeItems: "center",
    "&:hover": { background: "var(--s3)", color: "var(--text)" },
  };

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
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* formatting toolbar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <Box
            component="button"
            onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
            onClick={() => applyWrap("**", "**")}
            sx={toolbarBtnSx}
          >
            <FormatBoldRounded sx={{ fontSize: 15 }} />
          </Box>
          <Box
            component="button"
            onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
            onClick={() => applyWrap("*", "*")}
            sx={toolbarBtnSx}
          >
            <FormatItalicRounded sx={{ fontSize: 15 }} />
          </Box>
          <Box
            component="button"
            onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
            onClick={applyCode}
            sx={toolbarBtnSx}
          >
            <CodeRounded sx={{ fontSize: 15 }} />
          </Box>
          <Box
            component="button"
            onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
            onClick={() => editorRef.current?.insertLink()}
            sx={toolbarBtnSx}
          >
            <LinkOutlined sx={{ fontSize: 15 }} />
          </Box>
          <Box sx={{ flex: 1 }} />
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

        {/* editor */}
        <Box
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            background: "var(--s2)",
            cursor: "text",
            minHeight: "200px",
          }}
          onClick={() => editorRef.current?.focus()}
        >
          <MarkdownEditor
            ref={editorRef}
            value={value}
            onChange={onValueChange}
            onSubmit={onSubmit}
            minHeight={180}
            isDark={isDark}
            autoFocus
          />
        </Box>
      </Box>
    </AppModal>
  );
};
