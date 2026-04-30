import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import SendRounded from "@mui/icons-material/SendRounded";
import FormatBoldRounded from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRounded from "@mui/icons-material/FormatItalicRounded";
import CodeRounded from "@mui/icons-material/CodeRounded";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import { useT } from "@/i18n/I18nContext";
import { DetailPalette } from "../../helpers";

type Mode = "reply" | "internal";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  value: string;
  onValueChange: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  palette: DetailPalette;
  fieldSx: object;
}

export const CommentComposer: React.FC<Props> = ({
  mode,
  onModeChange,
  value,
  onValueChange,
  submitting,
  onSubmit,
  palette,
  fieldSx,
}) => {
  const t = useT();

  return (
    <Box sx={{ mt: "28px" }}>
      <Box
        sx={{
          display: "inline-flex",
          p: "3px",
          background: palette.tabStripBg,
          border: `1px solid ${palette.tabStripBorder}`,
          borderRadius: "12px",
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
                borderRadius: "10px",
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
          borderRadius: "16px",
          overflow: "hidden",
          background: palette.composerBg,
        }}
      >
        <Box
          component="textarea"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onValueChange(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim())
              onSubmit();
          }}
          rows={4}
          placeholder={
            mode === "internal"
              ? t("tickets.detail.composer_internal_placeholder")
              : t("tickets.detail.composer_reply_placeholder")
          }
          sx={{
            ...fieldSx,
            border: "none",
            borderRadius: 0,
            boxShadow: "none !important",
            px: "16px",
            py: "12px",
            resize: "vertical",
            minHeight: "90px",
          }}
        />
        <Box sx={{ height: "1px", background: palette.composerDivider }} />
        <Box
          sx={{
            px: "12px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {[
            <FormatBoldRounded key="b" sx={{ fontSize: 16 }} />,
            <FormatItalicRounded key="i" sx={{ fontSize: 16 }} />,
            <CodeRounded key="c" sx={{ fontSize: 16 }} />,
            <LinkOutlined key="l" sx={{ fontSize: 16 }} />,
            <AttachFileOutlined key="a" sx={{ fontSize: 16 }} />,
          ].map((icon, idx) => (
            <Box
              key={idx}
              component="button"
              sx={{
                all: "unset",
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                cursor: "pointer",
                color: palette.toolbarIdle,
                display: "grid",
                placeItems: "center",
                "&:hover": {
                  background: palette.toolbarHoverBg,
                  color: palette.toolbarHoverFg,
                },
              }}
            >
              {icon}
            </Box>
          ))}
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!value.trim() || submitting}
            sx={{
              minWidth: "120px",
              height: "36px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "13px",
              background: palette.sendBtnGradient,
            }}
            endIcon={
              !submitting ? <SendRounded sx={{ fontSize: 15 }} /> : undefined
            }
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
