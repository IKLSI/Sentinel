import React, { useMemo, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { DashPalette, TicketCreationDataPoint, buildPanelSx } from "../../helpers";

const weekdayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const dayNumFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric" });

const formatDay = (isoDate: string) => {
  const d = new Date(`${isoDate}T12:00:00`);
  const raw = weekdayFmt.format(d).replace(/\.$/, "");
  return {
    abbr: raw.charAt(0).toUpperCase() + raw.slice(1),
    num: dayNumFmt.format(d),
  };
};

// SVG coordinate system
const VW = 320;
const VH = 138;
const PL = 26;
const PR = 8;
const PT = 10;
const PB = 30; // two-line x labels
const CW = VW - PL - PR;
const CH = VH - PT - PB;

function niceAxis(max: number): { top: number; ticks: number[] } {
  if (max === 0) return { top: 4, ticks: [0, 2, 4] };
  const step = max <= 3 ? 1 : max <= 8 ? 2 : max <= 20 ? 5 : 10;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { top, ticks };
}

interface Props {
  data: TicketCreationDataPoint[];
  palette: DashPalette;
}

export const TicketCreationPanel: React.FC<Props> = ({ data, palette }) => {
  const t = useT();
  const [hovered, setHovered] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { pts, areaD, lineD, yAxis, xLabels, total } = useMemo(() => {
    if (!data.length) return { pts: [], areaD: "", lineD: "", yAxis: niceAxis(0), xLabels: [], total: 0 };

    const max = Math.max(...data.map((d) => d.count));
    const yAxis = niceAxis(max);

    const pts = data.map((d, i) => ({
      x: PL + (data.length === 1 ? CW / 2 : (i / (data.length - 1)) * CW),
      y: PT + CH * (1 - (yAxis.top > 0 ? d.count / yAxis.top : 0)),
      count: d.count,
      date: d.date,
      isToday: i === data.length - 1,
    }));

    const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

    const areaD = pts.length < 2 ? "" : [
      `M ${pts[0].x.toFixed(2)} ${(PT + CH).toFixed(2)}`,
      ...pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`),
      `L ${pts[pts.length - 1].x.toFixed(2)} ${(PT + CH).toFixed(2)}`,
      "Z",
    ].join(" ");

    const xLabels = data.map((d) => formatDay(d.date));

    const total = data.reduce((s, d) => s + d.count, 0);
    return { pts, areaD, lineD, yAxis, xLabels, total };
  }, [data]);

  const hoveredPt = hovered !== null ? pts[hovered] : null;

  return (
    <Box sx={{ ...buildPanelSx(palette), gridColumn: "span 6", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <Box sx={{ px: "18px", py: "12px", borderBottom: `1px solid ${palette.headerBorder}`, flexShrink: 0 }}>
        <Box sx={{ fontSize: "15px", fontWeight: 700, color: palette.textHeading, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {t("dashboard.creation.title")}
        </Box>
        <Box sx={{ mt: "4px", color: palette.textSecondary, fontSize: "11px" }}>
          {total === 1
            ? t("dashboard.creation.subtitle_week_one")
            : t("dashboard.creation.subtitle_week_other", { count: total })}
        </Box>
      </Box>

      {/* Chart */}
      <Box sx={{ flex: 1, minHeight: 0, px: "14px", py: "12px", display: "flex", alignItems: "center" }}>
        {data.length === 0 ? (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: palette.textSecondary, fontSize: "12px" }}>
            {t("dashboard.creation.empty")}
          </Box>
        ) : (
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            width="100%"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="tck-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="tck-tip-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--s2)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--s1)" stopOpacity="1" />
              </linearGradient>
              <filter id="tck-shadow" x="-20%" y="-20%" width="140%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.28)" />
              </filter>
              <clipPath id="tck-clip">
                <rect x={PL} y={PT - 2} width={CW + PR} height={CH + 4} />
              </clipPath>
            </defs>

            {/* Horizontal grid lines + Y labels */}
            {yAxis.ticks.map((tick) => {
              const y = PT + CH * (1 - (yAxis.top > 0 ? tick / yAxis.top : 0));
              return (
                <g key={tick}>
                  <line
                    x1={PL} y1={y} x2={VW - PR} y2={y}
                    stroke={palette.panelBorder}
                    strokeWidth={0.7}
                    strokeDasharray={tick === 0 ? "none" : "3 4"}
                  />
                  <text
                    x={PL - 5}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="7"
                    fill={palette.textSecondary}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path
              d={areaD}
              fill="url(#tck-area)"
              clipPath="url(#tck-clip)"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease" }}
            />

            {/* Line */}
            <path
              d={lineD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              clipPath="url(#tck-clip)"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
            />

            {/* Dots on data points */}
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hovered === i ? 4 : p.count > 0 ? 2.5 : 1.8}
                fill={hovered === i ? "var(--cyan)" : p.count > 0 ? "var(--accent)" : palette.panelBg}
                stroke={hovered === i ? "var(--cyan)" : "var(--accent)"}
                strokeWidth={hovered === i ? 0 : p.count > 0 ? 0 : 1.2}
                style={{ transition: "r 0.15s, fill 0.15s", cursor: "crosshair", opacity: visible ? 1 : 0 }}
              />
            ))}

            {/* Invisible hover hit areas */}
            {pts.map((p, i) => (
              <rect
                key={`hit-${i}`}
                x={p.x - CW / (data.length * 2)}
                y={PT}
                width={CW / data.length}
                height={CH}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

            {/* Hover vertical line */}
            {hoveredPt && (
              <line
                x1={hoveredPt.x} y1={PT}
                x2={hoveredPt.x} y2={PT + CH}
                stroke={palette.panelBorder}
                strokeWidth={1}
                strokeDasharray="3 3"
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Hover tooltip */}
            {hoveredPt && (
              <g style={{ pointerEvents: "none" }}>
                {(() => {
                  const tw = 52;
                  const th = 30;
                  const tx = Math.min(Math.max(hoveredPt.x - tw / 2, PL), VW - PR - tw);
                  const ty = Math.max(hoveredPt.y - th - 8, PT);
                  const lbl = xLabels[hovered!];
                  const count = hoveredPt.count;
                  return (
                    <>
                      <rect x={tx} y={ty} width={tw} height={th} rx={4} fill="url(#tck-tip-bg)" stroke="var(--accent-border)" strokeWidth={0.7} filter="url(#tck-shadow)" />
                      <text x={tx + tw / 2} y={ty + 11} textAnchor="middle" fontSize="7" fill={palette.textSecondary} style={{ fontFamily: "var(--font-mono)" }}>
                        {lbl?.abbr} {lbl?.num}
                      </text>
                      <text x={tx + tw / 2} y={ty + 23} textAnchor="middle" fontSize="10" fill="var(--accent)" fontWeight="700" style={{ fontFamily: "var(--font-mono)" }}>
                        {count}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* X-axis labels (2 lines: abbr + number) */}
            {pts.map((p, i) => {
              const lbl = xLabels[i];
              const active = p.isToday || hovered === i;
              const color = hovered === i
                ? "var(--cyan)"
                : p.isToday
                  ? palette.textPrimary
                  : palette.textSecondary;
              return (
                <text
                  key={`xl-${i}`}
                  x={p.x}
                  textAnchor="middle"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <tspan
                    x={p.x}
                    y={VH - 17}
                    fontSize="6.5"
                    fill={color}
                    fontWeight={active ? "700" : "400"}
                    style={{ transition: "fill 0.15s" }}
                  >
                    {lbl?.abbr}
                  </tspan>
                  <tspan
                    x={p.x}
                    y={VH - 6}
                    fontSize="8"
                    fill={color}
                    fontWeight="700"
                    style={{ transition: "fill 0.15s" }}
                  >
                    {lbl?.num}
                  </tspan>
                </text>
              );
            })}
          </svg>
        )}
      </Box>
    </Box>
  );
};
