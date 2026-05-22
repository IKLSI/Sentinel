import React, { Suspense, lazy } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { MarkdownEditorHandle as Handle } from "./MarkdownEditorImpl";

export type MarkdownEditorHandle = Handle;

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  minHeight?: number;
  isDark?: boolean;
  autoFocus?: boolean;
}

const Impl = lazy(() =>
  import("./MarkdownEditorImpl").then((m) => ({ default: m.MarkdownEditor })),
);

const Fallback: React.FC<{ minHeight: number }> = ({ minHeight }) => (
  <Box
    sx={{
      minHeight: `${minHeight}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress size={18} />
  </Box>
);

export const MarkdownEditor = React.forwardRef<MarkdownEditorHandle, Props>(
  (props, ref) => (
    <Suspense fallback={<Fallback minHeight={props.minHeight ?? 90} />}>
      <Impl {...props} ref={ref} />
    </Suspense>
  ),
);

MarkdownEditor.displayName = "MarkdownEditor";
