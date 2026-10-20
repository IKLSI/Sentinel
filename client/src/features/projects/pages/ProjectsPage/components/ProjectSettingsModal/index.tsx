import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useController, useForm } from "react-hook-form";
import { AppModal } from "@/components/ui/common/AppModal";
import { ScanFrequencyPicker } from "@/components/ui/forms/ScanFrequencyPicker";
import { useT } from "@/contexts/I18nContext";
import { useUpdateProjectSettingsMutation } from "@/domains/projects/mutations";
import type { ProjectSummary } from "@/domains/projects/types";
import type { ScanFrequency } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { RepositoryScopeFields } from "@/features/projects/pages/ProjectsPage/components/RepositoryScopeFields";
import {
  type ProjectSettingsFormValues,
  projectSettingsSchema,
} from "@/features/projects/pages/ProjectsPage/components/ProjectSettingsModal/schemas";

const sectionSx = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
} as const;

const sectionTitleSx = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
} as const;

const rescanNoticeSx = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  px: "10px",
  py: "8px",
  fontSize: "12px",
  lineHeight: 1.5,
  color: "var(--text)",
  background: "var(--yellow-subtle)",
  borderRadius: "var(--r-sm)",
  "& svg": { color: "var(--yellow)" },
} as const;

const emptyToNull = (value: string) => value.trim() || null;

interface Props {
  project: ProjectSummary;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<Props> = ({ project, onClose }) => {
  const t = useT();
  const updateSettingsMutation = useUpdateProjectSettingsMutation();
  const saving = updateSettingsMutation.isPending;
  const onSaveError = useApiErrorToast("projects.modal.frequency_error");

  const { control, handleSubmit } = useForm<ProjectSettingsFormValues>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: {
      scanFrequency: project.scanFrequency as ScanFrequency,
      branch: project.branch ?? "",
      rootPath: project.rootPath ?? "",
    },
  });

  const { field: branchField } = useController({ control, name: "branch" });
  const { field: rootPathField } = useController({ control, name: "rootPath" });
  const scopeChanged =
    emptyToNull(branchField.value) !== (project.branch ?? null) ||
    emptyToNull(rootPathField.value) !== (project.rootPath ?? null);

  const onSubmit = handleSubmit((values) => {
    if (values.scanFrequency === project.scanFrequency && !scopeChanged) {
      onClose();
      return;
    }

    updateSettingsMutation.mutate(
      {
        id: project.id,
        data: {
          scanFrequency: values.scanFrequency,
          branch: emptyToNull(values.branch),
          rootPath: emptyToNull(values.rootPath),
        },
      },
      { onSuccess: onClose, onError: onSaveError },
    );
  });

  return (
    <AppModal
      open
      onClose={() => !saving && onClose()}
      title={t("projects.modal.frequency_title")}
      maxWidth="xs"
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            {t("projects.modal.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? t("projects.modal.saving") : t("projects.modal.save")}
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Box sx={sectionSx}>
          <Box component="span" sx={sectionTitleSx}>
            {t("projects.modal.frequency_label")}
          </Box>
          <Box>
            <Controller
              control={control}
              name="scanFrequency"
              render={({ field }) => (
                <ScanFrequencyPicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={saving}
                />
              )}
            />
          </Box>
        </Box>
        <Box
          sx={{
            ...sectionSx,
            pt: "20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <RepositoryScopeFields
            projectId={project.id}
            enabled
            branch={branchField.value}
            onBranchChange={branchField.onChange}
            rootPath={rootPathField.value}
            onRootPathChange={rootPathField.onChange}
            disabled={saving}
          />
          {scopeChanged && (
            <Box sx={rescanNoticeSx}>
              <InfoOutlined sx={{ fontSize: 15, mt: "1px" }} />
              <span>{t("projects.modal.scope_help")}</span>
            </Box>
          )}
        </Box>
      </Box>
    </AppModal>
  );
};
