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
                    color: `var(--${action.color ?? "accent"})`,
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
