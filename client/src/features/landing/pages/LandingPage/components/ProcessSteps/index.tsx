import Box from "@mui/material/Box";
import { PROCESS_STEPS } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

const FOLDER_PATH =
  "M0,0 L0.29,0 L0.318,0.14 L0.955,0.14 Q1,0.14 1,0.19 L1,0.935 Q1,0.98 0.955,0.98 L0.045,0.98 Q0,0.98 0,0.935 L0,0 Z";

export const ProcessSteps = () => (
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
      borderBottom: "2px solid var(--border)",
      background: "#f0f9ff",
      overflow: "hidden",
    }}
  >
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: "-60px",
        right: "8%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--purple) 12%, transparent) 0%, transparent 70%)",
        filter: "blur(20px)",
      }}
    />
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        bottom: "-110px",
        left: "-60px",
        width: "460px",
        height: "460px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--orange) 12%, transparent) 0%, transparent 70%)",
        filter: "blur(20px)",
      }}
    />
    <Box
      sx={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1160,
        mx: "auto",
        px: { xs: "20px", md: "32px" },
      }}
    >
      <SectionHeading
        title="Trois étapes vous séparent de la première alerte."
        subtitle="Pas d'intégration lourde, pas d'agent à installer. Sentinel se branche sur vos dépôts, croise vos dépendances avec les bases de vulnérabilités et calcule votre score de santé en continu."
      />

      <Box
        component="svg"
        aria-hidden
        sx={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <clipPath id="steps-folder-clip" clipPathUnits="objectBoundingBox">
            <path d={FOLDER_PATH} />
          </clipPath>
        </defs>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: "16px", md: "32px" },
        }}
      >
        {PROCESS_STEPS.map((step, index) => (
          <Box key={step.id} sx={{ position: "relative" }}>
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(160deg, color-mix(in srgb, ${step.color} 8%, transparent), transparent 55%), var(--s1)`,
                clipPath: "url(#steps-folder-clip)",
              }}
            />
            <Box
              component="svg"
              aria-hidden
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "visible",
              }}
            >
              <path
                d={FOLDER_PATH}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </Box>
            <Box
              sx={{
                position: "relative",
                height: "32px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                pl: "16px",
                color: "var(--muted)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.07em",
              }}
            >
              <Box
                sx={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: step.color,
                  flexShrink: 0,
                }}
              />
              {`ÉTAPE 0${index + 1}`}
            </Box>
            <Box sx={{ position: "relative", p: "6px 28px 32px" }}>
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  top: "0px",
                  right: "18px",
                  fontSize: "56px",
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: "var(--text)",
                  opacity: 0.045,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                {index + 1}
              </Box>
              <Box
                sx={{
                  width: "26px",
                  height: "3px",
                  borderRadius: "2px",
                  background: step.color,
                  mb: "18px",
                }}
              />
              <Box
                component="h3"
                sx={{
                  position: "relative",
                  m: 0,
                  fontSize: "21px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  mb: "10px",
                }}
              >
                {step.title}
              </Box>
              <Box
                component="p"
                sx={{
                  position: "relative",
                  m: 0,
                  fontSize: "14.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {step.desc}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
