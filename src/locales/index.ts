import { pt } from './pt';
import { en } from './en';

export const translations = {
  pt,
  en
} as const;

export type Locale = keyof typeof translations;

export function getTranslations(locale: Locale = 'pt') {
  return translations[locale] || translations.pt;
}
