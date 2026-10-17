import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";

const LINKS = [
  { to: ROUTES.LEGAL_NOTICE, labelKey: "landing.footer.legal_notice" },
  { to: ROUTES.PRIVACY, labelKey: "landing.footer.privacy" },
] as const;

export const LandingFooter = () => {
  const t = useT();

  return (
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
              {t(link.labelKey)}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
