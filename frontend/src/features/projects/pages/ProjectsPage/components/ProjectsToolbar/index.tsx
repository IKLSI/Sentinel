import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { useT } from "@/i18n/I18nContext";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
  onExport: () => void;
  exporting: boolean;
}

export const ProjectsToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  onCreate,
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
            borderRadius: "9px",
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
              fontSize: "14px",
              color: "var(--text)",
              fontFamily: "var(--font-ui)",
              "&::placeholder": { color: "var(--muted)" },
              "&:focus": { outline: "none", boxShadow: "none !important" },
            }}
          />
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Button
          variant="contained"
          size="small"
          sx={{
            textTransform: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            "&.MuiButton-root": {
              background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 100%), var(--accent)",
              color: "#fff",
              boxShadow: "none",
              height: "32px",
              px: "14px",
            },
            "&.MuiButton-root:hover": {
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
              boxShadow: "none",
              transform: "none",
            },
          }}
          onClick={onCreate}
        >
          <AddOutlined sx={{ fontSize: 14 }} />
          {t("projects.new_project")}
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={exporting}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            textTransform: "none",
            background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 100%), #7C6FCD",
            borderColor: "transparent",
            color: "#fff",
            "&:hover": {
              background: "linear-gradient(135deg, #6A5EB8 0%, #7C6FCD 100%)",
              borderColor: "transparent",
              color: "#fff",
            },
            "&.Mui-disabled": { color: "#fff", opacity: 0.7 },
          }}
          onClick={onExport}
        >
          {exporting ? (
            <CircularProgress
              size={12}
              sx={{ color: "#fff" }}
            />
          ) : (
            <FileDownloadOutlined sx={{ fontSize: 14 }} />
          )}
          {t("projects.export")}
        </Button>
      </Box>
    </Box>
  );
};
