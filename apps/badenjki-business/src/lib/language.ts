export const languages = ['ar', 'en'] as const;
export type Language = (typeof languages)[number];

export const pagePaths = ['/', '/privacy', '/account-deletion'] as const;
export type PagePath = (typeof pagePaths)[number];

export const siteCopy = {
  ar: {
    brand: 'بادنجكي الإداري',
    company: 'رابح للتقنية',
    navigation: 'التنقل الرئيسي',
    contact: 'تواصل معنا',
    download: 'تحميل التطبيق',
    switchLanguage: 'English',
  },
  en: {
    brand: 'Badenjki Business',
    company: 'Rabeh Technology',
    navigation: 'Main navigation',
    contact: 'Contact us',
    download: 'Download the app',
    switchLanguage: 'العربية',
  },
};

export function localizedPath(language: Language, page: PagePath): string {
  return '/' + language + (page === '/' ? '' : page);
}
