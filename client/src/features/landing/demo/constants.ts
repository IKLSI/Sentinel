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
