import type React from "react";

interface Props {
  values: ReadonlyArray<number | null>;
  color: string;
  width?: number;
  height?: number;
}

const PADDING = 3;
const MIN_POINTS = 2;

export const Sparkline: React.FC<Props> = ({
  values,
  color,
  width = 96,
  height = 28,
}) => {
  const known = values.flatMap((value, index) =>
    value === null ? [] : [{ index, value }],
  );

  if (known.length < MIN_POINTS) return null;

  const min = Math.min(...known.map((point) => point.value));
  const max = Math.max(...known.map((point) => point.value));
  const span = max - min || 1;
  const lastIndex = values.length - 1;

  const project = (index: number, value: number) => ({
    x: PADDING + (index / lastIndex) * (width - PADDING * 2),
    y: height - PADDING - ((value - min) / span) * (height - PADDING * 2),
  });

  const points = known.map(({ index, value }) => project(index, value));
  const path = points
    .map(({ x, y }, position) => `${position === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const end = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={end.x} cy={end.y} r={2.5} fill={color} />
    </svg>
  );
};
