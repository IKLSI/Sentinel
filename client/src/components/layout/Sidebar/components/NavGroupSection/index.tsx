import type React from "react";
import { useT } from "@/contexts/I18nContext";
import { SectionHeader } from "@/components/layout/Sidebar/components/SectionHeader";
import { SectionLink } from "@/components/layout/Sidebar/components/SectionLink";
import type { NavGroup, NavSection } from "@/components/layout/Sidebar/types";

interface Props {
  group: NavGroup;
  sections: NavSection[];
}

export const NavGroupSection: React.FC<Props> = ({ group, sections }) => {
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
      {groupSections.map((section) => (
        <SectionLink key={section.titleKey} section={section} />
      ))}
    </>
  );
};
