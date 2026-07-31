import { type FC, useId } from "react";

interface Props {
  width?: number;
  height?: number;
}

export const SentinelLogo: FC<Props> = ({ width = 28, height = 32 }) => {
  const shieldId = useId();
  const clipId = useId();

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        flexShrink: 0,
        width,
        height,
        lineHeight: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 24 28"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={shieldId}
            x1="0"
            y1="0"
            x2="24"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#09090b" />
            <stop offset="0.45" stopColor="#09090b" />
            <stop offset="0.45" stopColor="var(--accent)" />
            <stop offset="0.58" stopColor="var(--accent)" />
            <stop offset="0.58" stopColor="#09090b" />
            <stop offset="0.68" stopColor="#09090b" />
            <stop offset="0.68" stopColor="var(--orange)" />
            <stop offset="1" stopColor="var(--orange)" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d="M12 1.5 L22 5 V13 C22 19.5 17.8 24.5 12 26.5 C6.2 24.5 2 19.5 2 13 V5 Z" />
          </clipPath>
        </defs>

        <path
          d="M12 1.5 L22 5 V13 C22 19.5 17.8 24.5 12 26.5 C6.2 24.5 2 19.5 2 13 V5 Z"
          fill={`url(#${shieldId})`}
        />

        <path
          d="M12 5 L18 7.5 V13 C18 17 15.5 20.5 12 22 C8.5 20.5 6 17 6 13 V7.5 Z"
          fill="rgba(255,255,255,0.15)"
        />

        <path
          d="M12 1.5 L22 5 V13 C22 19.5 17.8 24.5 12 26.5 C6.2 24.5 2 19.5 2 13 V5 Z"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.6"
        />

        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="16"
          fontWeight="700"
          fill="white"
          clipPath={`url(#${clipId})`}
        >
          S
        </text>
      </svg>
    </span>
  );
};
