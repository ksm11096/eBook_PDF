import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookText,
  ChevronLeft,
  ChevronRight,
  Download,
  ImageDown,
  ImagePlus,
  Loader2,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AlbumFont,
  AlbumPhoto,
  AlbumTheme,
  PageOrientation,
  PdfSettings,
} from '../types/album';
import { AlbumSheet } from './AlbumSheet';

const THEME_BUTTONS: { id: AlbumTheme; label: string; swatchClass: string }[] = [
  { id: 'white', label: '흰색 (깔끔)', swatchClass: 'bg-white border-zinc-300' },
  { id: 'beige', label: '베이지 (따뜻한 종이)', swatchClass: 'bg-[#F6F0E4] border-[#C9B99D]' },
  { id: 'navy', label: '네이비 (차분함)', swatchClass: 'bg-[#152033] border-[#2C3E5E]' },
];

const FONT_BUTTONS: { id: AlbumFont; label: string; previewClass: string }[] = [
  { id: 'gothic', label: '고딕', previewClass: 'font-sans' },
  { id: 'myeongjo', label: '명조', previewClass: 'font-serif' },
  { id: 'handwriting', label: '손글씨', previewClass: 'font-handwriting text-sm leading-none' },
];

interface AlbumWorkspaceProps {
  photos: AlbumPhoto[];
  currentIndex: number;
  settings: PdfSettings;
  soundEnabled: boolean;
  isExporting: boolean;
  isExportingPng: boolean;
  isExportingEpub: boolean;
  exportProgress: { current: number; total: number } | null;
  epubProgress: { current: number; total: number } | null;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSound: () => void;
  onOpenFlipbook: () => void;
  onUpdatePhoto: (id: string, patch: Partial<Pick<AlbumPhoto, 'title' | 'description'>>) => void;
  onMovePhoto: (index: number, direction: -1 | 1) => void;
  onDeletePhoto: (id: string) => void;
  onUpdateSettings: (patch: Partial<PdfSettings>) => void;
  onTriggerUpload: () => void;
  onFilesDropped: (files: FileList | File[]) => void;
  onResetAlbum: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
  onExportEpub: () => void;
}

export const AlbumWorkspace: React.FC<AlbumWorkspaceProps> = ({
  photos,
  currentIndex,
  settings,
  soundEnabled,
  isExporting,
  isExportingPng,
  isExportingEpub,
  exportProgress,
  epubProgress,
  onSelectIndex,
  onPrev,
  onNext,
  onToggleSound,
  onOpenFlipbook,
  onUpdatePhoto,
  onMovePhoto,
  onDeletePhoto,
  onUpdateSettings,
  onTriggerUpload,
  onFilesDropped,
  onResetAlbum,
  onExportPdf,
  onExportPng,
  onExportEpub,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      setFlipDirection(currentIndex > prevIndexRef.current ? 'next' : 'prev');
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  const currentPhoto = photos[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  // Keyboard navigation when not typing inside inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isEditable) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext]);

  // Keep active thumbnail visible in filmstrip
  useEffect(() => {
    const container = filmstripRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(`[data-thumb-index="${currentIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  if (!currentPhoto) return null;

  const handleFocusField = (field: 'title' | 'description') => {
    if (field === 'title') {
      titleInputRef.current?.focus();
    } else {
      descInputRef.current?.focus();
    }
  };

  const handleOrientationChange = (orientation: PageOrientation) => {
    onUpdateSettings({ orientation });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDraggingStage(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setIsDraggingStage(false);
      onFilesDropped(e.dataTransfer.files);
    }
  };

  const pageNumStr = String(currentIndex + 1).padStart(2, '0');
  const totalNumStr = String(photos.length).padStart(2, '0');

  return (
    <main
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-8 pt-4 relative"
    >
      {/* Drag-and-drop overlay when dropping more photos onto active workspace */}
      {isDraggingStage && (
        <div className="fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-[2px] flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white border-2 border-dashed border-[#C93B2B] rounded-xl px-10 py-8 text-center shadow-xl">
            <p className="text-lg font-semibold text-zinc-900">사진을 놓아 앨범에 추가하세요</p>
            <p className="text-sm text-zinc-500 mt-1">기존 페이지 뒤에 새 사진들이 추가됩니다.</p>
          </div>
        </div>
      )}

      {/* Workspace Sub-Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-zinc-200/80">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={settings.albumTitle}
            onChange={(e) => onUpdateSettings({ albumTitle: e.target.value })}
            placeholder="앨범 제목 입력"
            aria-label="앨범 제목"
            className="font-serif text-lg sm:text-xl font-semibold text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none px-1 py-0.5 min-w-[160px] max-w-[300px] truncate"
          />
          <span aria-hidden="true" className="text-zinc-300">
            ·
          </span>
          <span className="text-xs sm:text-sm text-zinc-500 tabular-nums whitespace-nowrap shrink-0">
            총 {photos.length}쪽 ({pageNumStr} / {totalNumStr})
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Font Selector (3 Buttons: 고딕 / 명조 / 손글씨) */}
          <div
            role="group"
            aria-label="글꼴 선택"
            className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg"
          >
            {FONT_BUTTONS.map((btn) => {
              const isActive = settings.font === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onUpdateSettings({ font: btn.id })}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                    btn.previewClass
                  } ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Album Color Mood Selector (3 Buttons) */}
          <div
            role="group"
            aria-label="앨범 색 분위기"
            className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg"
          >
            {THEME_BUTTONS.map((btn) => {
              const isActive = settings.theme === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: btn.id })}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-3 h-3 rounded-full border shrink-0 ${btn.swatchClass}`}
                  />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Orientation Segmented Control */}
          <div
            role="group"
            aria-label="페이지 용지 방향"
            className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg"
          >
            <button
              type="button"
              onClick={() => handleOrientationChange('portrait')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.orientation === 'portrait'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              세로형 A4
            </button>
            <button
              type="button"
              onClick={() => handleOrientationChange('landscape')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.orientation === 'landscape'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              가로형 A4
            </button>
          </div>

          {confirmReset ? (
            <div className="flex items-center gap-1.5 bg-white border border-zinc-300 rounded-md px-2.5 py-1">
              <span className="text-xs text-zinc-700 whitespace-nowrap">모두 비울까요?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetAlbum();
                }}
                className="text-xs font-semibold text-[#C93B2B] hover:underline px-1.5 py-1 cursor-pointer whitespace-nowrap"
              >
                비우기
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs text-zinc-500 hover:text-zinc-900 px-1.5 py-1 cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>새 앨범</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Center: Single-Page Album Sheet + Prev/Next Controls + Filmstrip */}
        <section
          aria-label="앨범 페이지 뷰어"
          className="lg:col-span-8 flex flex-col items-center gap-5"
        >
          {/* Sheet Stage with Flanked Prev/Next Controls */}
          <div className="w-full flex items-center justify-center gap-3 sm:gap-5">
            {/* Desktop Previous Button */}
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              aria-label="이전 페이지"
              className="hidden sm:inline-flex flex-col items-center justify-center gap-1 w-14 h-20 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 hover:border-zinc-400 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-medium whitespace-nowrap">이전</span>
            </button>

            {/* Single Photo Page Container with 3D Page-Turn Perspective */}
            <div className="flex-1 flex justify-center min-w-0 [perspective:1600px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${currentPhoto.id}-${settings.orientation}`}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 0.25,
                          rotateY: flipDirection === 'next' ? 28 : -28,
                          scale: 0.98,
                        }
                  }
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0.2,
                          rotateY: flipDirection === 'next' ? -30 : 30,
                          scale: 0.98,
                        }
                  }
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex justify-center [transform-style:preserve-3d] [transform-origin:left_center]"
                >
                  <AlbumSheet
                    photo={currentPhoto}
                    pageIndex={currentIndex}
                    totalPages={photos.length}
                    orientation={settings.orientation}
                    theme={settings.theme}
                    font={settings.font}
                    albumTitle={settings.albumTitle}
                    showPageNumbers={settings.showPageNumbers}
                    onFocusField={handleFocusField}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Next Button */}
            <button
              type="button"
              onClick={onNext}
              disabled={isLast}
              aria-label="다음 페이지"
              className="hidden sm:inline-flex flex-col items-center justify-center gap-1 w-14 h-20 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 hover:border-zinc-400 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-medium whitespace-nowrap">다음</span>
            </button>
          </div>

          {/* Explicit Previous / Page Counter / Next Bar + Flipbook + Sound + PNG */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={isFirst}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>이전</span>
              </button>

              <span className="px-3 text-sm font-medium text-zinc-600 tabular-nums whitespace-nowrap">
                {pageNumStr} / {totalNumStr}
              </span>

              <button
                type="button"
                onClick={onNext}
                disabled={isLast}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                <span>다음</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenFlipbook}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-md border border-zinc-900 bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>플립북 보기</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-pressed={soundEnabled}
              title={soundEnabled ? '넘김 효과음 끄기' : '넘김 효과음 켜기'}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#C93B2B]" aria-hidden="true" />
                  <span>효과음 켜짐</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                  <span>효과음 꺼짐</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExportPng}
              disabled={isExportingPng || isExporting || isExportingEpub}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              {isExportingPng ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>PNG 저장 중...</span>
                </>
              ) : (
                <>
                  <ImageDown className="w-4 h-4" aria-hidden="true" />
                  <span>현재 쪽 PNG 저장</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Thumbnail Filmstrip */}
          <div className="w-full pt-2">
            <div
              ref={filmstripRef}
              className="flex items-center gap-2.5 overflow-x-auto pb-2 px-1 scrollbar-thin"
            >
              {photos.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-thumb-index={idx}
                    onClick={() => onSelectIndex(idx)}
                    aria-label={`${idx + 1}쪽: ${item.title || item.fileName}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative shrink-0 w-20 rounded-md overflow-hidden border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                      isActive
                        ? 'border-[#C93B2B] ring-1 ring-[#C93B2B]'
                        : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full bg-zinc-100">
                      <img
                        src={item.src}
                        alt={item.title || item.fileName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      className={`py-1 px-1.5 text-[11px] font-medium tabular-nums text-left truncate ${
                        isActive ? 'bg-[#C93B2B] text-white' : 'bg-white text-zinc-600'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onTriggerUpload}
                className="shrink-0 w-20 h-[76px] rounded-md border border-dashed border-zinc-300 bg-white/70 hover:bg-white hover:border-zinc-500 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                <ImagePlus className="w-4 h-4" aria-hidden="true" />
                <span className="text-[11px] font-medium whitespace-nowrap">사진 추가</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Page Caption & Metadata Inspector */}
        <aside
          aria-label="현재 페이지 편집 패널"
          className="lg:col-span-4 bg-white border border-zinc-200/90 rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">현재 페이지 편집</h2>
              <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[230px]">
                {pageNumStr}쪽 · {currentPhoto.fileName}
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500 tabular-nums">
              {pageNumStr} / {totalNumStr}
            </span>
          </div>

          {/* Photo Title & Description Inputs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="photo-title-input"
                className="block text-xs font-semibold text-zinc-700"
              >
                사진 제목
              </label>
              <input
                ref={titleInputRef}
                id="photo-title-input"
                type="text"
                value={currentPhoto.title}
                onChange={(e) => onUpdatePhoto(currentPhoto.id, { title: e.target.value })}
                placeholder="예: 오후 네 시의 햇살"
                maxLength={80}
                className="w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-[#F9F9F8] border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="photo-desc-input"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  사진 설명
                </label>
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  {currentPhoto.description.length} / 320
                </span>
              </div>
              <textarea
                ref={descInputRef}
                id="photo-desc-input"
                rows={5}
                value={currentPhoto.description}
                onChange={(e) => onUpdatePhoto(currentPhoto.id, { description: e.target.value })}
                placeholder="사진을 찍은 날의 분위기, 장소, 기억하고 싶은 이야기를 자유롭게 적어보세요."
                maxLength={320}
                className="w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-[#F9F9F8] border border-zinc-200 rounded-md placeholder:text-zinc-400 leading-relaxed resize-y focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Page Reorder & Delete Controls */}
          <div className="pt-4 border-t border-zinc-100 space-y-2.5">
            <p className="text-xs font-semibold text-zinc-700">페이지 순서 및 관리</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onMovePhoto(currentIndex, -1)}
                disabled={isFirst}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 min-h-[40px] text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>앞으로</span>
              </button>

              <button
                type="button"
                onClick={() => onMovePhoto(currentIndex, 1)}
                disabled={isLast}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 min-h-[40px] text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>뒤로</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onDeletePhoto(currentPhoto.id)}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 min-h-[40px] text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:text-[#C93B2B] hover:border-[#C93B2B]/40 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>삭제</span>
              </button>
            </div>
          </div>

          {/* PDF Export Options & Quick Action */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-zinc-700">PDF 구성 옵션</p>

              <label className="flex items-center justify-between gap-3 text-sm text-zinc-700 cursor-pointer py-1">
                <span>표지 페이지 포함</span>
                <input
                  type="checkbox"
                  checked={settings.includeCover}
                  onChange={(e) => onUpdateSettings({ includeCover: e.target.checked })}
                  className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-sm text-zinc-700 cursor-pointer py-1">
                <span>쪽 번호 표시</span>
                <input
                  type="checkbox"
                  checked={settings.showPageNumbers}
                  onChange={(e) => onUpdateSettings({ showPageNumbers: e.target.checked })}
                  className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onExportPdf}
                disabled={isExporting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:bg-zinc-700 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span className="tabular-nums">
                      {exportProgress
                        ? `PDF 만드는 중 (${exportProgress.current}/${exportProgress.total})`
                        : 'PDF 만드는 중...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>PDF 앨범으로 저장하기</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onExportPng}
                disabled={isExportingPng || isExporting || isExportingEpub}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-md border border-zinc-300 bg-white text-zinc-800 text-sm font-medium hover:bg-zinc-50 hover:border-zinc-400 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
              >
                {isExportingPng ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>PNG 만드는 중...</span>
                  </>
                ) : (
                  <>
                    <ImageDown className="w-4 h-4" aria-hidden="true" />
                    <span>현재 페이지 PNG로 저장하기</span>
                  </>
                )}
              </button>

              <div className="pt-1 space-y-1.5">
                <button
                  type="button"
                  onClick={onExportEpub}
                  disabled={isExportingEpub || isExporting || isExportingPng}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-md border border-zinc-300 bg-[#F9F9F8] text-zinc-900 text-sm font-medium hover:bg-zinc-100 hover:border-zinc-400 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
                >
                  {isExportingEpub ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span className="tabular-nums">
                        {epubProgress
                          ? `EPUB 만드는 중 (${epubProgress.current}/${epubProgress.total})`
                          : 'EPUB 만드는 중...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <BookText className="w-4 h-4" aria-hidden="true" />
                      <span>EPUB 전자책 저장 (서점 제출용)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-zinc-500 text-center">
                  EPUB 3.0 표준 · 교보문고 등 전자책 서점 호환
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};
