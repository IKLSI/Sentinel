import type React from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";

interface Props {
  emptyLabel: string;
  isEmpty: boolean;
  multiSelectable?: boolean;
  children: ReactNode;
}

export const OptionList: React.FC<Props> = ({
  emptyLabel,
  isEmpty,
  multiSelectable,
  children,
}) => (
  <Box
    role="listbox"
    aria-multiselectable={multiSelectable}
    sx={{ p: "5px", maxHeight: "240px", overflowY: "auto" }}
  >
    {isEmpty ? (
      <Box
        sx={{
          py: "14px",
          textAlign: "center",
          fontSize: "11.5px",
          color: "var(--muted)",
        }}
      >
        {emptyLabel}
      </Box>
    ) : (
      children
    )}
  </Box>
);
