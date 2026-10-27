import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import ShowChartOutlined from "@mui/icons-material/ShowChartOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import type { SkeletonCell } from "@/components/ui/common/table/TableSkeletonRows";
import type { ScanProgress } from "@/domains/projects/types";
import type { UsageRule } from "@/features/styleGuide/pages/StyleGuidePage/components/UsageRules";

export const TWO_COLUMNS_SX = {
  display: "grid",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
  },
  gap: "16px",
} as const;

export const EMPTY_TICKETS = {
  icon: ConfirmationNumberOutlined,
  titleKey: "tickets.list.empty_title",
  subtitleKey: "tickets.list.empty_subtitle_create",
} as const;

export const TONE_SAMPLES = [
  {
    tone: "neutral",
    icon: ShowChartOutlined,
    titleKey: "dashboard.trend.empty_title",
    subtitleKey: "dashboard.trend.empty_subtitle",
    captionKey: "style_guide.empty_states.tone_neutral",
  },
  {
    tone: "success",
    icon: TaskAltOutlined,
    titleKey: "dashboard.tickets.empty_title",
    subtitleKey: "dashboard.tickets.empty_subtitle",
    captionKey: "style_guide.empty_states.tone_success",
  },
  {
    tone: "danger",
    icon: ErrorOutlineOutlined,
    titleKey: "common.load_error_title",
    subtitleKey: "common.load_error_subtitle",
    captionKey: "style_guide.empty_states.tone_danger",
  },
] as const;

export const WRITING_RULES: readonly UsageRule[] = [
  { kind: "do", textKey: "style_guide.empty_states.rule_title" },
  { kind: "do", textKey: "style_guide.errors.rule_what" },
  { kind: "dont", textKey: "style_guide.empty_states.rule_filter" },
];

export const SCAN_STAGES: readonly ScanProgress["stage"][] = [
  "Queued",
  "Repository",
  "Manifests",
  "Registries",
  "Advisories",
  "Scoring",
];

export const SCAN_STEP_INTERVAL_MS = 1400;

export const SAMPLE_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export const SAMPLE_PROJECT_NAME = "sentinel-api";

export const SCAN_BAR_WIDTH = 220;

export const TABLE_SKELETON_ROWS = 3;

export const TABLE_SKELETON_CELLS: readonly SkeletonCell[] = [
  "title",
  "chip",
  "count",
];

export const TABLE_HEAD_KEYS = [
  "tickets.list.col_ticket",
  "tickets.list.col_priority",
  "tickets.list.col_comments",
] as const;

export const RETRY_DELAY_MS = 1200;
