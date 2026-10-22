import { type FC, useId } from "react";

interface Props {
  width?: number;
  height?: number;
}

const TILE_SIZE = 512;
const TILE_RADIUS = 116;
const EDGE_INSET = 3;
const PERIOD = { x: 360, y: 333, size: 58 };
const LETTER_PATH =
  "M220 391L220 391Q193.50 391 172 386.25Q150.50 381.50 134.50 372.50Q118.50 363.50 108.25 350.75Q98 338 94 322.50L94 322.50L154 296Q157.50 304.50 166.25 313.25Q175 322 189.75 327.50Q204.50 333 225.50 333L225.50 333Q245.50 333 256.75 327.25Q268 321.50 268 310.50L268 310.50Q268 302.50 261.75 297.75Q255.50 293 243 289.25Q230.50 285.50 212 282L212 282Q193 278 173.50 272.75Q154 267.50 137 258.25Q120 249 109.75 233.75Q99.50 218.50 99.50 195L99.50 195Q99.50 170.50 112.50 152.25Q125.50 134 151.25 123.50Q177 113 214 113L214 113Q247 113 272 121.50Q297 130 313.75 145.75Q330.50 161.50 337 183.50L337 183.50L272.50 206.50Q270 195.50 262.25 187.50Q254.50 179.50 242.75 175.25Q231 171 215 171L215 171Q195.50 171 184.75 177Q174 183 174 193L174 193Q174 201 181.25 206.25Q188.50 211.50 202 215Q215.50 218.50 234 222.50L234 222.50Q253.50 226.50 272.75 231.75Q292 237 307.75 245.75Q323.50 254.50 332.75 268.75Q342 283 342 305.50L342 305.50Q342 332 328 351.25Q314 370.50 286.75 380.75Q259.50 391 220 391Z";

export const SentinelLogo: FC<Props> = ({ width = 28, height = 28 }) => {
  const tileGradientId = useId();

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
        viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={tileGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1E1E23" />
            <stop offset="1" stopColor="#0C0C0F" />
          </linearGradient>
        </defs>
        <rect
          width={TILE_SIZE}
          height={TILE_SIZE}
          rx={TILE_RADIUS}
          fill={`url(#${tileGradientId})`}
        />
        <rect
          x={EDGE_INSET}
          y={EDGE_INSET}
          width={TILE_SIZE - EDGE_INSET * 2}
          height={TILE_SIZE - EDGE_INSET * 2}
          rx={TILE_RADIUS - EDGE_INSET}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth={EDGE_INSET * 2}
        />
        <path fill="#F7F7F5" d={LETTER_PATH} />
        <rect
          x={PERIOD.x}
          y={PERIOD.y}
          width={PERIOD.size}
          height={PERIOD.size}
          fill="#818CF8"
        />
      </svg>
    </span>
  );
};
