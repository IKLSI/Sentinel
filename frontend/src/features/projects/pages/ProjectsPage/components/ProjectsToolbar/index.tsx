import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CloudDownloadOutlined from "@mui/icons-material/CloudDownloadOutlined";
import { useT } from "@/contexts/I18nContext";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { ExportButton } from "@/components/ui/common/ExportButton";

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
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("projects.search_placeholder")}
          sx={{ maxWidth: "52vw" }}
        />
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
        <ExportButton
          onClick={onExport}
          exporting={exporting}
          label={t("projects.export")}
        />
      </Box>
    </Box>
  );
};
