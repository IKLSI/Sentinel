import InfoOutlined from "@mui/icons-material/InfoOutlined";
import type { TooltipProps } from "@mui/material/Tooltip";
import { AppTooltip } from "@/components/ui/common/AppTooltip";

interface Props {
  title: TooltipProps["title"];
  placement?: TooltipProps["placement"];
}

export const InfoTooltip: React.FC<Props> = ({
  title,
  placement = "right",
}) => (
  <AppTooltip title={title} placement={placement}>
    <InfoOutlined
      sx={{
        fontSize: 14,
        color: "var(--muted)",
        cursor: "default",
        flexShrink: 0,
        transition: "color 0.12s",
        "&:hover": { color: "var(--accent)" },
      }}
    />
  </AppTooltip>
);
