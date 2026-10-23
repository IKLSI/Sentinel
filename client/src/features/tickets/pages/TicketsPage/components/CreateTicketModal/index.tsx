import type React from "react";
import { useId } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import { AppModal } from "@/components/ui/common/AppModal";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import type { ProjectOption } from "@/domains/projects/types";
import type { UserOption } from "@/domains/users/types";
import type { CreateTicketFormValues } from "@/features/tickets/pages/TicketsPage/schemas";

interface Props {
  open: boolean;
  onClose: () => void;
  register: UseFormRegister<CreateTicketFormValues>;
  errors: FieldErrors<CreateTicketFormValues>;
  projects: ProjectOption[];
  users: UserOption[];
  submitting: boolean;
  onSubmit: () => void;
  createAnother: boolean;
  onCreateAnotherChange: (v: boolean) => void;
}

export const CreateTicketModal: React.FC<Props> = ({
  open,
  onClose,
  register,
  errors,
  projects,
  users,
  submitting,
  onSubmit,
  createAnother,
  onCreateAnotherChange,
}) => {
  const t = useT();
  const fieldId = useId();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("tickets.list.create_title")}
      actions={
        <>
          <FormControlLabel
            label={t("tickets.list.create_another")}
            sx={{
              mr: "auto",
              ml: 0,
              gap: "4px",
              "& .MuiFormControlLabel-label": {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted2)",
              },
            }}
            control={
              <Checkbox
                size="small"
                checked={createAnother}
                onChange={(e) => onCreateAnotherChange(e.target.checked)}
                sx={{ p: 0 }}
              />
            }
          />
          <Button
            variant="contained"
            size="small"
            color="inherit"
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
            ) : (
              t("tickets.list.create_submit")
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
          placeholder={t("tickets.list.title_placeholder")}
        />
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <FormSelectField
            id={`${fieldId}-priority`}
            label={t("tickets.list.field_priority")}
            registration={register("priority")}
          >
            <option value="Critical">
              {t("tickets.list.priority_critical")}
            </option>
            <option value="High">{t("tickets.list.priority_high")}</option>
            <option value="Medium">{t("tickets.list.priority_medium")}</option>
            <option value="Low">{t("tickets.list.priority_low")}</option>
          </FormSelectField>
          <FormSelectField
            id={`${fieldId}-type`}
            label={t("tickets.list.field_type")}
            registration={register("type")}
          >
            <option value="Bug">{t("tickets.list.type_bug")}</option>
            <option value="Feature">{t("tickets.list.type_feature")}</option>
            <option value="Security">{t("tickets.list.type_security")}</option>
            <option value="Performance">
              {t("tickets.list.type_performance")}
            </option>
            <option value="Maintenance">
              {t("tickets.list.type_maintenance")}
            </option>
            <option value="Question">{t("tickets.list.type_question")}</option>
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
            <option value="">{t("tickets.list.no_project")}</option>
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
          placeholder={t("tickets.list.description_placeholder")}
        />
      </Box>
    </AppModal>
  );
};
