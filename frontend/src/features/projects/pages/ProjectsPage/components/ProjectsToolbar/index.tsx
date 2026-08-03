import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import CloudDownloadOutlined from "@mui/icons-material/CloudDownloadOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { useT } from "@/contexts/I18nContext";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onImport?: () => void;
  onExport: () => void;
  exporting: boolean;
}

export const ProjectsToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  onImport,
  onExport,
  exporting,
}) => {
  const t = useT();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: "16px",
        flexShrink: 0,
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Box
          sx={{
            width: "280px",
            maxWidth: "52vw",
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
          }}
        >
          <SearchOutlined
            sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
          />
          <Box
            component="input"
            type="text"
            placeholder={t("projects.search_placeholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
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
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {onImport && (
          <Button
            variant="contained"
            size="small"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              height: "32px",
              px: "14px",
            }}
            onClick={onImport}
          >
            <CloudDownloadOutlined sx={{ fontSize: 14 }} />
            {t("projects.import_repos")}
          </Button>
        )}
        <Button
          variant="contained"
          color="secondary"
          size="small"
          disabled={exporting}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
          onClick={onExport}
        >
          {exporting ? (
            <CircularProgress size={12} sx={{ color: "#fff" }} />
          ) : (
            <FileDownloadOutlined sx={{ fontSize: 14 }} />
          )}
          {t("projects.export")}
        </Button>
      </Box>
    </Box>
  );
};
