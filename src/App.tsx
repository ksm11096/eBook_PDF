import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { AlbumPhoto, PdfSettings, ViewMode } from './types/album';
import { SAMPLE_ALBUM_PHOTOS } from './data/sampleAlbum';
import { exportAlbumToPdf, exportCurrentPageToPng } from './utils/pdfExport';
import { exportAlbumToEpub } from './utils/epubExport';
import { playPageTurnSound } from './utils/soundEffects';
import { TopBar } from './components/TopBar';
import { UploadHero } from './components/UploadHero';
import { AlbumWorkspace } from './components/AlbumWorkspace';
import { GridOverview } from './components/GridOverview';
import { SettingsModal } from './components/SettingsModal';
import { FlipbookModal } from './components/FlipbookModal';

function isSupportedImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(file.name);
}

function getDefaultDateSubtitle(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}. ${month}. ${day}`;
}

export default function App() {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('album');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingEpub, setIsExportingEpub] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [epubProgress, setEpubProgress] = useState<{ current: number; total: number } | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [settings, setSettings] = useState<PdfSettings>({
    albumTitle: '나의 사진 앨범',
    albumSubtitle: getDefaultDateSubtitle(),
    author: '포토 앨범 작가',
    orientation: 'portrait',
    theme: 'white',
    font: 'myeongjo',
    includeCover: true,
    showPageNumbers: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const showNotice = useCallback((type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Revoke object URLs on unmount
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const handleFilesSelected = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isSupportedImageFile);
      if (files.length === 0) {
        showNotice('error', '이미지 파일(JPG, PNG, WEBP 등)만 올릴 수 있습니다.');
        return;
      }

      const newPhotos: AlbumPhoto[] = files.map((file, idx) => {
        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(objectUrl);
        return {
          id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          src: objectUrl,
          fileName: file.name,
          title: '',
          description: '',
          isSample: false,
        };
      });

      setPhotos((prev) => {
        const next = [...prev, ...newPhotos];
        if (prev.length === 0) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex(prev.length);
        }
        return next;
      });
      setViewMode('album');
      showNotice('success', `${newPhotos.length}장의 사진이 앨범에 추가되었습니다.`);
    },
    [showNotice]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleLoadSample = useCallback(() => {
    setPhotos(SAMPLE_ALBUM_PHOTOS.map((p) => ({ ...p })));
    setCurrentIndex(0);
    setViewMode('album');
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev <= 0) return prev;
      if (soundEnabled) playPageTurnSound('prev');
      return prev - 1;
    });
  }, [soundEnabled]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= photos.length - 1) return prev;
      if (soundEnabled) playPageTurnSound('next');
      return prev + 1;
    });
  }, [photos.length, soundEnabled]);

  const handleSelectPageIndex = useCallback(
    (targetIdx: number) => {
      setCurrentIndex((prev) => {
        if (targetIdx === prev) return prev;
        if (soundEnabled) playPageTurnSound(targetIdx > prev ? 'next' : 'prev');
        return targetIdx;
      });
    },
    [soundEnabled]
  );

  const handleUpdatePhoto = useCallback(
    (id: string, patch: Partial<Pick<AlbumPhoto, 'title' | 'description'>>) => {
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    []
  );

  const handleMovePhoto = useCallback(
    (index: number, direction: -1 | 1) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= photos.length) return;

      setPhotos((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        return copy;
      });

      if (currentIndex === index) {
        setCurrentIndex(targetIndex);
      } else if (currentIndex === targetIndex) {
        setCurrentIndex(index);
      }
    },
    [photos.length, currentIndex]
  );

  const handleDeletePhoto = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target && !target.isSample && objectUrlsRef.current.has(target.src)) {
          URL.revokeObjectURL(target.src);
          objectUrlsRef.current.delete(target.src);
        }
        const next = prev.filter((p) => p.id !== id);
        setCurrentIndex((curr) => {
          if (next.length === 0) return 0;
          return Math.min(curr, next.length - 1);
        });
        return next;
      });
    },
    []
  );

  const handleResetAlbum = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    setPhotos([]);
    setCurrentIndex(0);
    setViewMode('album');
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<PdfSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (photos.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: photos.length + (settings.includeCover ? 1 : 0) });

    try {
      await exportAlbumToPdf(photos, settings, (current, total) => {
        setExportProgress({ current, total });
      });
      showNotice('success', 'PDF 앨범 파일이 저장되었습니다.');
    } catch (err) {
      console.error('PDF export failed:', err);
      showNotice('error', 'PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [photos, settings, isExporting, showNotice]);

  const handleExportPng = useCallback(async () => {
    const currentPhoto = photos[currentIndex];
    if (!currentPhoto || isExportingPng || isExporting) return;
    setIsExportingPng(true);

    try {
      await exportCurrentPageToPng(currentPhoto, currentIndex, photos.length, settings);
      showNotice('success', `${currentIndex + 1}쪽이 PNG 이미지로 저장되었습니다.`);
    } catch (err) {
      console.error('PNG export failed:', err);
      showNotice('error', 'PNG 저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExportingPng(false);
    }
  }, [photos, currentIndex, settings, isExportingPng, isExporting, showNotice]);

  const handleExportEpub = useCallback(async () => {
    if (photos.length === 0 || isExportingEpub || isExporting) return;
    setIsExportingEpub(true);
    setEpubProgress({ current: 0, total: photos.length + (settings.includeCover ? 1 : 0) });

    try {
      await exportAlbumToEpub(photos, settings, (current, total) => {
        setEpubProgress({ current, total });
      });
      showNotice('success', '서점 제출용 EPUB 전자책 파일이 저장되었습니다.');
    } catch (err) {
      console.error('EPUB export failed:', err);
      showNotice('error', 'EPUB 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExportingEpub(false);
      setEpubProgress(null);
    }
  }, [photos, settings, isExportingEpub, isExporting, showNotice]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F3] text-zinc-900">
      {/* Hidden Multi-File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <TopBar
        hasPhotos={photos.length > 0}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onTriggerUpload={triggerUpload}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />

      {/* Mobile View Mode Switcher when photos exist */}
      {photos.length > 0 && (
        <div className="sm:hidden bg-white border-b border-zinc-200/80 px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setViewMode('album')}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
                viewMode === 'album' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
              }`}
            >
              한 장씩 보기
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
                viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
              }`}
            >
              전체 목록
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerUpload}
              className="text-xs font-medium text-zinc-700 px-2.5 py-1.5 border border-zinc-200 rounded-md whitespace-nowrap"
            >
              사진 추가
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs font-medium text-zinc-700 px-2.5 py-1.5 border border-zinc-200 rounded-md whitespace-nowrap"
            >
              설정
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {photos.length === 0 ? (
          <UploadHero
            onFilesSelected={handleFilesSelected}
            onTriggerUpload={triggerUpload}
            onLoadSample={handleLoadSample}
          />
        ) : viewMode === 'album' ? (
          <AlbumWorkspace
            photos={photos}
            currentIndex={currentIndex}
            settings={settings}
            soundEnabled={soundEnabled}
            isExporting={isExporting}
            isExportingPng={isExportingPng}
            isExportingEpub={isExportingEpub}
            exportProgress={exportProgress}
            epubProgress={epubProgress}
            onSelectIndex={handleSelectPageIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onOpenFlipbook={() => setIsFlipbookOpen(true)}
            onUpdatePhoto={handleUpdatePhoto}
            onMovePhoto={handleMovePhoto}
            onDeletePhoto={handleDeletePhoto}
            onUpdateSettings={handleUpdateSettings}
            onTriggerUpload={triggerUpload}
            onFilesDropped={handleFilesSelected}
            onResetAlbum={handleResetAlbum}
            onExportPdf={handleExportPdf}
            onExportPng={handleExportPng}
            onExportEpub={handleExportEpub}
          />
        ) : (
          <GridOverview
            photos={photos}
            currentIndex={currentIndex}
            onSelectPage={(idx) => {
              setCurrentIndex(idx);
              setViewMode('album');
            }}
            onMovePhoto={handleMovePhoto}
            onDeletePhoto={handleDeletePhoto}
            onTriggerUpload={triggerUpload}
          />
        )}
      </div>

      {/* Transient Feedback Notice */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${
            notice.type === 'error'
              ? 'bg-white border-[#C93B2B] text-[#C93B2B]'
              : 'bg-zinc-900 border-zinc-800 text-white'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      <FlipbookModal
        isOpen={isFlipbookOpen}
        photos={photos}
        currentIndex={currentIndex}
        settings={settings}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelectIndex={handleSelectPageIndex}
        onClose={() => setIsFlipbookOpen(false)}
      />
    </div>
  );
}
