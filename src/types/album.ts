export type PageOrientation = 'portrait' | 'landscape';
export type ViewMode = 'album' | 'grid';
export type AlbumTheme = 'white' | 'beige' | 'navy';
export type AlbumFont = 'gothic' | 'myeongjo' | 'handwriting';

export interface AlbumPhoto {
  id: string;
  src: string;
  fileName: string;
  title: string;
  description: string;
  isSample?: boolean;
}

export interface PdfSettings {
  albumTitle: string;
  albumSubtitle: string;
  author: string;
  orientation: PageOrientation;
  theme: AlbumTheme;
  font: AlbumFont;
  includeCover: boolean;
  showPageNumbers: boolean;
}
