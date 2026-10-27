import type React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import Box from "@mui/material/Box";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { useT } from "@/contexts/I18nContext";
import type { ProjectOption } from "@/domains/projects/types";
import type { UserOption } from "@/domains/users/types";

interface Props {
  fieldId: string;
  projectRegistration: UseFormRegisterReturn;
  assigneeRegistration: UseFormRegisterReturn;
  projects: ProjectOption[];
  users: UserOption[];
  noProjectLabel: string;
}

export const TicketAssignmentFields: React.FC<Props> = ({
  fieldId,
  projectRegistration,
  assigneeRegistration,
  projects,
  users,
  noProjectLabel,
}) => {
  const t = useT();

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      <FormSelectField
        id={`${fieldId}-projectId`}
        label={t("tickets.list.field_project")}
        registration={projectRegistration}
      >
        <option value="">{noProjectLabel}</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </FormSelectField>
      <FormSelectField
        id={`${fieldId}-assignedToId`}
        label={t("tickets.list.field_assignee")}
        registration={assigneeRegistration}
      >
        <option value="">{t("tickets.list.unassigned")}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </FormSelectField>
    </Box>
  );
};
