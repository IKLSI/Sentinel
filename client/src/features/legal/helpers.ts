import { LEGAL_SCROLL_OFFSET } from "@/features/legal/constants";

export const numbered = (index: number) => String(index + 1).padStart(2, "0");

export const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  const top =
    element.getBoundingClientRect().top + window.scrollY - LEGAL_SCROLL_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
};
