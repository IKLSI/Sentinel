import type React from "react";
import Autocomplete, {
  type AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import CallSplitOutlined from "@mui/icons-material/CallSplitOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { useT } from "@/contexts/I18nContext";
import { useProjectRepositoryOptionsQuery } from "@/domains/projects/queries";

interface Props {
  projectId: string;
  enabled: boolean;
  branch: string;
  onBranchChange: (branch: string) => void;
  rootPath: string;
  onRootPathChange: (rootPath: string) => void;
  disabled: boolean;
}

const BRANCH_MAX_LENGTH = 255;

const ROOT_PATH_MAX_LENGTH = 500;

const NO_OPTIONS: string[] = [];

const fieldLabelSx = {
  display: "block",
  mb: "6px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text)",
} as const;

const fieldHintSx = {
  mt: "6px",
  fontSize: "11px",
  color: "var(--muted)",
  lineHeight: 1.5,
} as const;

const optionSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
} as const;

const scopeInputSlotProps = (
  params: AutocompleteRenderInputParams,
  icon: React.ReactNode,
  loading: boolean,
  maxLength: number,
) => ({
  ...params.slotProps,
  input: {
    ...params.slotProps.input,
    startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
    endAdornment: (
      <>
        {loading && <CircularProgress color="inherit" size={14} />}
        {params.slotProps.input.endAdornment}
      </>
    ),
  },
  htmlInput: {
    ...params.slotProps.htmlInput,
    maxLength,
    style: { fontFamily: "var(--font-mono)", fontSize: "12px" },
  },
});

const iconSx = { fontSize: 16, color: "var(--muted)" } as const;

export const RepositoryScopeFields: React.FC<Props> = ({
  projectId,
  enabled,
  branch,
  onBranchChange,
  rootPath,
  onRootPathChange,
  disabled,
}) => {
  const t = useT();
  const branchesQuery = useProjectRepositoryOptionsQuery(
    projectId,
    null,
    enabled,
  );
  const branches = branchesQuery.data?.branches ?? NO_OPTIONS;
  const defaultBranch = branchesQuery.data?.defaultBranch ?? null;
  const trimmedBranch = branch.trim();
  const selectedBranch =
    branches.includes(trimmedBranch) && trimmedBranch !== defaultBranch
      ? trimmedBranch
      : null;

  const directoriesQuery = useProjectRepositoryOptionsQuery(
    projectId,
    selectedBranch,
    enabled && (selectedBranch !== null || branchesQuery.isSuccess),
  );
  const directories = directoriesQuery.data?.directories ?? NO_OPTIONS;
  const unavailable =
    branchesQuery.isSuccess && branchesQuery.data?.available === false;

  return (
    <>
      <Box>
        <Box component="label" htmlFor="project-scope-branch" sx={fieldLabelSx}>
          {t("projects.modal.branch_label")}
        </Box>
        <Autocomplete
          id="project-scope-branch"
          freeSolo
          fullWidth
          size="small"
          options={branches}
          inputValue={branch}
          onInputChange={(_, value) => onBranchChange(value)}
          disabled={disabled}
          loading={branchesQuery.isFetching}
          renderOption={({ key, ...props }, option) => (
            <Box component="li" key={key} {...props} sx={optionSx}>
              {option === defaultBranch
                ? t("projects.modal.branch_default", { branch: option })
                : option}
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={
                defaultBranch
                  ? t("projects.modal.branch_default", {
                      branch: defaultBranch,
                    })
                  : t("projects.modal.branch_placeholder")
              }
              slotProps={scopeInputSlotProps(
                params,
                <CallSplitOutlined sx={iconSx} />,
                branchesQuery.isFetching,
                BRANCH_MAX_LENGTH,
              )}
            />
          )}
        />
        {unavailable && (
          <Box sx={fieldHintSx}>{t("projects.modal.options_unavailable")}</Box>
        )}
      </Box>
      <Box>
        <Box
          component="label"
          htmlFor="project-scope-root-path"
          sx={fieldLabelSx}
        >
          {t("projects.modal.root_path_label")}
        </Box>
        <Autocomplete
          id="project-scope-root-path"
          freeSolo
          fullWidth
          size="small"
          options={directories}
          inputValue={rootPath}
          onInputChange={(_, value) => onRootPathChange(value)}
          disabled={disabled}
          loading={directoriesQuery.isFetching}
          noOptionsText={t("projects.modal.root_path_no_options")}
          renderOption={({ key, ...props }, option) => (
            <Box component="li" key={key} {...props} sx={optionSx}>
              {option}
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t("projects.modal.root_path_placeholder")}
              slotProps={scopeInputSlotProps(
                params,
                <FolderOutlined sx={iconSx} />,
                directoriesQuery.isFetching,
                ROOT_PATH_MAX_LENGTH,
              )}
            />
          )}
        />
        <Box sx={fieldHintSx}>{t("projects.modal.root_path_help")}</Box>
      </Box>
    </>
  );
};
