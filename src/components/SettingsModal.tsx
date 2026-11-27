import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AlbumFont, AlbumTheme, PdfSettings } from '../types/album';

const MODAL_THEMES: { id: AlbumTheme; label: string; swatchClass: string }[] = [
  { id: 'white', label: '흰색 (깔끔)', swatchClass: 'bg-white border-zinc-300' },
  { id: 'beige', label: '베이지 (따뜻한 종이)', swatchClass: 'bg-[#F6F0E4] border-[#C9B99D]' },
  { id: 'navy', label: '네이비 (차분함)', swatchClass: 'bg-[#152033] border-[#2C3E5E]' },
];

const MODAL_FONTS: { id: AlbumFont; label: string; previewClass: string }[] = [
  { id: 'gothic', label: '고딕', previewClass: 'font-sans' },
  { id: 'myeongjo', label: '명조', previewClass: 'font-serif' },
  { id: 'handwriting', label: '손글씨', previewClass: 'font-handwriting text-sm leading-none' },
];

interface SettingsModalProps {
  isOpen: boolean;
  settings: PdfSettings;
  onUpdateSettings: (patch: Partial<PdfSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-settings-title"
      className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-zinc-200 rounded-xl p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <h2 id="album-settings-title" className="text-lg font-semibold text-zinc-950">
            앨범 및 PDF 설정
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="설정 닫기"
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="settings-album-title" className="block text-xs font-semibold text-zinc-700">
              앨범 제목 (PDF 표지 및 파일명)
            </label>
            <input
              id="settings-album-title"
              type="text"
              value={settings.albumTitle}
              onChange={(e) => onUpdateSettings({ albumTitle: e.target.value })}
              placeholder="예: 2026 가을 제주 여행기"
              className="w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-[#F9F9F8] border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-album-subtitle" className="block text-xs font-semibold text-zinc-700">
              표지 부제 또는 날짜
            </label>
            <input
              id="settings-album-subtitle"
              type="text"
              value={settings.albumSubtitle}
              onChange={(e) => onUpdateSettings({ albumSubtitle: e.target.value })}
              placeholder="예: 2026년 11월의 기록"
              className="w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-[#F9F9F8] border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-album-author" className="block text-xs font-semibold text-zinc-700">
              저자 / 제작자 (EPUB 전자책 정보)
            </label>
            <input
              id="settings-album-author"
              type="text"
              value={settings.author}
              onChange={(e) => onUpdateSettings({ author: e.target.value })}
              placeholder="예: 홍길동"
              className="w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-[#F9F9F8] border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-zinc-700">A4 판형 방향</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ orientation: 'portrait' })}
                className={`py-2.5 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  settings.orientation === 'portrait'
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                }`}
              >
                세로형 A4 (사진 상단)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ orientation: 'landscape' })}
                className={`py-2.5 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  settings.orientation === 'landscape'
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                }`}
              >
                가로형 A4 (좌우 분할)
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-zinc-700">앨범 색 분위기</p>
            <div className="grid grid-cols-3 gap-2">
              {MODAL_THEMES.map((btn) => {
                const isActive = settings.theme === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => onUpdateSettings({ theme: btn.id })}
                    aria-pressed={isActive}
                    className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-3 h-3 rounded-full border shrink-0 ${btn.swatchClass}`}
                    />
                    <span className="truncate">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-zinc-700">제목 및 설명 글꼴</p>
            <div className="grid grid-cols-3 gap-2">
              {MODAL_FONTS.map((btn) => {
                const isActive = settings.font === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => onUpdateSettings({ font: btn.id })}
                    aria-pressed={isActive}
                    className={`py-2.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      btn.previewClass
                    } ${
                      isActive
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 space-y-2.5 border-t border-zinc-100">
            <label className="flex items-center justify-between gap-3 text-sm text-zinc-700 cursor-pointer py-1">
              <span>PDF 첫 장에 표지 페이지 포함</span>
              <input
                type="checkbox"
                checked={settings.includeCover}
                onChange={(e) => onUpdateSettings({ includeCover: e.target.checked })}
                className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm text-zinc-700 cursor-pointer py-1">
              <span>각 페이지 하단 쪽 번호 표시</span>
              <input
                type="checkbox"
                checked={settings.showPageNumbers}
                onChange={(e) => onUpdateSettings({ showPageNumbers: e.target.checked })}
                className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 min-h-[40px] rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
