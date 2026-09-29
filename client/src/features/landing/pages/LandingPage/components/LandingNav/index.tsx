import { useState } from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#faq", label: "FAQ" },
] as const;

export const LandingNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="nav"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        pt: { xs: "16px", md: "20px" },
        px: { xs: "16px", md: "24px" },
      }}
    >
      <Box
        sx={{
          maxWidth: 980,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          px: { xs: "16px", md: "24px" },
          py: "12px",
          borderRadius: "999px",
          border: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--s1) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(160%)",
          boxShadow: "var(--sh-2)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        >
          <SentinelLogo width={22} height={26} />
          Sentinel
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: "4px",
          }}
        >
          {LINKS.map((link) => (
            <Box
              key={link.href}
              component="a"
              href={link.href}
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                textDecoration: "none",
                px: "14px",
                py: "8px",
                borderRadius: "var(--r-sm)",
                transition: "color 0.15s",
                "&:hover": { color: "var(--text)", textDecoration: "none" },
              }}
            >
              {link.label}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Button
            component={Link}
            to={ROUTES.LOGIN}
            variant="contained"
            size="small"
            sx={{
              px: "18px",
              borderRadius: "999px",
              boxShadow: "0 8px 20px -8px var(--accent-border)",
              textTransform: "uppercase",
            }}
          >
            Commencer
          </Button>
        </Box>

        <IconButton
          aria-label="Fonctionnalités"
          sx={{ display: { xs: "inline-flex", md: "none" } }}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseOutlined /> : <MenuOutlined />}
        </IconButton>
      </Box>

      {open && (
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            gap: "4px",
            maxWidth: 980,
            mx: "auto",
            mt: "10px",
            p: "10px",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            background: "var(--s1)",
            boxShadow: "var(--sh-3)",
          }}
        >
          {LINKS.map((link) => (
            <Box
              key={link.href}
              component="a"
              href={link.href}
              onClick={() => setOpen(false)}
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                textDecoration: "none",
                p: "12px 14px",
                borderRadius: "12px",
                "&:hover": { color: "var(--text)", textDecoration: "none" },
              }}
            >
              {link.label}
            </Box>
          ))}
          <Box
            sx={{
              mt: "8px",
              pt: "10px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Button
              component={Link}
              to={ROUTES.LOGIN}
              variant="contained"
              size="large"
              fullWidth
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 18 }} />}
              sx={{
                py: "12px",
                fontSize: "15px",
                borderRadius: "var(--r-lg)",
                boxShadow: "0 12px 28px -10px var(--accent-border)",
              }}
            >
              Essai gratuit
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
