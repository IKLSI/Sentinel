import type React from "react";
import Box from "@mui/material/Box";

interface AuthModalSuccessProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export const AuthModalSuccess: React.FC<AuthModalSuccessProps> = ({
  title,
  subtitle,
  children,
}) => (
  <Box sx={{ textAlign: "center", py: "8px" }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text)",
        mx: "auto",
        mb: "14px",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 10l4 4 8-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
    <Box
      sx={{
        fontSize: "14px",
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.02em",
        mb: "5px",
      }}
    >
      {title}
    </Box>
    <Box
      sx={{
        fontSize: "12.5px",
        color: "var(--muted2)",
        lineHeight: 1.65,
      }}
    >
      {subtitle}
    </Box>
    {children}
  </Box>
);

interface AuthPageSuccessProps {
  title: string;
  subtitle: React.ReactNode;
  failed?: boolean;
  children?: React.ReactNode;
}

export const AuthPageSuccess: React.FC<AuthPageSuccessProps> = ({
  title,
  subtitle,
  failed = false,
  children,
}) => {
  const tone = failed ? "var(--auth-red-600)" : "var(--auth-indigo-500)";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        height: "100%",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: tone,
          background: failed
            ? "color-mix(in srgb, var(--auth-red-600) 10%, transparent)"
            : "var(--auth-indigo-50)",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          <path
            d={failed ? "M9 9l10 10M19 9L9 19" : "M6 14l6 6 10-10"}
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      <Box
        component="p"
        sx={{
          m: 0,
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--auth-gray-900)",
        }}
      >
        {title}
      </Box>
      <Box
        component="p"
        sx={{
          m: 0,
          fontSize: "13px",
          lineHeight: 1.6,
          color: "var(--auth-gray-400)",
        }}
      >
        {subtitle}
      </Box>
      {children}
    </Box>
  );
};
