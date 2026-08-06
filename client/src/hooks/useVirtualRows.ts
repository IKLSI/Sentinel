import { useVirtualizer } from "@tanstack/react-virtual";

interface Options {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: number;
  overscan?: number;
}

export function useVirtualRows({
  count,
  getScrollElement,
  estimateSize,
  overscan = 10,
}: Options) {
  const virtualizer = useVirtualizer({
    count,
    getScrollElement,
    estimateSize: () => estimateSize,
    overscan,
  });

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = items.length > 0 ? items[0].start : 0;
  const paddingBottom =
    items.length > 0 ? totalSize - items[items.length - 1].end : 0;

  return { virtualizer, items, paddingTop, paddingBottom };
}
