import Box from "@mui/material/Box";

interface Props {
  title: string;
  subtitle: string;
  emphasis?: string;
  accent?: string;
}

export const SectionHeading = ({
  title,
  subtitle,
  emphasis,
  accent = "var(--accent)",
}: Props) => (
  <Box sx={{ textAlign: "center", maxWidth: 860, mx: "auto", mb: "48px" }}>
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
      {title}
    </Box>
    <Box
      sx={{
        width: 80,
        height: 4,
        borderRadius: "2px",
        background: accent,
        mx: "auto",
        mt: "20px",
        mb: "22px",
      }}
    />
    <Box
      component="p"
      sx={{
        m: 0,
        fontSize: { xs: "17px", md: "20px" },
        color: "#3f3f46",
        lineHeight: 1.5,
        fontWeight: 400,
      }}
    >
      {subtitle}
      {emphasis && (
        <>
          <br />
          <Box
            component="strong"
            sx={{ color: "var(--text)", fontWeight: 700 }}
          >
            {emphasis}
          </Box>
        </>
      )}
    </Box>
  </Box>
);
