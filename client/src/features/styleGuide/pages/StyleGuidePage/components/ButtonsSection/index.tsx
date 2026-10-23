import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import { useT } from "@/contexts/I18nContext";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";

const ROW_SX = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "10px",
  mb: "24px",
} as const;

export const ButtonsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.buttons")}
      desc={t("style_guide.section.buttons_desc")}
    >
      <SubLabel>Variants</SubLabel>
      <Box sx={ROW_SX}>
        <Button variant="contained">{t("common.save")}</Button>
        <Button variant="contained" color="secondary">
          Export
        </Button>
        <Button variant="contained" color="inherit">
          {t("common.cancel")}
        </Button>
        <Button variant="contained" color="error">
          {t("common.delete")}
        </Button>
        <Button variant="outlined">{t("common.edit")}</Button>
        <Button variant="text">{t("common.cancel")}</Button>
      </Box>

      <SubLabel>Sizes</SubLabel>
      <Box sx={ROW_SX}>
        <Button variant="contained" size="small">
          Small
        </Button>
        <Button variant="contained" size="medium">
          Default
        </Button>
        <Button variant="contained" size="large">
          Large
        </Button>
      </Box>

      <SubLabel>With icons</SubLabel>
      <Box sx={ROW_SX}>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined sx={{ fontSize: 16 }} />}
        >
          Download
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardOutlined sx={{ fontSize: 16 }} />}
        >
          Next
        </Button>
        <IconButton
          sx={{
            border: "1px solid var(--border2)",
            borderRadius: "var(--r)",
            width: 36,
            height: 36,
            color: "var(--red)",
          }}
        >
          <DeleteOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <SubLabel>States</SubLabel>
      <Box sx={{ ...ROW_SX, mb: 0 }}>
        <Button variant="contained" disabled>
          {t("common.save")}
        </Button>
        <Button variant="outlined" disabled>
          {t("common.edit")}
        </Button>
        <Button
          variant="contained"
          disabled
          startIcon={<CircularProgress size={12} color="inherit" />}
        >
          {t("common.deleting")}
        </Button>
      </Box>
    </Section>
  );
};
