// Keep destinations here so every download control uses the same allowlist.
export const badenjkiDownloads = {
  ios: 'https://apps.apple.com/us/app/badenjki-business/id6785101780',
  android: 'https://play.google.com/store/apps/details?id=com.badenjkibusiness',
  windows: 'https://drive.google.com/uc?export=download&id=1EpreyZlvTL4cw__Uo1srZZuduNpr2BL1',
} as const;

export type BadenjkiPlatform = keyof typeof badenjkiDownloads;
