import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useT } from "@/contexts/I18nContext";
import { AppModal } from "@/components/ui/common/AppModal";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { NO_HOVER_ELEVATION } from "@/features/styleGuide/pages/StyleGuidePage/constants";

export const ModalsSection: React.FC = () => {
  const t = useT();
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("Sentinel API");

  return (
    <>
      <Section
        title={t("style_guide.section.modals")}
        desc={t("style_guide.section.modals_desc")}
      >
        <Box sx={{ display: "flex", gap: "10px" }}>
          <Button variant="outlined" onClick={() => setAppModalOpen(true)}>
            {t("style_guide.modal_demo.open_app")}
          </Button>
          <Button variant="outlined" onClick={() => setDeleteModalOpen(true)}>
            {t("style_guide.modal_demo.open_delete")}
          </Button>
        </Box>
      </Section>

      <AppModal
        open={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        title={t("style_guide.modal_demo.app_title")}
        actions={
          <>
            <Button variant="text" onClick={() => setAppModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => setAppModalOpen(false)}
              sx={NO_HOVER_ELEVATION}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <TextField
          fullWidth
          size="small"
          label={t("style_guide.modal_demo.app_body_label")}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </AppModal>

      <DeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => setDeleteModalOpen(false)}
        title={t("style_guide.modal_demo.delete_title")}
      >
        {t("style_guide.modal_demo.delete_body")}
      </DeleteModal>
    </>
  );
};
