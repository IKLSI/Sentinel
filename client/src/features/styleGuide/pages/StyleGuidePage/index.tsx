import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import FavoriteBorderOutlined from "@mui/icons-material/FavoriteBorderOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import MailOutlineOutlined from "@mui/icons-material/MailOutlineOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import UploadOutlined from "@mui/icons-material/UploadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import MoreHorizOutlined from "@mui/icons-material/MoreHorizOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import { useT } from "@/contexts/I18nContext";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { AppModal } from "@/components/ui/common/AppModal";
import { DeleteModal } from "@/components/ui/common/DeleteModal";

const TYPE_SCALE = [
  { key: "3xs", rem: "0.5rem" },
  { key: "2xs", rem: "0.625rem" },
  { key: "xs", rem: "0.75rem" },
  { key: "sm", rem: "0.875rem" },
  { key: "base", rem: "1rem" },
  { key: "lg", rem: "1.125rem" },
  { key: "xl", rem: "1.25rem" },
  { key: "2xl", rem: "1.5rem" },
  { key: "3xl", rem: "1.875rem" },
  { key: "4xl", rem: "2.25rem" },
] as const;

const WEIGHTS = [
  { label: "Regular", weight: 400 },
  { label: "Medium", weight: 500 },
  { label: "Semibold", weight: 600 },
  { label: "Bold", weight: 700 },
] as const;

const SURFACE_TOKENS = ["bg", "s1", "s2", "s3", "border", "border2"] as const;
const TEXT_TOKENS = ["text", "text-secondary", "muted", "muted2"] as const;
const SEMANTIC_TOKENS = [
  { name: "accent", desc: "primary" },
  { name: "accent-fill", desc: "primary fill" },
  { name: "green", desc: "success" },
  { name: "green-fill", desc: "success fill" },
  { name: "yellow", desc: "warning" },
  { name: "orange", desc: "orange" },
  { name: "red", desc: "destructive" },
  { name: "red-fill", desc: "destructive fill" },
  { name: "cyan", desc: "cyan" },
  { name: "purple", desc: "purple" },
] as const;

const RADII = [
  { key: "r-xs", label: "xs · 4px" },
  { key: "r-sm", label: "sm · 6px" },
  { key: "r", label: "base · 8px" },
  { key: "r-md", label: "md · 12px" },
  { key: "r-lg", label: "lg · 16px" },
  { key: "r-xl", label: "xl · 20px" },
] as const;

const NO_HOVER_ELEVATION = {
  "&:hover": { boxShadow: "none", transform: "none" },
} as const;

const SPACING = [
  { label: "1", px: 4 },
  { label: "2", px: 8 },
  { label: "3", px: 12 },
  { label: "4", px: 16 },
  { label: "6", px: 24 },
  { label: "8", px: 32 },
  { label: "10", px: 40 },
  { label: "12", px: 48 },
] as const;

const ICONS = [
  { Icon: HomeOutlined, name: "Home" },
  { Icon: PersonOutlined, name: "User" },
  { Icon: SettingsOutlined, name: "Settings" },
  { Icon: SearchOutlined, name: "Search" },
  { Icon: NotificationsNoneOutlined, name: "Bell" },
  { Icon: FavoriteBorderOutlined, name: "Heart" },
  { Icon: StarBorderOutlined, name: "Star" },
  { Icon: MailOutlineOutlined, name: "Mail" },
  { Icon: AddOutlined, name: "Plus" },
  { Icon: CheckOutlined, name: "Check" },
  { Icon: CloseOutlined, name: "Close" },
  { Icon: WarningAmberOutlined, name: "Warning" },
  { Icon: InfoOutlined, name: "Info" },
  { Icon: ArrowForwardOutlined, name: "Arrow" },
  { Icon: DownloadOutlined, name: "Download" },
  { Icon: UploadOutlined, name: "Upload" },
  { Icon: DeleteOutlined, name: "Delete" },
  { Icon: EditOutlined, name: "Edit" },
  { Icon: VisibilityOutlined, name: "Eye" },
  { Icon: ContentCopyOutlined, name: "Copy" },
  { Icon: ShareOutlined, name: "Share" },
  { Icon: FilterListOutlined, name: "Filter" },
  { Icon: MoreHorizOutlined, name: "More" },
  { Icon: ChevronRightOutlined, name: "Chevron" },
] as const;

const Section: React.FC<{
  title: string;
  desc?: string;
  children: React.ReactNode;
}> = ({ title, desc, children }) => (
  <Box
    component="section"
    sx={{
      py: "40px",
      borderTop: "1px solid var(--border)",
      "&:first-of-type": { borderTop: "none", pt: 0 },
    }}
  >
    <Box
      sx={{
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        mb: desc ? "6px" : "20px",
      }}
    >
      {title}
    </Box>
    {desc && (
      <Box
        sx={{ fontSize: "13px", color: "var(--text-secondary)", mb: "24px" }}
      >
        {desc}
      </Box>
    )}
    {children}
  </Box>
);

const SubLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "var(--muted2)",
      mb: "12px",
    }}
  >
    {children}
  </Box>
);

const Swatch: React.FC<{ varName: string; label: string; sub: string }> = ({
  varName,
  label,
  sub,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <Box
      sx={{
        height: "56px",
        borderRadius: "var(--r-md)",
        background: `var(--${varName})`,
        border: "1px solid var(--border)",
      }}
    />
    <Box>
      <Box sx={{ fontSize: "12px", fontWeight: 600 }}>{label}</Box>
      <Box
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--muted2)",
        }}
      >
        {sub}
      </Box>
    </Box>
  </Box>
);

const OutlineBadge: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
}> = ({
  children,
  color = "var(--text-secondary)",
  bg = "transparent",
  border = "var(--border2)",
}) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      height: "24px",
      px: "10px",
      borderRadius: "var(--r-sm)",
      fontSize: "12px",
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${border}`,
    }}
  >
    {children}
  </Box>
);

export const StyleGuidePage: React.FC = () => {
  const t = useT();
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("Sentinel API");

  return (
    <Box sx={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Box sx={{ maxWidth: "980px", mx: "auto", px: "32px", py: "56px" }}>
        <Box
          sx={{
            mb: "8px",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {t("style_guide.title")}
        </Box>
        <Box
          sx={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {t("style_guide.subtitle")}
        </Box>

        <Box sx={{ height: "48px" }} />

        <Section title={t("style_guide.section.typography")}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              mb: "28px",
            }}
          >
            {TYPE_SCALE.map((s) => (
              <Box
                key={s.key}
                sx={{ display: "flex", alignItems: "baseline", gap: "16px" }}
              >
                <Box
                  sx={{
                    width: "110px",
                    flexShrink: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--muted2)",
                  }}
                >
                  {s.key} — {s.rem}
                </Box>
                <Box
                  sx={{
                    fontSize: s.rem,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Sentinel
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {WEIGHTS.map((w) => (
              <Box
                key={w.label}
                sx={{ fontSize: "14px", fontWeight: w.weight }}
              >
                {w.label} — The quick brown fox jumps over the lazy dog
              </Box>
            ))}
          </Box>
        </Section>

        <Section
          title={t("style_guide.section.colors")}
          desc={t("style_guide.section.colors_desc")}
        >
          <SubLabel>{t("style_guide.color.surfaces")}</SubLabel>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "14px",
              mb: "28px",
            }}
          >
            {SURFACE_TOKENS.map((token) => (
              <Swatch
                key={token}
                varName={token}
                label={token}
                sub={`--${token}`}
              />
            ))}
          </Box>

          <SubLabel>{t("style_guide.color.text")}</SubLabel>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "14px",
              mb: "28px",
            }}
          >
            {TEXT_TOKENS.map((token) => (
              <Swatch
                key={token}
                varName={token}
                label={token}
                sub={`--${token}`}
              />
            ))}
          </Box>

          <SubLabel>{t("style_guide.color.accent")}</SubLabel>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "14px",
            }}
          >
            {SEMANTIC_TOKENS.map(({ name, desc }) => (
              <Swatch key={name} varName={name} label={name} sub={desc} />
            ))}
          </Box>
        </Section>

        <Section
          title={t("style_guide.section.buttons")}
          desc={t("style_guide.section.buttons_desc")}
        >
          <SubLabel>Variants</SubLabel>
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: "10px", mb: "24px" }}
          >
            <Button variant="contained" sx={NO_HOVER_ELEVATION}>
              {t("common.save")}
            </Button>
            <Button variant="outlined">{t("common.edit")}</Button>
            <Button variant="text">{t("common.cancel")}</Button>
            <Button
              variant="contained"
              sx={{
                background: "var(--red) !important",
                boxShadow: "none !important",
                ...NO_HOVER_ELEVATION,
              }}
            >
              {t("common.delete")}
            </Button>
          </Box>

          <SubLabel>Sizes</SubLabel>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "10px",
              mb: "24px",
            }}
          >
            <Button variant="contained" size="small" sx={NO_HOVER_ELEVATION}>
              Small
            </Button>
            <Button variant="contained" size="medium" sx={NO_HOVER_ELEVATION}>
              Default
            </Button>
          </Box>

          <SubLabel>With icons</SubLabel>
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: "10px", mb: "24px" }}
          >
            <Button
              variant="outlined"
              startIcon={<DownloadOutlined sx={{ fontSize: 16 }} />}
            >
              Download
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 16 }} />}
              sx={NO_HOVER_ELEVATION}
            >
              Next
            </Button>
            <IconButton
              sx={{
                border: "1px solid var(--border2)",
                borderRadius: "var(--r)",
                width: 36,
                height: 36,
                color: "var(--red)",
              }}
            >
              <DeleteOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <SubLabel>States</SubLabel>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <Button variant="contained" disabled sx={NO_HOVER_ELEVATION}>
              {t("common.save")}
            </Button>
            <Button variant="outlined" disabled>
              {t("common.edit")}
            </Button>
            <Button
              variant="contained"
              disabled
              startIcon={
                <CircularProgress size={12} sx={{ color: "inherit" }} />
              }
              sx={NO_HOVER_ELEVATION}
            >
              {t("common.deleting")}
            </Button>
          </Box>
        </Section>

        <Section title="Inputs">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "380px",
            }}
          >
            <Box>
              <SubLabel>Default</SubLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher un projet…"
              />
            </Box>
            <Box>
              <SubLabel>With icon</SubLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher…"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined
                          sx={{ fontSize: 16, color: "var(--muted)" }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            <Box>
              <SubLabel>Disabled</SubLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Champ désactivé"
                disabled
              />
            </Box>
            <Box>
              <SubLabel>Textarea</SubLabel>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Décrivez le ticket…"
              />
            </Box>
          </Box>
        </Section>

        <Section
          title={t("style_guide.section.chips")}
          desc={t("style_guide.section.chips_desc")}
        >
          <SubLabel>Status</SubLabel>
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: "10px", mb: "24px" }}
          >
            <StatusChip variant="red">CRITIQUE</StatusChip>
            <StatusChip variant="orange">ÉLEVÉ</StatusChip>
            <StatusChip variant="yellow">MOYEN</StatusChip>
            <StatusChip variant="green">RÉSOLU</StatusChip>
            <StatusChip variant="blue">EN COURS</StatusChip>
            <StatusChip variant="cyan">EN REVUE</StatusChip>
            <StatusChip variant="purple">PLANIFIÉ</StatusChip>
            <StatusChip variant="gray">ARCHIVÉ</StatusChip>
          </Box>

          <SubLabel>Badges</SubLabel>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <OutlineBadge
              bg="var(--s3)"
              color="var(--text)"
              border="var(--border2)"
            >
              Default
            </OutlineBadge>
            <OutlineBadge bg="var(--s2)" color="var(--text-secondary)">
              Secondary
            </OutlineBadge>
            <OutlineBadge>Outline</OutlineBadge>
            <OutlineBadge
              bg="var(--red-subtle)"
              color="var(--red)"
              border="color-mix(in srgb, var(--red) 28%, transparent)"
            >
              Destructive
            </OutlineBadge>
            <OutlineBadge
              bg="var(--green-subtle)"
              color="var(--green)"
              border="color-mix(in srgb, var(--green) 28%, transparent)"
            >
              Success
            </OutlineBadge>
            <OutlineBadge
              bg="var(--yellow-subtle)"
              color="var(--yellow)"
              border="color-mix(in srgb, var(--yellow) 25%, transparent)"
            >
              Warning
            </OutlineBadge>
          </Box>
        </Section>

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
              <Box
                sx={{ fontSize: "12px", color: "var(--muted2)", mb: "14px" }}
              >
                3 non lues
              </Box>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
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
        </Section>

        <Section title="Avatars">
          <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: "var(--s3)",
                color: "var(--muted)",
                fontSize: "9px",
              }}
            >
              JD
            </Avatar>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "var(--s3)",
                color: "var(--muted)",
                fontSize: "11px",
              }}
            >
              JD
            </Avatar>
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
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "var(--accent-subtle)",
                color: "var(--accent)",
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              JD
            </Avatar>
          </Box>
        </Section>

        <Section title="Switch">
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Switch defaultChecked />
              <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Actif
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Switch />
              <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Inactif
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Switch disabled />
              <Box sx={{ fontSize: "13px", color: "var(--muted)" }}>
                Désactivé
              </Box>
            </Box>
          </Box>
        </Section>

        <Section
          title={t("style_guide.section.modals")}
          desc={t("style_guide.section.modals_desc")}
        >
          <Box sx={{ display: "flex", gap: "10px" }}>
            <Button variant="outlined" onClick={() => setAppModalOpen(true)}>
              {t("style_guide.modal_demo.open_app")}
            </Button>
            <Button variant="outlined" onClick={() => setDeleteModalOpen(true)}>
              {t("style_guide.modal_demo.open_delete")}
            </Button>
          </Box>
        </Section>

        <Section
          title="Icons"
          desc="MUI Icons Outlined — sous-ensemble utilisé dans l'application."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: "10px",
            }}
          >
            {ICONS.map(({ Icon, name }) => (
              <Box
                key={name}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  p: "14px 6px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  background: "var(--s1)",
                }}
              >
                <Icon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
                <Box sx={{ fontSize: "10px", color: "var(--muted2)" }}>
                  {name}
                </Box>
              </Box>
            ))}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                p: "14px 6px",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                background: "var(--s1)",
              }}
            >
              <AutorenewOutlined
                sx={{
                  fontSize: 18,
                  color: "var(--text-secondary)",
                  animation: "spin 1.2s linear infinite",
                  "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                }}
              />
              <Box sx={{ fontSize: "10px", color: "var(--muted2)" }}>
                Loader
              </Box>
            </Box>
          </Box>
        </Section>

        <Section
          title={t("style_guide.section.radius")}
          desc={t("style_guide.section.radius_desc")}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: "14px",
            }}
          >
            {RADII.map((r) => (
              <Box
                key={r.key}
                sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "64px",
                    background: "var(--s2)",
                    border: "1px solid var(--border2)",
                    borderRadius: `var(--${r.key})`,
                  }}
                />
                <Box
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--muted2)",
                  }}
                >
                  {r.label}
                </Box>
              </Box>
            ))}
          </Box>
        </Section>

        <Section title="Spacing">
          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {SPACING.map((s) => (
              <Box
                key={s.label}
                sx={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <Box
                  sx={{
                    width: "24px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--muted2)",
                  }}
                >
                  {s.label}
                </Box>
                <Box
                  sx={{
                    width: `${s.px}px`,
                    height: "12px",
                    background: "var(--accent-subtle)",
                    border: "1px dashed var(--accent-border)",
                  }}
                />
                <Box
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--muted2)",
                  }}
                >
                  {s.px}px
                </Box>
              </Box>
            ))}
          </Box>
        </Section>
      </Box>

      <AppModal
        open={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        title={t("style_guide.modal_demo.app_title")}
        actions={
          <>
            <Button variant="text" onClick={() => setAppModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => setAppModalOpen(false)}
              sx={NO_HOVER_ELEVATION}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <TextField
          fullWidth
          size="small"
          label={t("style_guide.modal_demo.app_body_label")}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </AppModal>

      <DeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => setDeleteModalOpen(false)}
        title={t("style_guide.modal_demo.delete_title")}
      >
        {t("style_guide.modal_demo.delete_body")}
      </DeleteModal>
    </Box>
  );
};
