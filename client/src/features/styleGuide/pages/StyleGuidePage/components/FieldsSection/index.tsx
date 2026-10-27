import type React from "react";
import { useId, useState } from "react";
import Box from "@mui/material/Box";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { PasswordTextField } from "@/components/ui/forms/PasswordTextField";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { useT } from "@/contexts/I18nContext";
import { TicketPriority } from "@/enums";
import { FilterBuilderDemo } from "@/features/styleGuide/pages/StyleGuidePage/components/FieldsSection/components/FilterBuilderDemo";
import {
  FIELD_GRID_SX,
  INVALID_URL_ERROR,
  SAMPLE_BRANCH,
  SAMPLE_INVALID_URL,
  priorityOptionsOf,
} from "@/features/styleGuide/pages/StyleGuidePage/components/FieldsSection/constants";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";

export const FieldsSection: React.FC = () => {
  const t = useT();
  const id = useId();
  const [title, setTitle] = useState("");
  const [instanceUrl, setInstanceUrl] = useState(SAMPLE_INVALID_URL);
  const [password, setPassword] = useState("");
  const [priority, setPriority] = useState<string>(TicketPriority.Medium);
  const [search, setSearch] = useState("");

  return (
    <>
      <Specimen
        title={t("style_guide.fields.inputs")}
        note={t("style_guide.fields.inputs_note")}
        source="components/ui/forms"
      >
        <Box sx={FIELD_GRID_SX}>
          <FormTextField
            id={`${id}-title`}
            label={t("tickets.list.field_title")}
            placeholder={t("tickets.list.title_placeholder")}
            value={title}
            onValueChange={setTitle}
            required
          />
          <FormTextField
            id={`${id}-url`}
            label={t("settings.integrations.gitlab_url_label")}
            value={instanceUrl}
            onValueChange={setInstanceUrl}
            error={INVALID_URL_ERROR}
            t={t}
          />
          <FormTextField
            id={`${id}-branch`}
            label={t("projects.modal.branch_label")}
            value={SAMPLE_BRANCH}
            readOnly
          />
          <PasswordTextField
            id={`${id}-password`}
            label={t("auth.login.password_label")}
            placeholder={t("auth.register.password_placeholder")}
            value={password}
            onValueChange={setPassword}
            showLabel={t("auth.login.password_show")}
            hideLabel={t("auth.login.password_hide")}
          />
          <FormSelectField
            id={`${id}-priority`}
            label={t("tickets.list.field_priority")}
            value={priority}
            onValueChange={setPriority}
          >
            {priorityOptionsOf(t).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelectField>
          <Box sx={{ alignSelf: "end" }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              onEscape={() => setSearch("")}
              placeholder={t("tickets.list.search_placeholder")}
              sx={{ width: "100%", maxWidth: "100%" }}
            />
          </Box>
        </Box>
      </Specimen>

      <Specimen
        title={t("style_guide.fields.filter")}
        note={t("style_guide.fields.filter_note")}
        source="components/ui/forms/FilterBuilder"
      >
        <FilterBuilderDemo />
      </Specimen>
    </>
  );
};
