import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { useT } from "@/contexts/I18nContext";
import { useRuntimeLifecyclesQuery } from "@/domains/publicScan/queries";
import type { RuntimeLifecycles } from "@/domains/publicScan/types";
import { pluralKey } from "@/features/dashboard/pages/DashboardPage/helpers";
import { LANDING_SECTION_IDS } from "@/features/landing/constants";
import { joinNames } from "@/features/landing/helpers";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { RuntimeTimelineChart } from "@/features/landing/pages/LandingPage/components/RuntimeTimelineChart";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";

const TITLE_ID = "landing-timeline-title";

export const RuntimeTimeline: React.FC = () => {
  const t = useT();
  const { data, isPending, isError } = useRuntimeLifecyclesQuery();

  const titleOf = (lifecycles: RuntimeLifecycles | undefined) => {
    const names = lifecycles?.upcomingNames ?? [];
    const days = lifecycles?.upcomingDays;
    if (names.length === 0 || days == null)
      return t("landing.timeline.title_fallback");
    return t(
      names.length === 1
        ? "landing.timeline.title_single"
        : "landing.timeline.title_multiple",
      {
        names: joinNames(names, t("landing.timeline.conjunction")),
        duration: t(pluralKey("landing.timeline.days", days), { count: days }),
      },
    );
  };

  return (
    <LandingSection
      id={LANDING_SECTION_IDS.timeline}
      labelledBy={TITLE_ID}
      tinted
    >
      <SectionIntro
        titleId={TITLE_ID}
        title={
          isPending ? (
            <Skeleton
              variant="text"
              sx={{ mx: "auto", maxWidth: 640, transform: "none" }}
            />
          ) : (
            titleOf(data)
          )
        }
        description={
          data
            ? t("landing.timeline.subtitle", { days: data.warningWindowDays })
            : t("landing.timeline.subtitle_fallback")
        }
      />
      {isPending && (
        <Skeleton
          variant="rounded"
          height={480}
          sx={{ borderRadius: "24px", background: "var(--page)" }}
        />
      )}
      {isError && (
        <Box
          component="p"
          sx={{ m: 0, textAlign: "center", color: "var(--ink-3)" }}
        >
          {t("landing.timeline.unavailable")}
        </Box>
      )}
      {data && <RuntimeTimelineChart lifecycles={data} />}
    </LandingSection>
  );
};
