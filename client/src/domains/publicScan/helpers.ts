import { ROUTES_API } from "@/configs/api-routes.gen";

const BADGE_TOKEN_PLACEHOLDER = "{token}";

export const buildProjectBadgePath = (token: string) =>
  ROUTES_API.api.public.badge["{token}.svg"].__path.replace(
    BADGE_TOKEN_PLACEHOLDER,
    encodeURIComponent(token),
  );

export const buildBadgeMarkdown = (
  origin: string,
  badgePath: string,
  linkPath: string,
) => `[![Sentinel](${origin}${badgePath})](${origin}${linkPath})`;
