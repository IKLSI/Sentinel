import type React from "react";
import Box from "@mui/material/Box";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import CallSplitOutlined from "@mui/icons-material/CallSplitOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useController, useForm } from "react-hook-form";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { ScanFrequencyPicker } from "@/components/ui/forms/ScanFrequencyPicker";
import { useT } from "@/contexts/I18nContext";
import { useUpdateProjectSettingsMutation } from "@/domains/projects/mutations";
import { useProjectRepositoryOptionsQuery } from "@/domains/projects/queries";
import type { ProjectSummary } from "@/domains/projects/types";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useUndoToast } from "@/hooks/useUndoToast";
import { ScopeAutocomplete } from "@/features/projects/pages/ProjectsPage/components/ProjectSettingsModal/components/ScopeAutocomplete";
import {
  type ProjectSettingsFormValues,
  projectSettingsSchema,
} from "@/features/projects/schemas";

const BRANCH_MAX_LENGTH = 255;

const ROOT_PATH_MAX_LENGTH = 500;

const NO_OPTIONS: string[] = [];

const iconSx = { fontSize: 16, color: "var(--muted)" } as const;

const sectionSx = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
} as const;

const sectionTitleSx = {
  display: "block",
  typography: "label",
  color: "var(--text)",
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
  const showUndoToast = useUndoToast();

  const { control, handleSubmit } = useForm<ProjectSettingsFormValues>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: {
      scanFrequency: project.scanFrequency,
      branch: project.branch ?? "",
      rootPath: project.rootPath ?? "",
    },
  });

  const { field: branchField } = useController({ control, name: "branch" });
  const { field: rootPathField } = useController({ control, name: "rootPath" });
  const scopeChanged =
    emptyToNull(branchField.value) !== (project.branch ?? null) ||
    emptyToNull(rootPathField.value) !== (project.rootPath ?? null);

  const branchesQuery = useProjectRepositoryOptionsQuery(
    project.id,
    null,
    true,
  );
  const branches = branchesQuery.data?.branches ?? NO_OPTIONS;
  const defaultBranch = branchesQuery.data?.defaultBranch ?? null;
  const trimmedBranch = branchField.value.trim();
  const selectedBranch =
    branches.includes(trimmedBranch) && trimmedBranch !== defaultBranch
      ? trimmedBranch
      : null;
  const directoriesQuery = useProjectRepositoryOptionsQuery(
    project.id,
    selectedBranch,
    selectedBranch !== null || branchesQuery.isSuccess,
  );
  const directories = directoriesQuery.data?.directories ?? NO_OPTIONS;
  const optionsUnavailable =
    branchesQuery.isSuccess && branchesQuery.data?.available === false;
  const defaultBranchLabel = (name: string) =>
    t("projects.modal.branch_default", { branch: name });

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
      {
        onSuccess: () => {
          onClose();
          showUndoToast(
            t("projects.toast.settings_updated", { name: project.name }),
            () =>
              updateSettingsMutation
                .mutateAsync({
                  id: project.id,
                  data: {
                    scanFrequency: project.scanFrequency,
                    branch: project.branch ?? null,
                    rootPath: project.rootPath ?? null,
                  },
                })
                .catch(onSaveError),
          );
        },
        onError: onSaveError,
      },
    );
  });

  return (
    <AppModal
      open
      onClose={() => !saving && onClose()}
      title={t("projects.modal.frequency_title")}
      maxWidth="xs"
      actions={
        <ModalActions
          onCancel={onClose}
          cancelLabel={t("projects.modal.cancel")}
          cancelDisabled={saving}
          onConfirm={onSubmit}
          pending={saving}
          pendingLabel={t("projects.modal.saving")}
          confirmLabel={t("projects.modal.save")}
        />
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
          <ScopeAutocomplete
            id="project-scope-branch"
            label={t("projects.modal.branch_label")}
            icon={<CallSplitOutlined sx={iconSx} />}
            options={branches}
            value={branchField.value}
            onChange={branchField.onChange}
            disabled={saving}
            loading={branchesQuery.isFetching}
            maxLength={BRANCH_MAX_LENGTH}
            placeholder={
              defaultBranch
                ? defaultBranchLabel(defaultBranch)
                : t("projects.modal.branch_placeholder")
            }
            optionLabel={(option) =>
              option === defaultBranch ? defaultBranchLabel(option) : option
            }
            hint={optionsUnavailable && t("projects.modal.options_unavailable")}
          />
          <ScopeAutocomplete
            id="project-scope-root-path"
            label={t("projects.modal.root_path_label")}
            icon={<FolderOutlined sx={iconSx} />}
            options={directories}
            value={rootPathField.value}
            onChange={rootPathField.onChange}
            disabled={saving}
            loading={directoriesQuery.isFetching}
            maxLength={ROOT_PATH_MAX_LENGTH}
            placeholder={t("projects.modal.root_path_placeholder")}
            noOptionsText={t("projects.modal.root_path_no_options")}
            hint={t("projects.modal.root_path_help")}
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
