import type React from "react";
import { useId } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import Box from "@mui/material/Box";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import type { ProjectOption } from "@/domains/projects/types";
import type { UserOption } from "@/domains/users/types";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import { TicketAssignmentFields } from "@/features/tickets/pages/TicketsPage/components/TicketAssignmentFields";
import type { EditTicketFormValues } from "@/features/tickets/pages/TicketsPage/schemas";
import {
  priorityLabelKeys,
  typeTooltipKeys,
} from "@/features/tickets/pages/TicketsPage/helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  register: UseFormRegister<EditTicketFormValues>;
  errors: FieldErrors<EditTicketFormValues>;
  projects: ProjectOption[];
  users: UserOption[];
  saving: boolean;
  onSubmit: () => void;
}

export const EditTicketModal: React.FC<Props> = ({
  open,
  onClose,
  register,
  errors,
  projects,
  users,
  saving,
  onSubmit,
}) => {
  const t = useT();
  const fieldId = useId();

  return (
    <AppModal
      open={open}
      onClose={() => !saving && onClose()}
      title={t("tickets.list.edit_title")}
      actions={
        <ModalActions
          onCancel={onClose}
          cancelDisabled={saving}
          onConfirm={onSubmit}
          pending={saving}
          confirmLabel={t("common.save")}
        />
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <FormTextField
          id={`${fieldId}-title`}
          label={t("tickets.list.field_title")}
          registration={register("title")}
          error={errors.title}
          t={t}
          autoFocus
          required
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "14px",
          }}
        >
          <FormSelectField
            id={`${fieldId}-priority`}
            label={t("tickets.list.field_priority")}
            registration={register("priority")}
          >
            {Object.entries(priorityLabelKeys).map(([priority, labelKey]) => (
              <option key={priority} value={priority}>
                {t(labelKey)}
              </option>
            ))}
          </FormSelectField>
          <FormSelectField
            id={`${fieldId}-status`}
            label={t("tickets.list.field_status")}
            registration={register("status")}
          >
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(statusLabelKeys[status])}
              </option>
            ))}
          </FormSelectField>
          <FormSelectField
            id={`${fieldId}-type`}
            label={t("tickets.list.field_type")}
            registration={register("type")}
          >
            {Object.entries(typeTooltipKeys).map(([type, labelKey]) => (
              <option key={type} value={type}>
                {t(labelKey)}
              </option>
            ))}
          </FormSelectField>
        </Box>
        <TicketAssignmentFields
          fieldId={fieldId}
          projectRegistration={register("projectId")}
          assigneeRegistration={register("assignedToId")}
          projects={projects}
          users={users}
          noProjectLabel={t("tickets.list.unassigned")}
        />
        <FormTextField
          id={`${fieldId}-description`}
          label={t("tickets.list.field_description")}
          registration={register("description")}
          multiline
          rows={5}
        />
      </Box>
    </AppModal>
  );
};
