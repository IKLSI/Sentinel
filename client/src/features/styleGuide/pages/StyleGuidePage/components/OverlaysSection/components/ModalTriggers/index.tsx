import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { DeleteModal } from "@/components/ui/common/modal/DeleteModal";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import { SAMPLE_TICKET_REFERENCE } from "@/features/styleGuide/pages/StyleGuidePage/components/OverlaysSection/constants";

export const ModalTriggers: React.FC = () => {
  const t = useT();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState<string | null>(null);

  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setEditOpen(true)}
        >
          {t("style_guide.overlays.open_app_modal")}
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={() => setDeleteOpen(true)}
        >
          {t("style_guide.overlays.open_delete_modal")}
        </Button>
      </Box>

      <AppModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("tickets.list.edit_title")}
        actions={
          <ModalActions
            onCancel={() => setEditOpen(false)}
            onConfirm={() => setEditOpen(false)}
            confirmLabel={t("common.save")}
            pending={false}
          />
        }
      >
        <FormTextField
          id="style-guide-modal-title"
          label={t("tickets.list.field_title")}
          value={title ?? t("style_guide.sample.ticket_lodash")}
          onValueChange={setTitle}
          required
        />
      </AppModal>

      <DeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => setDeleteOpen(false)}
        title={t("tickets.list.delete_title")}
        irreversible
      >
        {t("tickets.list.delete_prefix")}
        <strong>{SAMPLE_TICKET_REFERENCE}</strong>
        {t("tickets.list.delete_suffix")}
      </DeleteModal>
    </>
  );
};
