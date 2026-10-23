import type React from "react";
import { useId } from "react";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import { DEFAULT_GITLAB_BASE_URL } from "@/domains/settings/constants";

interface Props {
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
}

export const GitlabInstanceFields: React.FC<Props> = ({
  baseUrl,
  onBaseUrlChange,
}) => {
  const t = useT();
  const id = useId();

  return (
    <FormTextField
      id={id}
      label={t("settings.integrations.gitlab_url_label")}
      type="url"
      placeholder={DEFAULT_GITLAB_BASE_URL}
      value={baseUrl}
      onValueChange={onBaseUrlChange}
    />
  );
};
