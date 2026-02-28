import { Locale } from "@/i18n/locales";
import enUSBase from "@/i18n/translations/en-US.json";
import zhCNBase from "@/i18n/translations/zh-CN.json";
import enUSModelsModule from "@/i18n/translations/modules/en-US/models.json";
import enUSPlaygroundModule from "@/i18n/translations/modules/en-US/playground.json";
import zhCNModelsModule from "@/i18n/translations/modules/zh-CN/models.json";
import zhCNPlaygroundModule from "@/i18n/translations/modules/zh-CN/playground.json";

export type Translations = Record<string, any>;

const baseTranslationsByLocale: Record<Locale, Translations> = {
  "zh-CN": zhCNBase as Translations,
  "en-US": enUSBase as Translations,
};

const moduleTranslationsByLocale: Record<Locale, Translations[]> = {
  "zh-CN": [zhCNModelsModule as Translations, zhCNPlaygroundModule as Translations],
  "en-US": [enUSModelsModule as Translations, enUSPlaygroundModule as Translations],
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const deepMergeTranslations = (
  target: Translations,
  source: Translations,
): Translations => {
  const result: Translations = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMergeTranslations(existing as Translations, value as Translations);
      return;
    }
    result[key] = value;
  });

  return result;
};

export const buildTranslationsForLocale = (locale: Locale): Translations => {
  const base = baseTranslationsByLocale[locale] ?? {};
  const modules = moduleTranslationsByLocale[locale] ?? [];

  return modules.reduce(
    (acc, moduleTranslations) => deepMergeTranslations(acc, moduleTranslations),
    deepMergeTranslations({}, base),
  );
};
