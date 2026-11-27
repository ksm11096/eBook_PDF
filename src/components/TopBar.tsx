import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ViewMode } from '../types/album';

interface TopBarProps {
  hasPhotos: boolean;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onTriggerUpload: () => void;
  onOpenSettings: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  exportProgress: { current: number; total: number } | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  hasPhotos,
  viewMode,
  onChangeViewMode,
  onTriggerUpload,
  onOpenSettings,
  onExportPdf,
  isExporting,
  exportProgress,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F5F5F3]/95 backdrop-blur-sm border-b border-zinc-200/80">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onChangeViewMode('album')}
          className="font-serif text-xl font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-sm"
        >
          MONOGRAPH
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden sm:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <button
            type="button"
            onClick={onTriggerUpload}
            className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            사진 추가
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('album')}
            disabled={!hasPhotos}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
              !hasPhotos
                ? 'text-zinc-300 border-transparent cursor-not-allowed'
                : viewMode === 'album'
                ? 'text-zinc-950 border-[#C93B2B] cursor-pointer'
                : 'text-zinc-600 border-transparent hover:text-zinc-950 hover:border-zinc-400 cursor-pointer'
            }`}
          >
            한 장씩 보기
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('grid')}
            disabled={!hasPhotos}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
              !hasPhotos
                ? 'text-zinc-300 border-transparent cursor-not-allowed'
                : viewMode === 'grid'
                ? 'text-zinc-950 border-[#C93B2B] cursor-pointer'
                : 'text-zinc-600 border-transparent hover:text-zinc-950 hover:border-zinc-400 cursor-pointer'
            }`}
          >
            전체 목록
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            앨범 설정
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={!hasPhotos || isExporting}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 ${
              !hasPhotos
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : isExporting
                ? 'bg-zinc-800 text-white cursor-wait'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span className="tabular-nums">
                  {exportProgress
                    ? `PDF 생성 중 (${exportProgress.current}/${exportProgress.total})`
                    : 'PDF 생성 중'}
                </span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>PDF 저장</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
