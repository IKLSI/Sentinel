import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppModal } from "@/components/AppModal";
import { useT } from "@/i18n/I18nContext";
import { ModalField } from "../../helpers";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  name: string;
  repoUrl: string;
  onNameChange: (v: string) => void;
  onRepoUrlChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}

export const ProjectFormModal: React.FC<Props> = ({
  open,
  mode,
  name,
  repoUrl,
  onNameChange,
  onRepoUrlChange,
  onClose,
  onSubmit,
  saving,
}) => {
  const t = useT();
  const isCreate = mode === "create";
  const title = isCreate
    ? t("projects.modal.create_title")
    : t("projects.modal.edit_title");
  const submitLabel = saving
    ? isCreate
      ? t("projects.modal.creating")
      : t("projects.modal.saving")
    : isCreate
      ? t("projects.modal.create")
      : t("projects.modal.save");

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={onClose}
          >
            {t("projects.modal.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none", background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)", boxShadow: "none", "&:hover": { background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)", boxShadow: "none", transform: "none" } }}
            onClick={onSubmit}
            disabled={!name.trim() || saving}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <ModalField
          label={
            <>
              {t("projects.field.name_label")}{" "}
              <Box component="span" sx={{ color: "var(--red)" }}>
                *
              </Box>
            </>
          }
          placeholder={
            isCreate ? t("projects.field.name_placeholder") : undefined
          }
          value={name}
          onChange={onNameChange}
          autoFocus={isCreate}
        />
        {isCreate && (
          <ModalField
            label={t("projects.field.repo_url_label")}
            placeholder={t("projects.field.repo_url_placeholder")}
            value={repoUrl}
            onChange={onRepoUrlChange}
          />
        )}
      </Box>
    </AppModal>
  );
};
