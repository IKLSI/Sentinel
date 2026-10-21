import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { SHOWCASE, STEP_CHIP_SX } from "@/features/landing/constants";
import { REPOSITORY_HOST_LOGOS } from "@/features/landing/ecosystemLogos";

const CONNECTED_REPOSITORIES = [
  { logo: REPOSITORY_HOST_LOGOS.github, name: SHOWCASE.onlineStoreRepository },
  {
    logo: REPOSITORY_HOST_LOGOS.gitlab,
    name: SHOWCASE.customerPortalRepository,
  },
] as const;

export const StepRepositories: React.FC = () => {
  const t = useT();
  return (
    <>
      {CONNECTED_REPOSITORIES.map(({ logo, name }) => (
        <Box
          key={name}
          sx={{
            ...STEP_CHIP_SX,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "9px",
            borderRadius: "12px",
            p: "10px 12px",
            fontSize: "13px",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d={logo} fill="var(--ink)" opacity={0.8} />
          </svg>
          <Box
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--ink)",
            }}
          >
            {name}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "#15803d",
              background: "#eaf7ef",
              px: "8px",
              py: "2px",
              borderRadius: "999px",
            }}
          >
            {t("landing.steps.connected")}
          </Box>
        </Box>
      ))}
    </>
  );
};
