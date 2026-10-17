import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { DEFAULT_GITLAB_BASE_URL } from "@/domains/settings/constants";
import {
  FieldLabel,
  inp,
} from "@/features/settings/pages/SettingsPage/helpers";

interface Props {
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
}

export const GitlabInstanceFields: React.FC<Props> = ({
  baseUrl,
  onBaseUrlChange,
}) => {
  const t = useT();

  return (
    <Box>
      <FieldLabel>{t("settings.integrations.gitlab_url_label")}</FieldLabel>
      <Box
        component="input"
        type="url"
        placeholder={DEFAULT_GITLAB_BASE_URL}
        sx={inp}
        value={baseUrl}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onBaseUrlChange(e.target.value)
        }
      />
    </Box>
  );
};
