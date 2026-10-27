import { ToastSeverity } from "@/enums";

export const TOOLTIP_PLACEMENTS = [
  { placement: "top", labelKey: "style_guide.overlays.placement_top" },
  { placement: "right", labelKey: "style_guide.overlays.placement_right" },
  { placement: "bottom", labelKey: "style_guide.overlays.placement_bottom" },
  { placement: "left", labelKey: "style_guide.overlays.placement_left" },
] as const;

export const SAMPLE_PROJECT_NAME = "sentinel-api";

export const SAMPLE_TICKET_REFERENCE = "TCK-128";

export const TRUNCATED_SAMPLE = "billing-worker-legacy-monolith-migration";

export const TOAST_SAMPLES = [
  {
    severity: ToastSeverity.Success,
    labelKey: "style_guide.overlays.toast_success",
    messageKey: "projects.toast.scan_started",
  },
  {
    severity: ToastSeverity.Info,
    labelKey: "style_guide.overlays.toast_info",
    messageKey: "projects.toast.scan_cancelled",
  },
  {
    severity: ToastSeverity.Warning,
    labelKey: "style_guide.overlays.toast_warning",
    messageKey: "settings.toast.required_fields",
  },
  {
    severity: ToastSeverity.Error,
    labelKey: "style_guide.overlays.toast_error",
    messageKey: "projects.toast.scan_start_error",
  },
] as const;
