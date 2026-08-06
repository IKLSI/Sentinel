import { Tooltip, type TooltipProps } from "@mui/material";

export const AppTooltip: React.FC<
  Omit<TooltipProps, "arrow"> & { arrow?: boolean }
> = ({ placement = "top", arrow = true, ...props }) => (
  <Tooltip placement={placement} arrow={arrow} {...props} />
);
