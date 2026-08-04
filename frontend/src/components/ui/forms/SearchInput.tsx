import type React from "react";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string | number;
  sx?: SxProps<Theme>;
}

export const SearchInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  width = "280px",
  sx,
}) => (
  <Box
    sx={{
      width,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      px: "10px",
      height: "32px",
      transition: "border-color 0.15s, box-shadow 0.15s",
      "&:focus-within": {
        borderColor: "var(--accent-border)",
        boxShadow: "0 0 0 3px var(--accent-subtle)",
      },
      ...sx,
    }}
  >
    <SearchOutlined
      sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
    />
    <Box
      component="input"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      sx={{
        all: "unset",
        flex: 1,
        fontSize: "12.5px",
        color: "var(--text)",
        fontFamily: "var(--font-ui)",
        "&::placeholder": { color: "var(--muted)" },
        "&:focus": { outline: "none", boxShadow: "none !important" },
      }}
    />
  </Box>
);
