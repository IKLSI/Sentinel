import type React from "react";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";

interface Props {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  divider?: boolean;
}

export const PopoverSearch: React.FC<Props> = ({
  placeholder,
  value,
  onChange,
  onKeyDown,
  divider,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      px: "11px",
      py: "9px",
      borderBottom: divider ? "1px solid var(--border)" : "none",
    }}
  >
    <SearchOutlined sx={{ fontSize: 14, color: "var(--muted)" }} />
    <Box
      component="input"
      type="text"
      autoFocus
      placeholder={placeholder}
      value={value}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
      onKeyDown={onKeyDown}
      sx={{
        all: "unset",
        flex: 1,
        fontFamily: "var(--font-ui)",
        fontSize: "12.5px",
        color: "var(--text)",
        "&::placeholder": { color: "var(--muted)" },
        "&:focus": { outline: "none", boxShadow: "none" },
      }}
    />
  </Box>
);
