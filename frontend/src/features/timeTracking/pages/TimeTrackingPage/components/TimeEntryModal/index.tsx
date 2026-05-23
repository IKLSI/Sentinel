import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppModal } from "@/components/AppModal";
import { useT } from "@/i18n/I18nContext";
import { ProjectDto } from "@/features/techHealth/api/projects";
import { Ticket } from "@/types";
import { FormField, FormState, inputSx, parseDateLocal } from "../../helpers";
import { DatePickerPopover } from "../DatePickerPopover";

interface Props {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  form: FormState;
  onFormChange: (updater: (f: FormState) => FormState) => void;
  submitting: boolean;
  onSubmit: () => void;
  projects: ProjectDto[];
  tickets: Ticket[];
}

export const TimeEntryModal: React.FC<Props> = ({
  open,
  onClose,
  isEditing,
  form,
  onFormChange,
  submitting,
  onSubmit,
  projects,
  tickets,
}) => {
  const t = useT();
  const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLElement | null>(null);

  const computedMinutes = useMemo(() => {
    if (!form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : null;
  }, [form.startTime, form.endTime]);

  const effectiveDuration = computedMinutes ?? form.durationMinutes;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? t("time_tracking.modal_edit_title")
          : t("time_tracking.modal_create_title")
      }
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={onClose}
          >
            {t("time_tracking.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none", background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)", boxShadow: "none", "&:hover": { background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)", boxShadow: "none", transform: "none" } }}
            onClick={onSubmit}
            disabled={
              !form.title.trim() || submitting || effectiveDuration <= 0
            }
          >
            {submitting ? (
              <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
            ) : isEditing ? (
              t("time_tracking.save_edit")
            ) : (
              t("time_tracking.save_create")
            )}
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <FormField label={t("time_tracking.field_date")}>
            <Box
              component="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                setDatePickerAnchor(e.currentTarget)
              }
              sx={{
                ...inputSx,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {form.date
                ? format(parseDateLocal(form.date), "d MMMM yyyy", { locale: fr })
                : t("time_tracking.choose_date")}
              <CalendarTodayOutlined sx={{ fontSize: 13, color: "var(--muted2)" }} />
            </Box>
            <DatePickerPopover
              anchor={datePickerAnchor}
              onClose={() => setDatePickerAnchor(null)}
              selectedDate={form.date}
              onSelect={(d) => onFormChange((f) => ({ ...f, date: d }))}
            />
          </FormField>
          <FormField label={t("time_tracking.field_start_time")}>
            <Box
              component="input"
              type="time"
              value={form.startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFormChange((f) => ({ ...f, startTime: e.target.value }))
              }
              sx={{ ...inputSx, accentColor: "var(--accent)" }}
            />
          </FormField>
          <FormField label={t("time_tracking.field_end_time")}>
            <Box
              component="input"
              type="time"
              value={form.endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFormChange((f) => ({ ...f, endTime: e.target.value }))
              }
              sx={{ ...inputSx, accentColor: "var(--accent)" }}
            />
          </FormField>
        </Box>

        <FormField
          label={
            <>
              {t("time_tracking.field_title")}{" "}
              <Box component="span" sx={{ color: "var(--red)" }}>
                *
              </Box>
            </>
          }
        >
          <Box
            component="input"
            type="text"
            sx={inputSx}
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onFormChange((f) => ({ ...f, title: e.target.value }))
            }
            placeholder={t("time_tracking.title_placeholder")}
            autoFocus
          />
        </FormField>

        <FormField label={t("time_tracking.field_description")}>
          <Box
            component="textarea"
            rows={3}
            sx={{ ...inputSx, resize: "vertical", lineHeight: "1.5" }}
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onFormChange((f) => ({ ...f, description: e.target.value }))
            }
            placeholder={t("time_tracking.description_placeholder")}
          />
        </FormField>

        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <FormField label={t("time_tracking.field_ticket")}>
            <Box
              component="select"
              value={form.ticketId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFormChange((f) => ({ ...f, ticketId: e.target.value }))
              }
              sx={{
                appearance: "none",
                WebkitAppearance: "none",
                background: "var(--s1)",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                px: "12px",
                py: "7px",
                pr: "36px",
                fontSize: "13px",
                color: "var(--text)",
                width: "100%",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              <option value="">{t("time_tracking.no_ticket_option")}</option>
              {tickets.map((tk) => (
                <option key={tk.id} value={tk.id}>
                  {tk.reference} — {tk.title}
                </option>
              ))}
            </Box>
          </FormField>
          <FormField label={t("time_tracking.field_project")}>
            <Box
              component="select"
              value={form.techProjectId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFormChange((f) => ({ ...f, techProjectId: e.target.value }))
              }
              sx={{
                appearance: "none",
                WebkitAppearance: "none",
                background: "var(--s1)",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                px: "12px",
                py: "7px",
                pr: "36px",
                fontSize: "13px",
                color: "var(--text)",
                width: "100%",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              <option value="">{t("time_tracking.no_project_option")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Box>
          </FormField>
        </Box>
      </Box>
    </AppModal>
  );
};
