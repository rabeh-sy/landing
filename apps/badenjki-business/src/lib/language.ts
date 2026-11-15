export const languages = ['ar', 'en'] as const;
export type Language = (typeof languages)[number];

export const pagePaths = ['/', '/privacy', '/terms', '/account-deletion'] as const;
export type PagePath = (typeof pagePaths)[number];

export const siteCopy = {
  ar: {
    brand: 'بادنجكي الإداري',
    company: 'رابح للتقنية',
    navigation: 'التنقل الرئيسي',
    contact: 'تواصل معنا',
    terms: 'شروط الاستخدام',
    download: 'تحميل التطبيق',
    switchLanguage: 'English',
  },
  en: {
    brand: 'Badenjki Business',
    company: 'Rabeh Technology',
    navigation: 'Main navigation',
    contact: 'Contact us',
    terms: 'Terms of Use',
    download: 'Download the app',
    switchLanguage: 'العربية',
  },
};

export function localizedPath(language: Language, page: PagePath): string {
  return '/' + language + (page === '/' ? '' : page);
}
