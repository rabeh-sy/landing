import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'الرئيسية',
      href: getPermalink('/'),
    },
    // {
    //   text: 'خدماتنا',
    //   links: [
    //     {
    //       text: 'بناء البرامج على حسب الطلب',
    //       href: getPermalink('/services/custom-software-development'),
    //     },
    //   ]
    // },
    {
      text: 'اتصل بنا',
      href: getPermalink('/contact'),
    },
    {
      text: 'المدونة',
      href: getBlogPermalink(),
    },
  ],
  actions: [{ text: 'يالله نتكلّم', href: 'https://wa.me/+963954183399?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D9%88%D8%AF%20%D9%85%D8%B9%D8%B1%D9%81%D8%A9%20%D8%A7%D9%84%D9%85%D8%B2%D9%8A%D8%AF%20%D8%B9%D9%86%20%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%D9%83%D9%85', target: '_blank', icon: 'tabler:brand-whatsapp' }],
};

export const footerData = {
  links: [
    {
      title: 'روابط ذات صلة',
      links: [
        { text: 'اتصل بنا', href: getPermalink('/contact') },
        { text: 'المدونة', href: getBlogPermalink() },
        { text: 'من نحن', href: getPermalink('/about') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'الشروط', href: getPermalink('/terms') },
    { text: 'سياسة الخصوصية', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: '#' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/company/rabeh-sy' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/rabeh.tech.sy' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/onwidget/astrowind' },
  ],
  footNote: `
    رابح للتقنية شركة سورية متخصصة في التحول الرقمي
  `,
};
