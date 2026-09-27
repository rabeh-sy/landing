// Keep destinations here so every download control uses the same allowlist.
export const badenjkiDownloads = {
  ios: 'https://apps.apple.com/us/app/badenjki-business/id6785101780',
  android: 'https://play.google.com/store/apps/details?id=com.badenjkibusiness',
  windows: 'https://drive.google.com/file/d/17XxNjqxqV8BMrBNS_XOZ9jPVcvY1Msa-/view?usp=sharing',
} as const;

export type BadenjkiPlatform = keyof typeof badenjkiDownloads;
