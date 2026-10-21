import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import type { RuntimeLifecycles } from "@/domains/publicScan/types";
import { RUNTIME_STATUSES } from "@/features/landing/constants";
import {
  buildTimelineScale,
  describeRuntimeStatus,
  formatLongDate,
  timelinePercent,
  timelineSpan,
} from "@/features/landing/helpers";

interface RuntimeTimelineChartProps {
  lifecycles: RuntimeLifecycles;
}

const ENDED_PATTERN =
  "repeating-linear-gradient(-45deg, #fbd0d0 0 5px, #fdeaea 5px 10px)";

const SPAN_BACKGROUNDS: Record<string, string> = {
  [RUNTIME_STATUSES.supported]: "#dedcff",
  [RUNTIME_STATUSES.approaching]: "#fdc893",
  [RUNTIME_STATUSES.ended]: ENDED_PATTERN,
  [RUNTIME_STATUSES.unknown]: "var(--line)",
};

const STATUS_COLORS: Record<string, string> = {
  [RUNTIME_STATUSES.supported]: "var(--ink-2)",
  [RUNTIME_STATUSES.approaching]: "#c2410c",
  [RUNTIME_STATUSES.ended]: "#b91c1c",
  [RUNTIME_STATUSES.unknown]: "var(--ink-3)",
};

const LEGEND = [
  { key: "supported", background: "#dedcff" },
  { key: "approaching", background: "#fdc893" },
  {
    key: "ended",
    background:
      "repeating-linear-gradient(-45deg, #fbd0d0 0 3px, #fdeaea 3px 6px)",
  },
] as const;

const rowGridSx = {
  display: "grid",
  gridTemplateColumns: "132px minmax(0,1fr) 200px",
  gap: "20px",
  alignItems: "center",
  "@media (max-width:760px)": {
    gridTemplateColumns: "84px minmax(0,1fr)",
    gap: "10px",
  },
} as const;

export const RuntimeTimelineChart: React.FC<RuntimeTimelineChartProps> = ({
  lifecycles,
}) => {
  const { t, culture } = useI18n();
  const scale = buildTimelineScale(lifecycles.items, lifecycles.asOf);
  const today = timelinePercent(Date.parse(lifecycles.asOf), scale);
  const windowDays = lifecycles.warningWindowDays;

  return (
    <Box
      sx={{
        background: "#ffffff",
        borderRadius: "24px",
        p: "28px 32px 24px",
        boxShadow:
          "0 0 0 1px var(--line), 0 30px 60px -40px rgba(16,17,36,.25)",
        "@media (max-width:640px)": { p: "20px 16px" },
      }}
    >
      <Box sx={rowGridSx} aria-hidden>
        <span />
        <Box sx={{ position: "relative", height: 56 }}>
          {scale.years.map((year) => (
            <Box
              component="span"
              key={year}
              sx={{
                position: "absolute",
                top: "30px",
                left: `${timelinePercent(Date.UTC(year, 0, 1), scale)}%`,
                transform: "translateX(-50%)",
                fontSize: "12.5px",
                color: "var(--ink-3)",
              }}
            >
              {year}
            </Box>
          ))}
          <Box
            component="span"
            sx={{
              position: "absolute",
              top: 0,
              left: `${today}%`,
              transform: "translateX(-50%)",
              background: "var(--ink)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 500,
              px: "10px",
              py: "4px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
            }}
          >
            {t("landing.timeline.today")}
          </Box>
        </Box>
        <Box
          component="span"
          sx={{
            fontSize: "12.5px",
            color: "var(--ink-3)",
            textAlign: "right",
            alignSelf: "end",
            pb: "6px",
            "@media (max-width:760px)": { display: "none" },
          }}
        >
          {t("landing.timeline.deadline")}
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {lifecycles.items.map((item) => {
          const span = timelineSpan(item, scale);
          const status = describeRuntimeStatus(item, t, culture);
          return (
            <Box
              component="li"
              key={item.name}
              sx={{
                ...rowGridSx,
                py: "12px",
                borderRadius: "10px",
                transition: "background .15s",
                "&:hover": { background: "var(--tint)" },
              }}
            >
              <Box sx={{ fontSize: "15px", fontWeight: 500 }}>{item.name}</Box>
              <Box aria-hidden sx={{ position: "relative", height: 28 }}>
                <Box
                  component="i"
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    bottom: "-12px",
                    left: `${today}%`,
                    width: "1.5px",
                    ml: "-0.75px",
                    background: "var(--ink)",
                    zIndex: 1,
                  }}
                />
                {span && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "6px",
                      height: 16,
                      borderRadius: "999px",
                      left: `${span.left}%`,
                      width: `${span.width}%`,
                      background:
                        SPAN_BACKGROUNDS[item.status] ??
                        SPAN_BACKGROUNDS[RUNTIME_STATUSES.unknown],
                    }}
                  />
                )}
              </Box>
              <Box
                component="span"
                sx={{
                  textAlign: "right",
                  fontSize: "13.5px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  color:
                    STATUS_COLORS[item.status] ??
                    STATUS_COLORS[RUNTIME_STATUSES.unknown],
                  "@media (max-width:760px)": {
                    gridColumn: 2,
                    textAlign: "left",
                  },
                }}
              >
                {status}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px 24px",
          mt: "20px",
          pt: "18px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 20px",
            fontSize: "13px",
            color: "var(--ink-2)",
          }}
        >
          {LEGEND.map(({ key, background }) => (
            <Box
              component="span"
              key={key}
              sx={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Box
                component="i"
                sx={{ width: 18, height: 8, borderRadius: "999px", background }}
              />
              {t(`landing.timeline.legend.${key}`, { days: windowDays })}
            </Box>
          ))}
        </Box>
        <Box
          component="p"
          sx={{ m: 0, fontSize: "13.5px", color: "var(--ink-3)" }}
        >
          {t("landing.timeline.source", {
            date: formatLongDate(lifecycles.asOf, culture),
          })}
        </Box>
      </Box>
    </Box>
  );
};
