import React from "react";

interface Props {
  width?: number;
  height?: number;
}

export const SentinelLogo: React.FC<Props> = ({ width = 28, height = 32 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 60 66"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <defs>
      <linearGradient
        id="logo-fill"
        x1="30"
        y1="3"
        x2="30"
        y2="63"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <clipPath id="logo-clip">
        <path d="M30 3 L55 11 V34 C55 47 44 59 30 63 C16 59 5 47 5 34 V11 Z" />
      </clipPath>
    </defs>
    <path
      d="M30 3 L55 11 V34 C55 47 44 59 30 63 C16 59 5 47 5 34 V11 Z"
      fill="url(#logo-fill)"
    />
    <path
      d="M30 14 L44 20 V34 C44 42 38 49 30 52 C22 49 16 42 16 34 V20 Z"
      fill="rgba(255,255,255,0.12)"
    />
    <path
      d="M30 3 L55 11 V34 C55 47 44 59 30 63 C16 59 5 47 5 34 V11 Z"
      fill="none"
      stroke="rgba(165,180,252,0.5)"
      strokeWidth="1.2"
    />
    <text
      x="30"
      y="34"
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="'Playfair Display', Georgia, serif"
      fontSize="42"
      fontWeight="700"
      fill="white"
      clipPath="url(#logo-clip)"
    >
      S
    </text>
  </svg>
);
