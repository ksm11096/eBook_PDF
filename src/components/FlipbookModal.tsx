import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AlbumPhoto, PdfSettings } from '../types/album';
import { AlbumSheet } from './AlbumSheet';

interface FlipbookModalProps {
  isOpen: boolean;
  photos: AlbumPhoto[];
  currentIndex: number;
  settings: PdfSettings;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
}

export const FlipbookModal: React.FC<FlipbookModalProps> = ({
  isOpen,
  photos,
  currentIndex,
  settings,
  soundEnabled,
  onToggleSound,
  onPrev,
  onNext,
  onSelectIndex,
  onClose,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const currentPhoto = photos[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  const handleStepPrev = () => {
    if (isFirst) return;
    setFlipDirection('prev');
    onPrev();
  };

  const handleStepNext = () => {
    if (isLast) return;
    setFlipDirection('next');
    onNext();
  };

  useEffect(() => {
    if (!isOpen) {
      setIsAutoPlay(false);
      return;
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) {
          setFlipDirection('prev');
          onPrev();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!isLast) {
          setFlipDirection('next');
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isFirst, isLast, onPrev, onNext, onClose]);

  useEffect(() => {
    if (!isOpen || !isAutoPlay) return;
    const timer = window.setInterval(() => {
      if (currentIndex < photos.length - 1) {
        setFlipDirection('next');
        onNext();
      } else {
        setIsAutoPlay(false);
      }
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isOpen, isAutoPlay, currentIndex, photos.length, onNext]);

  if (!isOpen || !currentPhoto) return null;

  const pageNumStr = String(currentIndex + 1).padStart(2, '0');
  const totalNumStr = String(photos.length).padStart(2, '0');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="플립북 보기 모드"
      className="fixed inset-0 z-50 bg-zinc-950/92 backdrop-blur-sm flex flex-col justify-between text-white"
    >
      {/* Flipbook Top Controls */}
      <header className="px-4 sm:px-8 h-16 flex items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-lg font-semibold truncate">
            {settings.albumTitle.trim() || 'MONOGRAPH'}
          </span>
          <span aria-hidden="true" className="text-white/30">
            ·
          </span>
          <span className="text-xs text-zinc-300 tabular-nums whitespace-nowrap">
            {pageNumStr} / {totalNumStr}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAutoPlay((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            {isAutoPlay ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>자동 넘김 중지</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>자동 넘김</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>효과음 켜짐</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                <span>효과음 꺼짐</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="플립북 닫기"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>닫기</span>
          </button>
        </div>
      </header>

      {/* Center 3D Perspective Page-Flip Stage */}
      <div className="flex-1 flex items-center justify-center px-3 sm:px-8 py-4 overflow-hidden">
        <div className="w-full max-w-[1040px] flex items-center justify-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={handleStepPrev}
            disabled={isFirst}
            aria-label="이전 페이지"
            className="inline-flex flex-col items-center justify-center gap-1 w-12 sm:w-14 h-20 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-medium whitespace-nowrap">이전</span>
          </button>

          {/* 3D Perspective Book Page Container */}
          <div className="flex-1 flex justify-center min-w-0 [perspective:1800px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPhoto.id}
                initial={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 0.25,
                        rotateY: flipDirection === 'next' ? 38 : -38,
                        scale: 0.97,
                      }
                }
                animate={{
                  opacity: 1,
                  rotateY: 0,
                  scale: 1,
                }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0.2,
                        rotateY: flipDirection === 'next' ? -42 : 42,
                        scale: 0.97,
                      }
                }
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex justify-center [transform-style:preserve-3d] [transform-origin:left_center]"
              >
                <div className="relative w-full flex justify-center">
                  {/* Subtle Book Spine Binding Highlight on Left Edge */}
                  <AlbumSheet
                    photo={currentPhoto}
                    pageIndex={currentIndex}
                    totalPages={photos.length}
                    orientation={settings.orientation}
                    theme={settings.theme}
                    font={settings.font}
                    albumTitle={settings.albumTitle}
                    showPageNumbers={settings.showPageNumbers}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleStepNext}
            disabled={isLast}
            aria-label="다음 페이지"
            className="inline-flex flex-col items-center justify-center gap-1 w-12 sm:w-14 h-20 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-medium whitespace-nowrap">다음</span>
          </button>
        </div>
      </div>

      {/* Bottom Page Progress Bar */}
      <footer className="px-6 py-4 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto">
        {photos.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFlipDirection(idx >= currentIndex ? 'next' : 'prev');
                onSelectIndex(idx);
              }}
              aria-label={`${idx + 1}쪽 보기`}
              className={`px-2.5 py-1 rounded text-xs tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {String(idx + 1).padStart(2, '0')}
            </button>
          );
        })}
      </footer>
    </div>
  );
};
