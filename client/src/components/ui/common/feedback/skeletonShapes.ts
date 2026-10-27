const TITLE_WIDTHS = ["58%", "72%", "46%", "64%", "52%", "68%"];
const SUBTITLE_WIDTHS = ["34%", "26%", "40%", "30%", "22%", "36%"];
const CHIP_WIDTHS = [64, 52, 72, 58, 68, 56];

export const titleWidthAt = (position: number) =>
  TITLE_WIDTHS[position % TITLE_WIDTHS.length];

export const subtitleWidthAt = (position: number) =>
  SUBTITLE_WIDTHS[position % SUBTITLE_WIDTHS.length];

export const chipWidthAt = (position: number) =>
  CHIP_WIDTHS[position % CHIP_WIDTHS.length];

export const skeletonRowIds = (rows: number) =>
  Array.from({ length: rows }, (_, position) => ({
    id: `row-${position}`,
    position,
  }));
