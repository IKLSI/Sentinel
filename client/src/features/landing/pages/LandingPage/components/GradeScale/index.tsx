import Box from "@mui/material/Box";
import { GRADES, LEDGER_ROWS } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

export const GradeScale = () => (
  <Box
    component="section"
    id="fonctionnalites"
    sx={{
      minHeight: "100dvh",
      scrollMarginTop: "88px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      py: { xs: "64px", md: "96px" },
      borderBottom: "1px solid var(--border)",
      background: "var(--s1)",
    }}
  >
    <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: "20px", md: "32px" } }}>
      <SectionHeading
        title="Une note que tout le monde comprend."
        subtitle="Chaque projet reçoit une note de A à F, calculée à partir d'un score sur 100. Lisible d'un coup d'œil par un manager, un développeur ou un client, sans expertise technique requise."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: "18px",
        }}
      >
        {GRADES.map((grade) => (
          <Box
            key={grade.letter}
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              p: "24px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                flexShrink: 0,
                borderRadius: "16px",
                background: grade.color,
                color: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: 800,
                boxShadow: `0 10px 20px -8px color-mix(in srgb, ${grade.color} 70%, transparent)`,
              }}
            >
              {grade.letter}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  mb: "4px",
                }}
              >
                <Box
                  sx={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {grade.label}
                </Box>
                <Box
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: grade.color,
                    background: `color-mix(in srgb, ${grade.color} 14%, var(--s1))`,
                    borderRadius: "999px",
                    px: "9px",
                    py: "3px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {grade.threshold}
                </Box>
              </Box>
              <Box
                sx={{
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.45,
                }}
              >
                {grade.desc}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          maxWidth: 820,
          mx: "auto",
          mt: "72px",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: "12px",
        }}
      >
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: "22px 26px",
            borderRadius: "14px",
            background: "var(--s2)",
            border: "1px solid var(--border)",
          }}
        >
          <Box>
            <Box
              sx={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}
            >
              Un barème transparent
            </Box>
            <Box
              sx={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.45,
                mt: "4px",
              }}
            >
              Chaque risque détecté retire un nombre de points fixe et
              documenté, sans calcul caché.
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              ml: "16px",
            }}
          >
            100
          </Box>
        </Box>

        {LEDGER_ROWS.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: "16px 22px",
              borderRadius: "14px",
              background: "var(--s1)",
              border: "1px solid var(--border)",
              fontSize: "14.5px",
            }}
          >
            <Box sx={{ color: "var(--text-secondary)" }}>{row.label}</Box>
            <Box
              sx={{
                fontWeight: 700,
                color: "var(--red)",
                ml: "16px",
                flexShrink: 0,
              }}
            >
              {row.amount}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
