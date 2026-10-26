export const DEMO_CANVAS_WIDTH = 1280;

export const DEMO_CANVAS_HEIGHT = 780;

export const DEMO_POSTER_SRC = "/landing/demo-poster.webp";

export const DEMO_POSTER_SRCSET =
  "/landing/demo-poster-960.webp 960w, /landing/demo-poster.webp 1920w";

export const DEMO_POSTER_SIZES =
  "(max-width: 1240px) calc(100vw - 56px), 1144px";

export const DEMO_MODES = {
  inline: "inline",
  fullscreen: "fullscreen",
} as const;

export type DemoMode = (typeof DEMO_MODES)[keyof typeof DEMO_MODES];

export const DEMO_FULLSCREEN_GUTTER = 48;

export const DEMO_MAX_SCALE = 1;

export const DEMO_PATHS = {
  dashboard: "/dashboard",
  projects: "/projects",
  project: "/projects/$id",
  tickets: "/tickets",
  ticket: "/tickets/$id",
} as const;

export const DEMO_SIDEBAR_WIDTH = 200;

export const DEMO_SIDEBAR_GAP = 12;

export const DEMO_SIDEBAR_TOP = 20;

export const DEMO_SECTION_SX = {
  width: "100%",
  maxWidth: "1240px",
  boxSizing: "border-box",
  mx: "auto",
  mt: { xs: "48px", md: "72px" },
  px: { xs: "20px", md: "40px" },
} as const;

export const DEMO_FRAME_SX = {
  borderRadius: "22px",
  p: "8px",
  background: "var(--tint)",
  boxShadow:
    "0 0 0 1px var(--line), 0 50px 90px -50px color-mix(in srgb, var(--indigo) 35%, transparent)",
} as const;
