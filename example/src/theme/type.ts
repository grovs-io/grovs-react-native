import type { TextStyle } from 'react-native';

export const fonts = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  mono: 'GeistMono-Regular',
  monoMedium: 'GeistMono-Medium',
};

export type AppFonts = typeof fonts;

export const type = {
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  heading: { fontFamily: fonts.semibold, fontSize: 14 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 12 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17 },
  monoSmall: { fontFamily: fonts.monoMedium, fontSize: 10 },
  amount: { fontFamily: fonts.semibold, fontSize: 22 },
} satisfies Record<string, TextStyle>;
