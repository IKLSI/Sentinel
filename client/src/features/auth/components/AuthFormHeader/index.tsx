import type React from "react";
import Box from "@mui/material/Box";
import { riseInSx } from "@/features/auth/styles";

interface AuthFormHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthFormHeader: React.FC<AuthFormHeaderProps> = ({
  title,
  subtitle,
}) => (
  <Box sx={{ mb: "28px", ...riseInSx(0.44) }}>
    <Box
      component="h2"
      sx={{
        m: "0 0 5px",
        fontFamily:
          '"Bricolage Grotesque Variable", var(--font-ui), sans-serif',
        fontSize: "26px",
        fontWeight: 800,
        letterSpacing: "-0.04em",
        color: "var(--auth-gray-900)",
      }}
    >
      {title}
    </Box>
    <Box
      component="p"
      sx={{ m: 0, fontSize: "13px", color: "var(--auth-gray-500)" }}
    >
      {subtitle}
    </Box>
  </Box>
);
