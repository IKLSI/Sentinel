import type { SortDirection } from "@/components/ui/common/table/VirtualTable/TableCells";

export const compareBy =
  <T, K extends keyof T>(key: K, direction: SortDirection) =>
  (left: T, right: T) => {
    const a = left[key];
    const b = right[key];
    const order =
      typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b));
    return direction === "asc" ? order : -order;
  };

export const nextSort = <K extends string>(
  current: { key: K; direction: SortDirection },
  key: K,
): { key: K; direction: SortDirection } =>
  current.key === key
    ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
    : { key, direction: "asc" };
