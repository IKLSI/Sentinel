import type React from "react";
import Box from "@mui/material/Box";
import { OrganisationTab } from "../SettingsPage/components/OrganisationTab";

export const OrganisationPage: React.FC = () => (
  <Box
    className="page-enter"
    sx={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      p: "20px 28px",
    }}
  >
    <OrganisationTab />
  </Box>
);
