import type React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";

const ANALYSIS_TOPICS = [
  "dependencies",
  "migrations",
  "configuration",
  "runtimes",
  "notes",
] as const;

export const AnalysisInfo: React.FC = () => {
  const t = useT();

  return (
    <AppTooltip
      placement="bottom-end"
      title={
        <Box sx={{ maxWidth: "260px", py: "4px" }}>
          <Box sx={{ fontWeight: 700, mb: "6px" }}>
            {t("deployments.info.title")}
          </Box>
          <Box
            component="ul"
            sx={{
              m: 0,
              p: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {ANALYSIS_TOPICS.map((topic) => (
              <Box component="li" key={topic}>
                {t(`deployments.info.${topic}`)}
              </Box>
            ))}
          </Box>
        </Box>
      }
    >
      <IconButton size="small" aria-label={t("deployments.info.title")}>
        <InfoOutlined sx={{ fontSize: 18 }} />
      </IconButton>
    </AppTooltip>
  );
};
