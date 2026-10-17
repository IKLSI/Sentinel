import type React from "react";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { useT } from "@/contexts/I18nContext";

interface Props {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onEscape: () => void;
}

export const RepoSearchInput: React.FC<Props> = ({
  inputRef,
  value,
  onChange,
  onEscape,
}) => {
  const t = useT();

  return (
    <Box sx={{ px: "20px", pt: "16px", pb: "0", flexShrink: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          px: "10px",
          height: "32px",
          transition: "border-color 0.15s, box-shadow 0.15s",
          "&:focus-within": {
            borderColor: "var(--accent-border)",
            boxShadow: "0 0 0 3px var(--accent-subtle)",
          },
        }}
      >
        <SearchOutlined
          sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
        />
        <Box
          component="input"
          ref={inputRef}
          placeholder={t("projects.search_placeholder")}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Escape") onEscape();
          }}
          sx={{
            all: "unset",
            flex: 1,
            fontSize: "12.5px",
            color: "var(--text)",
            "&::placeholder": { color: "var(--muted)" },
            "&:focus": { outline: "none", boxShadow: "none !important" },
          }}
        />
      </Box>
    </Box>
  );
};
