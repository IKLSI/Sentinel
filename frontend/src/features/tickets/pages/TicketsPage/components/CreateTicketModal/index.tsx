import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import { AppModal } from "@/components/AppModal";
import { DurationPicker } from "@/components/DurationPicker";
import { useT } from "@/i18n/I18nContext";
import type { ProjectDto } from "@/features/techHealth/api/projects";
import type { User } from "@/types";
import {
  type CreateTicketPayload,
  modalInputSx,
  modalSelectSx,
  modalTextareaSx,
} from "../../helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  form: CreateTicketPayload;
  onFormChange: (
    updater: (f: CreateTicketPayload) => CreateTicketPayload,
  ) => void;
  estMinutes: number;
  onEstMinutesChange: (v: number) => void;
  projects: ProjectDto[];
  users: User[];
  submitting: boolean;
  onSubmit: () => void;
  createAnother: boolean;
  onCreateAnotherChange: (v: boolean) => void;
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

export const CreateTicketModal: React.FC<Props> = ({
  open,
  onClose,
  form,
  onFormChange,
  estMinutes,
  onEstMinutesChange,
  projects,
  users,
  submitting,
  onSubmit,
  createAnother,
  onCreateAnotherChange,
}) => {
  const t = useT();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("tickets.list.create_title")}
      actions={
        <>
          <Box
            component="label"
            sx={{
              mr: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted2)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <Box
              component="input"
              type="checkbox"
              checked={createAnother}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onCreateAnotherChange(e.target.checked)
              }
              sx={{
                width: "14px",
                height: "14px",
                m: 0,
                cursor: "pointer",
                accentColor: "var(--accent)",
              }}
            />
            {t("tickets.list.create_another")}
          </Box>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
              boxShadow: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
                boxShadow: "none",
                transform: "none",
              },
            }}
            onClick={onSubmit}
            disabled={!form.title.trim() || submitting}
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
            placeholder={t("tickets.list.title_placeholder")}
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onFormChange((f) => ({ ...f, title: e.target.value }))
            }
            sx={modalInputSx}
          />
        </Box>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <Box>
            <Label>{t("tickets.list.field_priority")}</Label>
            <Box
              component="select"
              value={form.priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFormChange((f) => ({
                  ...f,
                  priority: e.target.value as CreateTicketPayload["priority"],
                }))
              }
              sx={modalSelectSx}
            >
              <option value="Critical">
                {t("tickets.list.priority_critical")}
              </option>
              <option value="High">{t("tickets.list.priority_high")}</option>
              <option value="Medium">
                {t("tickets.list.priority_medium")}
              </option>
              <option value="Low">{t("tickets.list.priority_low")}</option>
            </Box>
          </Box>
          <Box>
            <Label>{t("tickets.list.field_type")}</Label>
            <Box
              component="select"
              value={form.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFormChange((f) => ({
                  ...f,
                  type: e.target.value as CreateTicketPayload["type"],
                }))
              }
              sx={modalSelectSx}
            >
              <option value="Bug">{t("tickets.list.type_bug")}</option>
              <option value="Feature">{t("tickets.list.type_feature")}</option>
              <option value="Security">
                {t("tickets.list.type_security")}
              </option>
              <option value="Performance">
                {t("tickets.list.type_performance")}
              </option>
              <option value="Maintenance">
                {t("tickets.list.type_maintenance")}
              </option>
              <option value="Question">
                {t("tickets.list.type_question")}
              </option>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <Box>
            <Label>{t("tickets.list.field_project")}</Label>
            <Box
              component="select"
              value={form.projectId ?? ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFormChange((f) => ({
                  ...f,
                  projectId: e.target.value || undefined,
                }))
              }
              sx={modalSelectSx}
            >
              <option value="">{t("tickets.list.no_project")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Box>
          </Box>
          <Box>
            <Label>{t("tickets.list.field_assignee")}</Label>
            <Box
              component="select"
              value={form.assignedToId ?? ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFormChange((f) => ({
                  ...f,
                  assignedToId: e.target.value || undefined,
                }))
              }
              sx={modalSelectSx}
            >
              <option value="">{t("tickets.list.unassigned")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </Box>
          </Box>
        </Box>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              mb: "8px",
            }}
          >
            <Box
              component="label"
              sx={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted2)",
                letterSpacing: "0.04em",
              }}
            >
              {t("tickets.list.field_estimation")}
            </Box>
            <Tooltip
              title={t("tickets.list.estimation_tooltip")}
              placement="right"
              arrow
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1px solid var(--border2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  cursor: "default",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                i
              </Box>
            </Tooltip>
          </Box>
          <DurationPicker
            value={estMinutes}
            onChange={onEstMinutesChange}
            width="100%"
          />
        </Box>
        <Box>
          <Label>{t("tickets.list.field_description")}</Label>
          <Box
            component="textarea"
            rows={5}
            placeholder={t("tickets.list.description_placeholder")}
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onFormChange((f) => ({ ...f, description: e.target.value }))
            }
            sx={modalTextareaSx}
          />
        </Box>
      </Box>
    </AppModal>
  );
};
