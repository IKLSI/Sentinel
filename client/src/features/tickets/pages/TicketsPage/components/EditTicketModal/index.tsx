import type React from "react";
import { useId } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { AppModal } from "@/components/ui/common/AppModal";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import type { ProjectOption } from "@/domains/projects/types";
import type { UserOption } from "@/domains/users/types";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import type { EditTicketFormValues } from "@/features/tickets/pages/TicketsPage/schemas";

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
        <>
          <Button
            variant="contained"
            size="small"
            color="inherit"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
            ) : (
              t("common.save")
            )}
          </Button>
        </>
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
            <option value="critical">
              {t("tickets.list.priority_critical")}
            </option>
            <option value="high">{t("tickets.list.priority_high")}</option>
            <option value="medium">{t("tickets.list.priority_medium")}</option>
            <option value="low">{t("tickets.list.priority_low")}</option>
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
            <option value="bug">{t("tickets.list.type_bug")}</option>
            <option value="feature">{t("tickets.list.type_feature")}</option>
            <option value="security">{t("tickets.list.type_security")}</option>
            <option value="performance">
              {t("tickets.list.type_performance")}
            </option>
            <option value="maintenance">
              {t("tickets.list.type_maintenance")}
            </option>
            <option value="question">{t("tickets.list.type_question")}</option>
          </FormSelectField>
        </Box>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <FormSelectField
            id={`${fieldId}-projectId`}
            label={t("tickets.list.field_project")}
            registration={register("projectId")}
          >
            <option value="">{t("tickets.list.unassigned")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FormSelectField>
          <FormSelectField
            id={`${fieldId}-assignedToId`}
            label={t("tickets.list.field_assignee")}
            registration={register("assignedToId")}
          >
            <option value="">{t("tickets.list.unassigned")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </FormSelectField>
        </Box>
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
