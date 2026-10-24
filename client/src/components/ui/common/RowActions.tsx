import IconButton from "@mui/material/IconButton";
import { Box } from "@mui/material";
import { AppTooltip } from "@/components/ui/common/AppTooltip";

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
        "&:focus-within": { opacity: 1 },
        "@media (hover: none)": { opacity: 1 },
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
      }}
    >
      {visible.map((action) => {
        const c = COLOR_MAP[action.color ?? "accent"];
        return (
          <AppTooltip key={action.label} title={action.label}>
            <IconButton
              type="button"
              onClick={
                action.disabled
                  ? (e: React.MouseEvent) => e.stopPropagation()
                  : action.onClick
              }
              sx={{
                p: 0,
                cursor: action.disabled ? "default" : "pointer",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--r-sm)",
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
            </IconButton>
          </AppTooltip>
        );
      })}
    </Box>
  );
};
