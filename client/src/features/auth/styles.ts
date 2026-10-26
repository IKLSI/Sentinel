import { keyframes } from "@mui/material/styles";

const riseIn = keyframes`
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

export const riseInSx = (delay: number, duration = 0.5, offset = 0) => ({
  opacity: 0,
  transform: `translateY(${offset}px)`,
  animation: `${riseIn} ${duration}s ${delay}s ${EASE_OUT} forwards`,
});

export const AUTH_FORM_SX = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  ...riseInSx(0.52),
} as const;

export const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;
