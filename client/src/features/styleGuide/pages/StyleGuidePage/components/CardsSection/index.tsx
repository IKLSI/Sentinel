import type React from "react";
import Box from "@mui/material/Box";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { useT } from "@/contexts/I18nContext";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";

export const CardsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.cards")}
      desc={t("style_guide.section.cards_desc")}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: "20px", borderRadius: "var(--r-md)" }}
        >
          <Box
            sx={{
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              mb: "6px",
            }}
          >
            Sentinel API
          </Box>
          <Box
            sx={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              mb: "16px",
            }}
          >
            Dernière analyse il y a 4 heures. 27 dépendances vérifiées.
          </Box>
          <Button variant="text" size="small" sx={{ px: 0 }}>
            Voir le détail
          </Button>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: "20px", borderRadius: "var(--r-md)" }}
        >
          <Box
            sx={{
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              mb: "4px",
            }}
          >
            Notifications
          </Box>
          <Box sx={{ fontSize: "12px", color: "var(--muted2)", mb: "14px" }}>
            3 non lues
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                icon: NotificationsNoneOutlined,
                text: "Nouveau ticket assigné",
              },
              {
                icon: WarningAmberOutlined,
                text: "Vulnérabilité critique détectée",
              },
              { icon: CheckOutlined, text: "Rapport de conformité prêt" },
            ].map(({ icon: Icon, text }) => (
              <Box
                key={text}
                sx={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Icon sx={{ fontSize: 15, color: "var(--muted)" }} />
                <Box sx={{ fontSize: "13px" }}>{text}</Box>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: "20px", borderRadius: "var(--r-md)" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "var(--s3)",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              JD
            </Avatar>
            <Box>
              <Box sx={{ fontSize: "14px", fontWeight: 700 }}>Jane Doe</Box>
              <Box sx={{ fontSize: "12px", color: "var(--muted2)" }}>
                Administratrice
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mt: "24px" }}>
        <SubLabel>Empty state — EmptyState</SubLabel>
        <Paper variant="outlined" sx={{ borderRadius: "var(--r-md)" }}>
          <EmptyState
            icon={FolderOutlined}
            title="Aucun projet"
            subtitle="Importez un dépôt GitHub ou GitLab pour commencer."
          />
        </Paper>
      </Box>
    </Section>
  );
};
