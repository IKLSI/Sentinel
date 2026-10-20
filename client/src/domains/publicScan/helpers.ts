export const buildProjectBadgePath = (token: string) =>
  `/api/public/badge/${encodeURIComponent(token)}.svg`;

export const buildBadgeMarkdown = (
  origin: string,
  badgePath: string,
  linkPath: string,
) => `[![Sentinel](${origin}${badgePath})](${origin}${linkPath})`;
