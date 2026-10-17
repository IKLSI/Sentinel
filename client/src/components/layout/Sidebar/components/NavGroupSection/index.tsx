import type React from "react";
import { useT } from "@/contexts/I18nContext";
import { SectionGroup } from "@/components/layout/Sidebar/components/SectionGroup";
import { SectionHeader } from "@/components/layout/Sidebar/components/SectionHeader";
import { SectionLink } from "@/components/layout/Sidebar/components/SectionLink";
import { sectionKey } from "@/components/layout/Sidebar/helpers";
import type { NavGroup, NavSection } from "@/components/layout/Sidebar/types";

interface Props {
  group: NavGroup;
  sections: NavSection[];
  pathname: string;
  openGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
}

export const NavGroupSection: React.FC<Props> = ({
  group,
  sections,
  pathname,
  openGroups,
  onToggleGroup,
}) => {
  const t = useT();
  const groupSections = sections.filter(
    (s) => (s.group ?? "nav") === group.groupKey,
  );
  if (groupSections.length === 0) return null;

  return (
    <>
      <SectionHeader
        label={t(group.headerKey)}
        mt={group.groupKey === "admin" ? "12px" : 0}
      />
      {groupSections.map((section) =>
        section.items.length > 1 ? (
          <SectionGroup
            key={section.titleKey}
            section={section}
            pathname={pathname}
            isGroupOpen={openGroups[sectionKey(section)] ?? false}
            onToggle={() => onToggleGroup(sectionKey(section))}
          />
        ) : (
          <SectionLink key={section.titleKey} section={section} />
        ),
      )}
    </>
  );
};
