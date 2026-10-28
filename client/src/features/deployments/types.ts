import type { ReleaseItemSeverity } from "@/enums";
import type {
  CheckKind,
  DependencySectionKey,
} from "@/features/deployments/constants";

export interface VersionRow {
  id: string;
  name: string;
  change: string;
  baseVersion: string | null;
  headVersion: string | null;
  isMajor: boolean;
  vulnerabilities: string[];
}

export interface DependencySection {
  key: DependencySectionKey;
  rows: VersionRow[];
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

export interface ReleaseCheckGroup {
  kind: CheckKind;
  severity: ReleaseItemSeverity;
  count: number;
  blocks: ReleaseCheckBlock[];
}

export interface NoteGroup {
  category: string;
  titles: string[];
}
