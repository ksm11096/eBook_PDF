import { AlbumFont, AlbumTheme } from '../types/album';

export interface AlbumThemePalette {
  id: AlbumTheme;
  label: string;
  swatchHex: string;
  swatchBorderHex: string;
  sheetBg: string;
  sheetBorder: string;
  divider: string;
  matBg: string;
  photoBorder: string;
  titleText: string;
  descText: string;
  placeholderText: string;
  mutedText: string;
  pageNumText: string;
  accentText: string;
  isDark: boolean;
}

export const ALBUM_THEMES: AlbumThemePalette[] = [
  {
    id: 'white',
    label: '흰색 (깔끔)',
    swatchHex: '#FFFFFF',
    swatchBorderHex: '#D4D4D8',
    sheetBg: '#FFFFFF',
    sheetBorder: '#E4E4E7',
    divider: '#E4E4E0',
    matBg: '#F7F7F5',
    photoBorder: 'rgba(24, 24, 27, 0.1)',
    titleText: '#09090B',
    descText: '#52525B',
    placeholderText: '#D4D4D8',
    mutedText: '#A1A1AA',
    pageNumText: '#52525B',
    accentText: '#C93B2B',
    isDark: false,
  },
  {
    id: 'beige',
    label: '베이지 (따뜻한 종이)',
    swatchHex: '#F6F0E4',
    swatchBorderHex: '#D5C7B0',
    sheetBg: '#F6F0E4',
    sheetBorder: '#E3D9C6',
    divider: '#DFD3BE',
    matBg: '#EDE5D5',
    photoBorder: 'rgba(58, 47, 36, 0.12)',
    titleText: '#2D241C',
    descText: '#5C4E41',
    placeholderText: '#B7AA98',
    mutedText: '#8C7C6B',
    pageNumText: '#5C4E41',
    accentText: '#A94432',
    isDark: false,
  },
  {
    id: 'navy',
    label: '네이비 (차분함)',
    swatchHex: '#152033',
    swatchBorderHex: '#2C3E5E',
    sheetBg: '#152033',
    sheetBorder: '#283852',
    divider: '#283852',
    matBg: '#0F1827',
    photoBorder: 'rgba(255, 255, 255, 0.12)',
    titleText: '#F4F6FA',
    descText: '#CBD5E1',
    placeholderText: '#5B6D8A',
    mutedText: '#7E91B0',
    pageNumText: '#CBD5E1',
    accentText: '#E5A96D',
    isDark: true,
  },
];

export function getAlbumThemePalette(theme: AlbumTheme): AlbumThemePalette {
  return ALBUM_THEMES.find((t) => t.id === theme) ?? ALBUM_THEMES[0];
}

export interface AlbumFontConfig {
  id: AlbumFont;
  label: string;
  canvasFontFamily: string;
  titleWeight: number;
  descWeight: number;
  coverTitleSize: number;
  coverSubtitleSize: number;
  pageTitleSize: number;
  pageTitleLineHeight: number;
  pageDescSize: number;
  pageDescLineHeight: number;
  preloadSpecs: string[];
}

export const ALBUM_FONTS: AlbumFontConfig[] = [
  {
    id: 'gothic',
    label: '고딕',
    canvasFontFamily: '"Noto Sans KR", "Plus Jakarta Sans", sans-serif',
    titleWeight: 700,
    descWeight: 400,
    coverTitleSize: 70,
    coverSubtitleSize: 30,
    pageTitleSize: 42,
    pageTitleLineHeight: 62,
    pageDescSize: 28,
    pageDescLineHeight: 46,
    preloadSpecs: [
      '700 42px "Noto Sans KR"',
      '400 28px "Noto Sans KR"',
      '700 70px "Plus Jakarta Sans"',
    ],
  },
  {
    id: 'myeongjo',
    label: '명조',
    canvasFontFamily: '"Noto Serif KR", "Cormorant Garamond", serif',
    titleWeight: 600,
    descWeight: 400,
    coverTitleSize: 72,
    coverSubtitleSize: 30,
    pageTitleSize: 44,
    pageTitleLineHeight: 64,
    pageDescSize: 28,
    pageDescLineHeight: 48,
    preloadSpecs: [
      '600 44px "Noto Serif KR"',
      '400 28px "Noto Serif KR"',
      '600 72px "Cormorant Garamond"',
    ],
  },
  {
    id: 'handwriting',
    label: '손글씨',
    canvasFontFamily: '"Nanum Pen Script", "Noto Sans KR", cursive',
    titleWeight: 400,
    descWeight: 400,
    coverTitleSize: 92,
    coverSubtitleSize: 40,
    pageTitleSize: 60,
    pageTitleLineHeight: 74,
    pageDescSize: 40,
    pageDescLineHeight: 54,
    preloadSpecs: [
      '400 60px "Nanum Pen Script"',
      '400 40px "Nanum Pen Script"',
      '400 92px "Nanum Pen Script"',
    ],
  },
];

export function getAlbumFontConfig(font: AlbumFont): AlbumFontConfig {
  return ALBUM_FONTS.find((f) => f.id === font) ?? ALBUM_FONTS[1];
}
