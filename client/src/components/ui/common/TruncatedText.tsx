import type React from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useIsTextTruncated } from "@/hooks/useIsTextTruncated";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  text: string;
  mono?: boolean;
  strong?: boolean;
  fontSize?: string;
}

export const TruncatedText: React.FC<Props> = ({
  text,
  mono,
  strong,
  fontSize,
}) => {
  const { ref, truncated } = useIsTextTruncated<HTMLSpanElement>();

  return (
    <AppTooltip title={text} disableHoverListener={!truncated}>
      <Box
        component="span"
        ref={ref}
        sx={{
          display: "block",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontSize: fontSize ?? (mono ? "11px" : "12px"),
          fontWeight: strong ? 600 : 400,
          color: "inherit",
          ...TEXT_ELLIPSIS_SX,
        }}
      >
        {text}
      </Box>
    </AppTooltip>
  );
};
