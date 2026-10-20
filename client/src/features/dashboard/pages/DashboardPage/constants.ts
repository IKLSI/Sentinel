export const DASHBOARD_ACTIVITY_LIMIT = 6;

export const PERCENT = 100;

export const GAUGE_SIZE = 190;

export const GAUGE_THICKNESS = 15;

export const DONUT_SIZE = 112;

export const DONUT_THICKNESS = 13;

export const DONUT_GAP_DEGREES = 3;

export const RING_SIZE = 38;

export const RING_THICKNESS = 4;

const CHART_MIN_HEIGHT = 140;

export const RESPONSIVE_CHART_MIN_HEIGHT = { xs: CHART_MIN_HEIGHT, lg: 0 };

export const SCORE_AXIS_PADDING = 5;

export const SCORE_MIN = 0;

export const SCORE_MAX = 100;

export const CHART_GRADIENT_ID = "dashboard-score-area";

export const GAUGE_BANDS = [
  { from: 0, to: 45, color: "var(--red)" },
  { from: 45, to: 60, color: "var(--orange)" },
  { from: 60, to: 75, color: "var(--yellow)" },
  { from: 75, to: 90, color: "var(--teal)" },
  { from: 90, to: 100, color: "var(--green)" },
] as const;

export const GAUGE_BAND_GAP = 0.6;

export const DEPENDENCY_STATUS_COLORS = {
  upToDate: "var(--teal)",
  minorUpdate: "var(--accent)",
  majorUpdate: "var(--yellow)",
  endOfLife: "var(--purple)",
  vulnerable: "var(--red)",
} as const;

export const SCORE_DELTA_NEUTRAL = 0;
