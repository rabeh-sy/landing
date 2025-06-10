import { get } from 'node:http';
import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'الرئيسية',
      href: getPermalink('/'),
    },
    {
      text: 'اتصل بنا',
      href: getPermalink('/contact'),
    },
    {
      text: 'المدونة',
      href: getBlogPermalink(),
    },
  ],
  actions: [{ text: 'ابدأ الآن', href: 'https://github.com/onwidget/astrowind', target: '_blank', icon: 'tabler:brand-whatsapp' }],
};

export const footerData = {
  links: [
    {
      title: 'روابط ذات صلة',
      links: [
        { text: 'اتصل بنا', href: getPermalink('/contact') },
        { text: 'المدونة', href: getBlogPermalink() },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'الشروط', href: getPermalink('/terms') },
    { text: 'سياسة الخصوصية', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: '#' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/onwidget/astrowind' },
  ],
  footNote: `
    رابح شركة تكنولوجية متخصصة في التحول الرقمي
  `,
};
