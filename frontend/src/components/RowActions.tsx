import { Box, Tooltip } from "@mui/material";

export interface RowAction {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  color?: "accent" | "red" | "green" | "yellow" | "orange";
  disabled?: boolean;
}

const COLOR_MAP = {
  accent: {
    color: "var(--accent)",
    bg: "rgba(99,102,241,0.14)",
    border: "rgba(99,102,241,0.28)",
  },
  red: {
    color: "var(--red)",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(239,68,68,0.28)",
  },
  green: {
    color: "var(--green)",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(34,197,94,0.28)",
  },
  yellow: {
    color: "var(--yellow)",
    bg: "rgba(245,158,11,0.14)",
    border: "rgba(245,158,11,0.28)",
  },
  orange: {
    color: "var(--orange)",
    bg: "rgba(249,115,22,0.14)",
    border: "rgba(249,115,22,0.28)",
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
                    background: c.bg,
                    outline: `1px solid ${c.border}`,
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
