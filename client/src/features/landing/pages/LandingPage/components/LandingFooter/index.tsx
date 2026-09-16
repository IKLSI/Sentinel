import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { to: ROUTES.LEGAL_NOTICE, label: "Mentions légales" },
  { to: ROUTES.PRIVACY, label: "Confidentialité" },
  { to: ROUTES.TERMS, label: "CGU" },
] as const;

export const LandingFooter = () => (
  <Box
    component="footer"
    sx={{ borderTop: "1px solid var(--border)", py: "28px" }}
  >
    <Box
      sx={{
        maxWidth: 1160,
        mx: "auto",
        px: { xs: "20px", md: "32px" },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ fontSize: "13px", color: "var(--muted)" }}>
        © 2026 Sentinel
      </Box>
      <Box sx={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
        {LINKS.map((link) => (
          <Box
            key={link.to}
            component={Link}
            to={link.to}
            sx={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "color 0.15s",
              "&:hover": { color: "var(--text)", textDecoration: "none" },
            }}
          >
            {link.label}
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
