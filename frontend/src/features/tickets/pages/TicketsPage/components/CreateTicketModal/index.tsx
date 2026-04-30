import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import { AppModal } from "@/components/AppModal";
import { DurationPicker } from "@/components/DurationPicker";
import { useT } from "@/i18n/I18nContext";
import { ProjectDto } from "@/features/techHealth/api/projects";
import { User } from "@/types";
import {
  CreateTicketPayload,
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
}) => {
  const t = useT();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("tickets.list.create_title")}
      actions={
        <>
          <Button
            variant="outlined"
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
            sx={{ textTransform: "none" }}
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
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
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
            <Label mb="8px">{t("tickets.list.field_visibility")}</Label>
            <Box
              onClick={() =>
                onFormChange((f) => ({ ...f, isInternal: !f.isInternal }))
              }
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                px: "12px",
                py: "7px",
                borderRadius: "var(--r)",
                border: form.isInternal
                  ? "1px solid var(--accent-border)"
                  : "1px solid var(--border)",
                background: form.isInternal
                  ? "var(--accent-subtle)"
                  : "var(--s1)",
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.15s",
              }}
            >
              {form.isInternal ? (
                <LockOutlined sx={{ fontSize: 14, color: "var(--accent)" }} />
              ) : (
                <LockOpenOutlined
                  sx={{ fontSize: 14, color: "var(--muted)" }}
                />
              )}
              <Box
                component="span"
                sx={{
                  fontSize: "13px",
                  color: form.isInternal ? "var(--accent)" : "var(--muted)",
                  fontWeight: form.isInternal ? 600 : 400,
                }}
              >
                {form.isInternal
                  ? t("tickets.list.visibility_internal")
                  : t("tickets.list.visibility_public")}
              </Box>
            </Box>
          </Box>
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
