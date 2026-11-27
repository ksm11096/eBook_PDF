import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ImagePlus, Trash2 } from 'lucide-react';
import { AlbumPhoto } from '../types/album';

interface GridOverviewProps {
  photos: AlbumPhoto[];
  currentIndex: number;
  onSelectPage: (index: number) => void;
  onMovePhoto: (index: number, direction: -1 | 1) => void;
  onDeletePhoto: (id: string) => void;
  onTriggerUpload: () => void;
}

export const GridOverview: React.FC<GridOverviewProps> = ({
  photos,
  currentIndex,
  onSelectPage,
  onMovePhoto,
  onDeletePhoto,
  onTriggerUpload,
}) => {
  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 mb-8 border-b border-zinc-200/80">
        <div>
          <p className="text-xs font-medium text-zinc-500">전체 페이지 구성</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-zinc-950 mt-1">
            총 {photos.length}장의 사진 목록
          </h1>
        </div>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ImagePlus className="w-4 h-4" aria-hidden="true" />
          <span>사진 더 올리기</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map((photo, idx) => {
          const isCurrent = idx === currentIndex;
          const pageNum = String(idx + 1).padStart(2, '0');
          return (
            <article
              key={photo.id}
              className={`bg-white rounded-lg border transition-colors flex flex-col overflow-hidden ${
                isCurrent ? 'border-[#C93B2B]' : 'border-zinc-200/90 hover:border-zinc-400'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectPage(idx)}
                className="group relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900"
              >
                <img
                  src={photo.src}
                  alt={photo.title || photo.fileName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                />
              </button>

              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="tabular-nums font-semibold text-zinc-900">{pageNum}쪽</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{photo.fileName}</span>
                  </div>

                  <h2 className="font-serif text-base font-semibold text-zinc-950 truncate">
                    {photo.title.trim() || '제목 없음'}
                  </h2>

                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 min-h-[2.25rem]">
                    {photo.description.trim() || '설명이 아직 작성되지 않았습니다.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPage(idx)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 hover:text-[#C93B2B] py-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>페이지 열기</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMovePhoto(idx, -1)}
                      disabled={idx === 0}
                      aria-label={`${idx + 1}쪽 앞으로 이동`}
                      className="p-1.5 rounded border border-zinc-200 text-zinc-600 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMovePhoto(idx, 1)}
                      disabled={idx === photos.length - 1}
                      aria-label={`${idx + 1}쪽 뒤로 이동`}
                      className="p-1.5 rounded border border-zinc-200 text-zinc-600 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(photo.id)}
                      aria-label={`${idx + 1}쪽 삭제`}
                      className="p-1.5 rounded border border-zinc-200 text-zinc-500 hover:text-[#C93B2B] hover:border-[#C93B2B]/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {/* Add More Card */}
        <button
          type="button"
          onClick={onTriggerUpload}
          className="min-h-[260px] rounded-lg border border-dashed border-zinc-300 bg-white/60 hover:bg-white hover:border-zinc-500 flex flex-col items-center justify-center gap-3 text-zinc-600 hover:text-zinc-950 transition-colors p-6 cursor-pointer"
        >
          <ImagePlus className="w-6 h-6" aria-hidden="true" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">새 사진 추가하기</p>
            <p className="text-xs text-zinc-500">여러 장을 한 번에 올릴 수 있습니다</p>
          </div>
        </button>
      </div>
    </main>
  );
};
