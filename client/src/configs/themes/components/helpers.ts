export const containedFill = (token: string) => ({
  background: `var(${token})`,
  "&:hover": {
    background: `color-mix(in srgb, var(${token}) 88%, white)`,
  },
});

export const selectedItem = {
  background: "var(--accent-subtle)",
  color: "var(--accent)",
  "&:hover": { background: "var(--accent-subtle)" },
};

export const alertTone = (
  token: string,
  borderColor = `color-mix(in srgb, var(--${token}) 32%, transparent)`,
) => ({
  background: `var(--${token}-subtle)`,
  borderColor,
  color: `var(--${token})`,
});
