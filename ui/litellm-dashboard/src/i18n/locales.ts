/**
 * 语言配置文件
 * Language Configuration File
 */

export type Locale = 'zh-CN' | 'en-US';

export const locales: Record<Locale, { name: string; flag: string }> = {
  'zh-CN': {
    name: '简体中文',
    flag: '🇨🇳',
  },
  'en-US': {
    name: 'English',
    flag: '🇺🇸',
  },
};

export const defaultLocale: Locale = 'zh-CN';
