import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { AlbumFont, AlbumPhoto, AlbumTheme, PageOrientation } from '../types/album';

interface AlbumSheetProps {
  photo: AlbumPhoto;
  pageIndex: number;
  totalPages: number;
  orientation: PageOrientation;
  theme?: AlbumTheme;
  font?: AlbumFont;
  albumTitle: string;
  showPageNumbers: boolean;
  onFocusField?: (field: 'title' | 'description') => void;
}

const SHEET_FONT_STYLES: Record<
  AlbumFont,
  {
    titleClass: string;
    titlePlaceholderClass: string;
    descClass: string;
    descPlaceholderClass: string;
  }
> = {
  gothic: {
    titleClass: 'font-sans font-bold text-lg sm:text-xl leading-snug',
    titlePlaceholderClass: 'font-sans font-semibold text-base sm:text-lg',
    descClass: 'font-sans text-xs sm:text-[13px] leading-relaxed',
    descPlaceholderClass: 'font-sans text-xs sm:text-[13px]',
  },
  myeongjo: {
    titleClass: 'font-serif font-semibold text-lg sm:text-xl leading-snug',
    titlePlaceholderClass: 'font-serif text-base sm:text-lg',
    descClass: 'font-serif text-xs sm:text-[13px] leading-relaxed',
    descPlaceholderClass: 'font-serif text-xs sm:text-[13px]',
  },
  handwriting: {
    titleClass: 'font-handwriting font-normal text-2xl sm:text-[26px] leading-tight',
    titlePlaceholderClass: 'font-handwriting text-xl sm:text-2xl',
    descClass: 'font-handwriting text-base sm:text-[18px] leading-snug',
    descPlaceholderClass: 'font-handwriting text-base sm:text-[18px]',
  },
};

const SHEET_THEME_STYLES: Record<
  AlbumTheme,
  {
    sheet: string;
    divider: string;
    imageFrame: string;
    fallbackBox: string;
    title: string;
    titlePlaceholder: string;
    description: string;
    descPlaceholder: string;
    footerAlbum: string;
    footerPage: string;
    accentNum: string;
  }
> = {
  white: {
    sheet: 'bg-white border-zinc-200/90',
    divider: 'border-zinc-200/80',
    imageFrame: 'border-zinc-900/10 bg-[#F7F7F5]',
    fallbackBox: 'bg-zinc-100 border-zinc-200 text-zinc-400',
    title: 'text-zinc-950 group-hover:text-zinc-700',
    titlePlaceholder: 'text-zinc-300 group-hover:text-zinc-400',
    description: 'text-zinc-600 group-hover:text-zinc-800',
    descPlaceholder: 'text-zinc-300 group-hover:text-zinc-400',
    footerAlbum: 'text-zinc-400',
    footerPage: 'text-zinc-600',
    accentNum: 'text-[#C93B2B]',
  },
  beige: {
    sheet: 'bg-[#F6F0E4] border-[#E3D9C6]',
    divider: 'border-[#DFD3BE]',
    imageFrame: 'border-[#3A2F24]/12 bg-[#EDE5D5]',
    fallbackBox: 'bg-[#EDE5D5] border-[#DFD3BE] text-[#8C7C6B]',
    title: 'text-[#2D241C] group-hover:text-[#4B3D30]',
    titlePlaceholder: 'text-[#B7AA98] group-hover:text-[#9A8B78]',
    description: 'text-[#5C4E41] group-hover:text-[#2D241C]',
    descPlaceholder: 'text-[#B7AA98] group-hover:text-[#9A8B78]',
    footerAlbum: 'text-[#8C7C6B]',
    footerPage: 'text-[#5C4E41]',
    accentNum: 'text-[#A94432]',
  },
  navy: {
    sheet: 'bg-[#152033] border-[#283852]',
    divider: 'border-[#283852]',
    imageFrame: 'border-white/12 bg-[#0F1827]',
    fallbackBox: 'bg-[#0F1827] border-[#283852] text-[#7E91B0]',
    title: 'text-[#F4F6FA] tracking-[0.01em] group-hover:text-white',
    titlePlaceholder: 'text-[#5B6D8A] group-hover:text-[#7E91B0]',
    description: 'text-[#CBD5E1] tracking-[0.01em] group-hover:text-white',
    descPlaceholder: 'text-[#5B6D8A] group-hover:text-[#7E91B0]',
    footerAlbum: 'text-[#7E91B0]',
    footerPage: 'text-[#CBD5E1]',
    accentNum: 'text-[#E5A96D]',
  },
};

export const AlbumSheet: React.FC<AlbumSheetProps> = ({
  photo,
  pageIndex,
  totalPages,
  orientation,
  theme = 'white',
  font = 'myeongjo',
  albumTitle,
  showPageNumbers,
  onFocusField,
}) => {
  const [imgError, setImgError] = useState(false);

  const styles = SHEET_THEME_STYLES[theme];
  const fontStyles = SHEET_FONT_STYLES[font];
  const pageNum = String(pageIndex + 1).padStart(2, '0');
  const totalNum = String(totalPages).padStart(2, '0');
  const displayTitle = photo.title.trim();
  const displayDesc = photo.description.trim();

  if (orientation === 'portrait') {
    return (
      <article
        aria-label={`${pageIndex + 1}쪽 앨범 페이지`}
        className={`w-full max-w-[460px] aspect-[210/297] border album-sheet-shadow rounded-[3px] p-6 sm:p-8 flex flex-col justify-between select-none transition-colors duration-200 ${styles.sheet}`}
      >
        {/* Photo Mat Area */}
        <div className="w-full h-[61%] flex items-center justify-center overflow-hidden">
          {imgError ? (
            <div
              className={`w-full h-full border flex flex-col items-center justify-center gap-2 p-4 text-center ${styles.fallbackBox}`}
            >
              <ImageOff className="w-7 h-7" aria-hidden="true" />
              <span className="text-xs font-medium">이미지를 불러올 수 없습니다</span>
            </div>
          ) : (
            <img
              key={photo.src}
              src={photo.src}
              alt={displayTitle || photo.fileName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className={`max-w-full max-h-full object-contain border ${styles.imageFrame}`}
            />
          )}
        </div>

        {/* Hairline Divider & Caption Area */}
        <div className="flex-1 pt-5 flex flex-col justify-between min-h-0">
          <div className={`border-t pt-4 space-y-2.5 overflow-hidden ${styles.divider}`}>
            <button
              type="button"
              onClick={() => onFocusField?.('title')}
              className="w-full text-left group cursor-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-sm"
            >
              {displayTitle ? (
                <h2
                  className={`line-clamp-2 transition-colors ${fontStyles.titleClass} ${styles.title}`}
                >
                  {displayTitle}
                </h2>
              ) : (
                <p
                  className={`transition-colors ${fontStyles.titlePlaceholderClass} ${styles.titlePlaceholder}`}
                >
                  제목을 입력하세요
                </p>
              )}
            </button>

            <button
              type="button"
              onClick={() => onFocusField?.('description')}
              className="w-full text-left group cursor-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-sm"
            >
              {displayDesc ? (
                <p
                  className={`whitespace-pre-line line-clamp-4 transition-colors ${fontStyles.descClass} ${styles.description}`}
                >
                  {displayDesc}
                </p>
              ) : (
                <p className={`transition-colors ${fontStyles.descPlaceholderClass} ${styles.descPlaceholder}`}>
                  사진에 대한 설명을 작성해 보세요.
                </p>
              )}
            </button>
          </div>

          {showPageNumbers && (
            <footer className={`pt-3 flex items-center justify-between text-[11px] ${styles.footerAlbum}`}>
              <span className="truncate max-w-[65%]">{albumTitle.trim() || 'MONOGRAPH'}</span>
              <span className={`tabular-nums font-medium ${styles.footerPage}`}>
                {pageNum} / {totalNum}
              </span>
            </footer>
          )}
        </div>
      </article>
    );
  }

  // Landscape A4 Spread (Left Photo, Right Editorial Caption)
  return (
    <article
      aria-label={`${pageIndex + 1}쪽 앨범 페이지`}
      className={`w-full max-w-[680px] aspect-[297/210] border album-sheet-shadow rounded-[3px] p-6 sm:p-8 flex gap-6 sm:gap-8 select-none transition-colors duration-200 ${styles.sheet}`}
    >
      {/* Left 60% Photo Mat Area */}
      <div className="w-[60%] h-full flex items-center justify-center overflow-hidden">
        {imgError ? (
          <div
            className={`w-full h-full border flex flex-col items-center justify-center gap-2 p-4 text-center ${styles.fallbackBox}`}
          >
            <ImageOff className="w-7 h-7" aria-hidden="true" />
            <span className="text-xs font-medium">이미지를 불러올 수 없습니다</span>
          </div>
        ) : (
          <img
            key={photo.src}
            src={photo.src}
            alt={displayTitle || photo.fileName}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`max-w-full max-h-full object-contain border ${styles.imageFrame}`}
          />
        )}
      </div>

      {/* Right 40% Editorial Caption Area */}
      <div className="w-[40%] h-full flex flex-col justify-between min-w-0 py-1">
        <div className="space-y-3 overflow-hidden">
          {showPageNumbers && (
            <p className={`text-xs font-semibold tabular-nums ${styles.accentNum}`}>{pageNum}</p>
          )}

          <button
            type="button"
            onClick={() => onFocusField?.('title')}
            className="w-full text-left group cursor-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-sm"
          >
            {displayTitle ? (
              <h2
                className={`line-clamp-3 transition-colors ${fontStyles.titleClass} ${styles.title}`}
              >
                {displayTitle}
              </h2>
            ) : (
              <p
                className={`transition-colors ${fontStyles.titlePlaceholderClass} ${styles.titlePlaceholder}`}
              >
                제목을 입력하세요
              </p>
            )}
          </button>

          <div className={`w-8 border-t ${styles.divider}`} aria-hidden="true" />

          <button
            type="button"
            onClick={() => onFocusField?.('description')}
            className="w-full text-left group cursor-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-sm"
          >
            {displayDesc ? (
              <p
                className={`whitespace-pre-line line-clamp-8 transition-colors ${fontStyles.descClass} ${styles.description}`}
              >
                {displayDesc}
              </p>
            ) : (
              <p className={`transition-colors ${fontStyles.descPlaceholderClass} ${styles.descPlaceholder}`}>
                사진에 대한 설명을 작성해 보세요.
              </p>
            )}
          </button>
        </div>

        {showPageNumbers && (
          <footer
            className={`pt-3 border-t flex items-center justify-between text-[11px] ${styles.divider} ${styles.footerAlbum}`}
          >
            <span className="truncate max-w-[60%]">{albumTitle.trim() || 'MONOGRAPH'}</span>
            <span className={`tabular-nums font-medium ${styles.footerPage}`}>
              {pageNum} / {totalNum}
            </span>
          </footer>
        )}
      </div>
    </article>
  );
};
