import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { COMPARE_FEATURES } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";
import { useT } from "@/contexts/I18nContext";

export const CompareTable = () => {
  const t = useT();

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: "100dvh",
        scrollMarginTop: "88px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: "64px", md: "96px" },
        borderBottom: "1px solid var(--border)",
        background: "var(--s1)",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "10%",
          left: "-120px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--red) 10%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: "-100px",
          right: "5%",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--purple) 12%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1000,
          mx: "auto",
          px: { xs: "20px", md: "32px" },
        }}
      >
        <SectionHeading
          title={t("landing.compare.title")}
          subtitle={t("landing.compare.subtitle")}
        />

        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: "12px", md: "28px" },
          }}
        >
          <Box
            sx={{
              border: "1px solid var(--border)",
              borderRadius: "14px",
              overflow: "hidden",
              background: "var(--s1)",
            }}
          >
            <Box
              sx={{
                p: "16px 24px",
                borderBottom: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text)",
              }}
            >
              {t("landing.compare.specialized_tools")}
            </Box>
            <Box
              sx={{
                p: { xs: "16px 20px 8px", md: "18px 28px 10px" },
              }}
            >
              {COMPARE_FEATURES.map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    minHeight: { md: "40px" },
                    "&:not(:last-of-type)": {
                      mb: "8px",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "9px",
                      flexShrink: 0,
                      mt: "1px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--red)",
                    }}
                  >
                    <CloseOutlined sx={{ fontSize: 13, color: "#fff" }} />
                  </Box>
                  <Box sx={{ fontSize: "13.5px", color: "var(--muted)" }}>
                    {t(`landing.compare.${row.id}.competitor`)}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              border: "1px solid var(--purple)",
              borderRadius: "14px",
              overflow: "hidden",
              background: "var(--s1)",
              boxShadow: "var(--sh-2)",
            }}
          >
            <Box
              sx={{
                p: "16px 24px",
                background: "var(--purple)",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              {t("landing.compare.with_sentinel")}
            </Box>
            <Box
              sx={{
                p: { xs: "16px 20px 8px", md: "18px 28px 10px" },
                background: "var(--purple-subtle)",
              }}
            >
              {COMPARE_FEATURES.map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    minHeight: { md: "40px" },
                    "&:not(:last-of-type)": {
                      mb: "8px",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "9px",
                      flexShrink: 0,
                      mt: "1px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--purple)",
                    }}
                  >
                    <CheckOutlined sx={{ fontSize: 11, color: "#fff" }} />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "6px",
                      fontSize: "13.5px",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    {t(`landing.compare.${row.id}.sentinel`)}
                    {row.badge && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: "9.5px",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "var(--accent)",
                          background: "var(--s1)",
                          borderRadius: "999px",
                          p: "2px 6px",
                        }}
                      >
                        {row.badge}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
