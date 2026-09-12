import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const images = path.join(root, 'src/assets/images');
const width = 1200;
const height = 630;

const svg = (content) =>
  Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`);

const writeCard = async (name, background, composites) => {
  await sharp(svg(background))
    .composite(composites)
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(path.join(images, name));
};

const rabehLogo = await sharp(path.join(images, 'logo-dark.png')).resize({ width: 330 }).png().toBuffer();
const studioArt = await sharp(path.join(images, 'hero-image-2.png')).resize({ width: 540 }).png().toBuffer();
const businessMark = await sharp(path.join(images, 'badenjki-business-mark.png')).resize({ width: 168 }).png().toBuffer();

await writeCard(
  'social-rabeh.jpg',
  `<rect width="1200" height="630" fill="#0a0c0a"/>
   <rect width="14" height="630" fill="#9cff7e"/>
   <circle cx="90" cy="550" r="280" fill="#183b2d" opacity=".42"/>
   <path d="M0 470H1200M0 545H1200M280 0V630M560 0V630M840 0V630" stroke="#f3f0e8" stroke-opacity=".06"/>
   <text x="1120" y="250" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="76" font-weight="700" fill="#f3f0e8">برمجيات تُبنى بوضوح.</text>
   <text x="1120" y="322" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="31" fill="#f3f0e8" fill-opacity=".6">منتجات رقمية · أنظمة أعمال · تطبيقات ومواقع</text>
   <text x="1120" y="555" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="23" font-weight="700" fill="#9cff7e">رابح للتقنية — حلب، سوريا</text>`,
  [{ input: rabehLogo, top: 62, left: 790 }],
);

await writeCard(
  'social-home.jpg',
  `<rect width="1200" height="630" fill="#0a0c0a"/>
   <rect width="510" height="630" fill="#0d1812"/>
   <path d="M510 0V630" stroke="#f3f0e8" stroke-opacity=".14"/>
   <circle cx="240" cy="305" r="255" fill="#9cff7e" opacity=".06"/>
   <text x="1120" y="228" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="82" font-weight="700" fill="#f3f0e8">نبني برمجيات</text>
   <text x="1120" y="322" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="82" font-weight="700" fill="#9cff7e">تعمل بوضوح.</text>
   <text x="1120" y="395" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="28" fill="#f3f0e8" fill-opacity=".58">مواقع، تطبيقات، وأنظمة أعمال متقنة من سوريا</text>
   <text x="1120" y="555" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#f3f0e8" fill-opacity=".45">RABEH.SY</text>`,
  [
    { input: studioArt, top: 70, left: 0, blend: 'screen' },
    { input: rabehLogo, top: 62, left: 790 },
  ],
);

await writeCard(
  'social-badenjki-business.jpg',
  `<rect width="1200" height="630" fill="#eef3e9"/>
   <rect width="430" height="630" fill="#173f2b"/>
   <circle cx="215" cy="300" r="260" fill="#9ee6b8" opacity=".12"/>
   <path d="M470 70H1130M470 560H1130" stroke="#173f2b" stroke-opacity=".14"/>
   <text x="1120" y="245" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="82" font-weight="700" fill="#102219">شغلك مرتب.</text>
   <text x="1120" y="342" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="82" font-weight="700" fill="#13743b">أينما كنت.</text>
   <text x="1120" y="420" text-anchor="start" direction="rtl" font-family="Arial, sans-serif" font-size="28" fill="#445a4d">إدارة أعمال على الجوال وسطح المكتب</text>
   <text x="1120" y="520" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#13743b">iOS · Android · Windows · OFFLINE-FIRST</text>
   <text x="470" y="105" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="#173f2b" opacity=".55">BADENJKI BUSINESS</text>`,
  [
    { input: businessMark, top: 145, left: 131 },
    { input: rabehLogo, top: 520, left: 50 },
  ],
);

console.log('Generated site social cards.');
