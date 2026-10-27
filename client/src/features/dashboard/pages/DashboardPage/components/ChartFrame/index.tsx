import type React from "react";
import Box from "@mui/material/Box";
import { ResponsiveContainer } from "recharts";
import { RESPONSIVE_CHART_MIN_HEIGHT } from "@/features/dashboard/pages/DashboardPage/constants";

interface Props {
  children: React.ReactElement;
}

export const ChartFrame: React.FC<Props> = ({ children }) => (
  <Box
    sx={{
      flex: 1,
      minHeight: RESPONSIVE_CHART_MIN_HEIGHT,
      position: "relative",
    }}
  >
    <Box sx={{ position: "absolute", inset: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </Box>
  </Box>
);
