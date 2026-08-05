import type React from "react";
import type { UseFormRegister } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import type { Project } from "@/domains/projects/types";
import type { User } from "@/domains/users/types";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import {
  modalInputSx,
  modalSelectSx,
  modalTextareaSx,
} from "@/features/tickets/pages/TicketsPage/helpers";
import type { EditTicketFormValues } from "@/features/tickets/pages/TicketsPage/schemas";

interface Props {
  open: boolean;
  onClose: () => void;
  register: UseFormRegister<EditTicketFormValues>;
  projects: Project[];
  users: User[];
  saving: boolean;
  onSubmit: () => void;
}

const Label: React.FC<{ children: React.ReactNode; mb?: string }> = ({
  children,
  mb = "5px",
}) => (
  <Box
    component="label"
    sx={{
      display: "block",
      fontSize: "11px",
      fontWeight: 600,
      mb,
      color: "var(--muted2)",
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </Box>
);

export const EditTicketModal: React.FC<Props> = ({
  open,
  onClose,
  register,
  projects,
  users,
  saving,
  onSubmit,
}) => {
  const t = useT();

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
            className="btn-cancel"
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
        <Box>
          <Label>
            {t("tickets.list.field_title")}{" "}
            <Box component="span" sx={{ color: "var(--red)" }}>
              *
            </Box>
          </Label>
          <Box
            component="input"
            autoFocus
            type="text"
            sx={modalInputSx}
            {...register("title")}
          />
        </Box>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <Box>
            <Label>{t("tickets.list.field_priority")}</Label>
            <Box
              component="select"
              sx={modalSelectSx}
              {...register("priority")}
            >
              <option value="critical">
                {t("tickets.list.priority_critical")}
              </option>
              <option value="high">{t("tickets.list.priority_high")}</option>
              <option value="medium">
                {t("tickets.list.priority_medium")}
              </option>
              <option value="low">{t("tickets.list.priority_low")}</option>
            </Box>
          </Box>
          <Box>
            <Label>{t("tickets.list.field_status")}</Label>
            <Box component="select" sx={modalSelectSx} {...register("status")}>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(statusLabelKeys[status])}
                </option>
              ))}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <Box>
            <Label>{t("tickets.list.field_type")}</Label>
            <Box component="select" sx={modalSelectSx} {...register("type")}>
              <option value="bug">{t("tickets.list.type_bug")}</option>
              <option value="feature">{t("tickets.list.type_feature")}</option>
              <option value="security">
                {t("tickets.list.type_security")}
              </option>
              <option value="performance">
                {t("tickets.list.type_performance")}
              </option>
              <option value="maintenance">
                {t("tickets.list.type_maintenance")}
              </option>
              <option value="question">
                {t("tickets.list.type_question")}
              </option>
            </Box>
          </Box>
          <Box>
            <Label>{t("tickets.list.field_project")}</Label>
            <Box
              component="select"
              sx={modalSelectSx}
              {...register("projectId")}
            >
              <option value="">{t("tickets.list.unassigned")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Box>
          </Box>
        </Box>
        <Box>
          <Label>{t("tickets.list.field_assignee")}</Label>
          <Box
            component="select"
            sx={modalSelectSx}
            {...register("assignedToId")}
          >
            <option value="">{t("tickets.list.unassigned")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Box>
        </Box>
        <Box>
          <Label>{t("tickets.list.field_description")}</Label>
          <Box
            component="textarea"
            rows={5}
            sx={modalTextareaSx}
            {...register("description")}
          />
        </Box>
      </Box>
    </AppModal>
  );
};
