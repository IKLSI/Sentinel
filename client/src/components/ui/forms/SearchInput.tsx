import type React from "react";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string | number;
  sx?: SxProps<Theme>;
  inputRef?: React.Ref<HTMLInputElement>;
  onEscape?: () => void;
}

export const SearchInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  width = "280px",
  sx,
  inputRef,
  onEscape,
}) => (
  <OutlinedInput
    size="small"
    inputRef={inputRef}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Escape") onEscape?.();
    }}
    startAdornment={
      <InputAdornment position="start">
        <SearchOutlined sx={{ color: "var(--muted)", fontSize: "14px" }} />
      </InputAdornment>
    }
    sx={{
      width,
      height: "32px",
      fontSize: "12.5px",
      background: "var(--s1)",
      ...sx,
    }}
  />
);
