import type { ReleaseItemSeverity } from "@/enums";

export interface VersionRow {
  id: string;
  name: string;
  change: string;
  baseVersion: string | null;
  headVersion: string | null;
  isMajor: boolean;
  vulnerabilities: string[];
}

export interface DependencyGroup {
  key: string;
  ecosystem: string | null;
  rows: VersionRow[];
  vulnerabilityCount: number;
}

interface ReleaseCheckEntry {
  id: string;
  text: string;
  note: string | null;
}

export interface ReleaseCheckBlock {
  id: string;
  heading: string;
  hint: string;
  entries: ReleaseCheckEntry[];
}

export interface ReleaseCheckStep {
  id: string;
  index: number;
  severity: ReleaseItemSeverity;
  summary: string;
  blocks: ReleaseCheckBlock[];
}

export interface NoteGroup {
  category: string;
  titles: string[];
}
