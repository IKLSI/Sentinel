import { fr, enUS, type Locale } from "date-fns/locale";
import { Language } from "@/enums";

const DATE_FNS_LOCALES: Record<string, Locale> = {
  [Language.Fr]: fr,
  [Language.En]: enUS,
};

export const getDateFnsLocale = (culture: Language): Locale =>
  DATE_FNS_LOCALES[culture] ?? fr;
