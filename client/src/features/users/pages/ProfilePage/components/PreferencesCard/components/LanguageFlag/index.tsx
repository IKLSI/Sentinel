import type React from "react";
import Box from "@mui/material/Box";
import { Language } from "@/enums";

interface LanguageFlagProps {
  language: Language;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 30;
const DEFAULT_HEIGHT = 20;

const FRENCH_FLAG = (
  <svg
    viewBox="0 0 3 2"
    preserveAspectRatio="none"
    width="100%"
    height="100%"
    role="presentation"
  >
    <rect width="1" height="2" fill="#002395" />
    <rect x="1" width="1" height="2" fill="#ffffff" />
    <rect x="2" width="1" height="2" fill="#ed2939" />
  </svg>
);

const BRITISH_FLAG = (
  <svg
    viewBox="0 0 60 30"
    preserveAspectRatio="none"
    width="100%"
    height="100%"
    role="presentation"
  >
    <clipPath id="language-flag-union-jack">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
    </clipPath>
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
    <path
      d="M0,0 L60,30 M60,0 L0,30"
      clipPath="url(#language-flag-union-jack)"
      stroke="#c8102e"
      strokeWidth="4"
    />
    <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
    <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
  </svg>
);

const FLAGS: Record<Language, React.ReactNode> = {
  [Language.Fr]: FRENCH_FLAG,
  [Language.En]: BRITISH_FLAG,
};

export const LanguageFlag: React.FC<LanguageFlagProps> = ({
  language,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => (
  <Box
    sx={{
      width,
      height,
      flexShrink: 0,
      display: "block",
      borderRadius: "2px",
      overflow: "hidden",
      border: "1px solid rgba(0,0,0,0.15)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      lineHeight: 0,
    }}
  >
    {FLAGS[language]}
  </Box>
);
