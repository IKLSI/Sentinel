import type React from "react";
import { useRef } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import {
  AttachmentChip,
  type CommentAttachment,
} from "@/components/ui/common/AttachmentChip";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  minHeight?: number;
  borderColor?: string;
  attachments?: CommentAttachment[];
  onRemoveAttachment?: (index: number) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  actions?: React.ReactNode;
}

const DEFAULT_MIN_HEIGHT = 90;

export const CommentEditor: React.FC<Props> = ({
  value,
  onValueChange,
  onSubmit,
  placeholder,
  minHeight = DEFAULT_MIN_HEIGHT,
  borderColor = "var(--border)",
  attachments = [],
  onRemoveAttachment,
  inputRef,
  actions,
}) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? localRef;

  return (
    <Box
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        background: "var(--s1)",
        cursor: "text",
      }}
      onClick={() => textareaRef.current?.focus()}
    >
      <InputBase
        multiline
        fullWidth
        inputRef={textareaRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        sx={{
          display: "block",
          p: "12px 16px",
          fontSize: "13px",
          lineHeight: 1.65,
          color: "var(--text)",
          "& .MuiInputBase-inputMultiline": {
            minHeight: `${minHeight}px`,
            p: 0,
            wordBreak: "break-word",
          },
          "& .MuiInputBase-input::placeholder": {
            color: "var(--muted2)",
            opacity: 1,
          },
        }}
      />

      {attachments.length > 0 && (
        <Box
          sx={{
            borderTop: "1px solid var(--border)",
            px: "12px",
            py: "8px",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          {attachments.map((attachment, index) => (
            <AttachmentChip
              key={attachment.url}
              attachment={attachment}
              onRemove={
                onRemoveAttachment ? () => onRemoveAttachment(index) : undefined
              }
            />
          ))}
        </Box>
      )}

      {actions && (
        <>
          <Box sx={{ height: "1px", background: "var(--border)" }} />
          <Box
            sx={{
              px: "12px",
              py: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {actions}
          </Box>
        </>
      )}
    </Box>
  );
};
