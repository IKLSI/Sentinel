import type React from "react";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
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
  <InputBase
    fullWidth
    autoFocus
    placeholder={placeholder}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    onKeyDown={onKeyDown}
    startAdornment={
      <InputAdornment position="start">
        <SearchOutlined sx={{ fontSize: 14, color: "var(--muted)" }} />
      </InputAdornment>
    }
    sx={{
      px: "11px",
      py: "9px",
      fontSize: "12.5px",
      color: "var(--text)",
      borderBottom: divider ? "1px solid var(--border)" : "none",
      "& .MuiInputBase-input": { p: 0 },
      "& .MuiInputBase-input::placeholder": {
        color: "var(--muted)",
        opacity: 1,
      },
    }}
  />
);
