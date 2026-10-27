const withSharedCssVars = (themeVars: string) => `
  :root {${themeVars}
    --r-xs: 4px;
    --r-sm: 6px;
    --r: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --font-ui: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  }
  body { scrollbar-width: thin; }
`;

export const darkCssVars = withSharedCssVars(`
    color-scheme: dark;
    --bg: #111111;
    --s1: #181818;
    --s2: #1f1f1f;
    --s3: #272727;
    --border: #2a2a2a;
    --border2: #3a3a3a;
    --text: #f2f2f2;
    --text-secondary: #c4c4c4;
    --muted: #909090;
    --muted2: #a6a6a6;
    --accent: #818cf8;
    --accent2: #a5b4fc;
    --accent-fill: #5457e8;
    --accent-subtle: rgba(129, 140, 248, 0.14);
    --accent-border: rgba(129, 140, 248, 0.36);
    --blue: #818cf8;
    --green: #4ade80;
    --green-subtle: rgba(74, 222, 128, 0.14);
    --green-fill: #15803d;
    --yellow: #fbbf24;
    --yellow-subtle: rgba(251, 191, 36, 0.14);
    --orange: #fb923c;
    --orange-subtle: rgba(251, 146, 60, 0.14);
    --red: #f87171;
    --red-subtle: rgba(248, 113, 113, 0.14);
    --red-fill: #dc2626;
    --cyan: #22d3ee;
    --cyan-subtle: rgba(34, 211, 238, 0.14);
    --purple: #c084fc;
    --purple-subtle: rgba(192, 132, 252, 0.14);
    --sh-1: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 1px 2px rgba(0, 0, 0, 0.35);
    --sh-2: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.45);
    --sh-3: 0 16px 40px rgba(0, 0, 0, 0.55);`);

export const lightCssVars = withSharedCssVars(`
    color-scheme: light;
    --bg: #f0f2f8;
    --s1: #ffffff;
    --s2: #f5f7fc;
    --s3: #eaedfa;
    --border: #dde3f2;
    --border2: #c8d2eb;
    --text: #0e1220;
    --text-secondary: #3a4768;
    --muted: #8898bb;
    --muted2: #5c6f90;
    --accent: #4f46e5;
    --accent2: #3730a3;
    --accent-fill: #4f46e5;
    --accent-subtle: rgba(79, 70, 229, 0.08);
    --accent-border: rgba(79, 70, 229, 0.25);
    --blue: #4f46e5;
    --green: #16a34a;
    --green-subtle: rgba(22, 163, 74, 0.08);
    --green-fill: #15803d;
    --yellow: #d97706;
    --yellow-subtle: rgba(217, 119, 6, 0.08);
    --orange: #ea580c;
    --orange-subtle: rgba(234, 88, 12, 0.08);
    --red: #dc2626;
    --red-subtle: rgba(220, 38, 38, 0.08);
    --red-fill: #dc2626;
    --cyan: #0891b2;
    --cyan-subtle: rgba(8, 145, 178, 0.08);
    --purple: #9333ea;
    --purple-subtle: rgba(147, 51, 234, 0.08);
    --sh-1: 0 1px 2px rgba(16, 24, 40, 0.05);
    --sh-2: 0 6px 16px rgba(16, 24, 40, 0.09);
    --sh-3: 0 20px 48px rgba(16, 24, 40, 0.13);`);
