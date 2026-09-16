import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { FAQ_ITEMS } from "@/features/landing/constants";

export const Faq = () => (
  <Box
    component="section"
    id="faq"
    sx={{
      minHeight: "100dvh",
      scrollMarginTop: "88px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      py: { xs: "64px", md: "96px" },
      borderBottom: "1px solid var(--border)",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 820,
        mx: "auto",
        px: { xs: "20px", md: "32px" },
      }}
    >
      <Box sx={{ textAlign: "center", mb: "48px" }}>
        <Box
          component="h2"
          sx={{
            m: 0,
            fontSize: { xs: "36px", md: "60px" },
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 0.98,
            color: "var(--text)",
          }}
        >
          Questions fréquentes.
        </Box>
        <Box
          sx={{
            width: 56,
            height: 4,
            borderRadius: "2px",
            background: "var(--cyan)",
            mx: "auto",
            mt: "20px",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {FAQ_ITEMS.map((item) => (
          <Accordion
            key={item.question}
            disableGutters
            elevation={0}
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "16px !important",
              overflow: "hidden",
              transition: "border-color 0.2s, box-shadow 0.2s",
              "&::before": { display: "none" },
              "&.Mui-expanded": {
                margin: 0,
                borderColor: "var(--text)",
                boxShadow: "var(--sh-2)",
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreOutlined sx={{ color: "var(--text)" }} />}
              sx={{ px: "28px", py: "6px" }}
            >
              <Box
                sx={{ fontWeight: 600, fontSize: "16px", color: "var(--text)" }}
              >
                {item.question}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: "28px", pb: "26px" }}>
              <Box
                sx={{
                  color: "var(--text-secondary)",
                  fontSize: "15px",
                  lineHeight: 1.65,
                }}
              >
                {item.answer}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  </Box>
);
