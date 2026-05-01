import { Box, Tooltip } from "@mui/material";

interface RowAction {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  color?: "accent" | "red" | "green" | "yellow" | "orange";
  disabled?: boolean;
}

const COLOR_MAP = {
  accent: {
    color: "var(--accent)",
    bg: "color-mix(in srgb, var(--accent) 14%, transparent)",
    border: "color-mix(in srgb, var(--accent) 28%, transparent)",
  },
  red: {
    color: "var(--red)",
    bg: "color-mix(in srgb, var(--red) 14%, transparent)",
    border: "color-mix(in srgb, var(--red) 28%, transparent)",
  },
  green: {
    color: "var(--green)",
    bg: "color-mix(in srgb, var(--green) 14%, transparent)",
    border: "color-mix(in srgb, var(--green) 28%, transparent)",
  },
  yellow: {
    color: "var(--yellow)",
    bg: "color-mix(in srgb, var(--yellow) 14%, transparent)",
    border: "color-mix(in srgb, var(--yellow) 28%, transparent)",
  },
  orange: {
    color: "var(--orange)",
    bg: "color-mix(in srgb, var(--orange) 14%, transparent)",
    border: "color-mix(in srgb, var(--orange) 28%, transparent)",
  },
} as const;

export const RowActions: React.FC<{
  actions: (RowAction | null | false | undefined)[];
}> = ({ actions }) => {
  const visible = actions.filter(Boolean) as RowAction[];
  if (visible.length === 0) return null;

  return (
    <Box
      className="row-actions"
      sx={{
        opacity: 0,
        transition: "opacity 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
      }}
    >
      {visible.map((action, i) => {
        const c = COLOR_MAP[action.color ?? "accent"];
        return (
          <Tooltip key={i} title={action.label} placement="top" arrow>
            <Box
              component="button"
              onClick={action.disabled ? undefined : action.onClick}
              sx={{
                all: "unset",
                cursor: action.disabled ? "default" : "pointer",
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                color: "var(--muted)",
                opacity: action.disabled ? 0.35 : 1,
                transition: "background 0.12s, border 0.12s, color 0.12s",
                ...(!action.disabled && {
                  "&:hover": {
                    color: c.color,
                  },
                }),
              }}
            >
              {action.icon}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};
