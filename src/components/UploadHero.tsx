import React, { useState } from 'react';
import { ArrowRight, ImagePlus, Upload } from 'lucide-react';
import { SAMPLE_ALBUM_PHOTOS } from '../data/sampleAlbum';

interface UploadHeroProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onTriggerUpload: () => void;
  onLoadSample: () => void;
}

export const UploadHero: React.FC<UploadHeroProps> = ({
  onFilesSelected,
  onTriggerUpload,
  onLoadSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const leadSample = SAMPLE_ALBUM_PHOTOS[0];
  const secondarySamples = SAMPLE_ALBUM_PHOTOS.slice(1);

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
        {/* Left Column: Editorial Headline + Multi-photo Upload */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <p className="text-xs font-medium tracking-wider text-zinc-500">
              아카이브 포토북 스튜디오
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-950 leading-[1.18] [text-wrap:balance]">
              한 장의 사진,
              <br />
              한 쪽의 기록으로 남기다
            </h1>
            <p className="text-base text-zinc-600 leading-relaxed max-w-lg">
              여러 장의 사진을 올리면 한 쪽에 한 장씩 차분하게 담긴 사진첩이 만들어집니다. 사진마다
              제목과 설명을 적고, 한 장씩 넘겨본 뒤 고화질 PDF 앨범으로 소장하세요.
            </p>
          </div>

          {/* Drag & Drop Upload Frame */}
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={onTriggerUpload}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTriggerUpload();
                }
              }}
              aria-label="사진 여러 장 업로드 영역"
              className={`group rounded-xl border border-dashed p-8 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                isDragging
                  ? 'border-[#C93B2B] bg-[#C93B2B]/[0.03]'
                  : 'border-zinc-300 bg-white hover:border-zinc-500'
              }`}
            >
              <div className="flex flex-col items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" aria-hidden="true" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-900">
                    {isDragging ? '여기에 사진을 놓아주세요' : '사진 여러 장 올리기'}
                  </p>
                  <p className="text-sm text-zinc-500">
                    JPG, PNG, WEBP 파일 여러 장을 끌어다 놓거나 클릭해 선택하세요.
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md bg-zinc-900 text-white group-hover:bg-zinc-800 transition-colors whitespace-nowrap">
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  사진 파일 선택하기
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-[#C93B2B] transition-colors cursor-pointer py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-sm"
              >
                <span>샘플 사진 3장으로 먼저 체험해 보기</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Curated Photobook Spread Preview */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-zinc-200/80 rounded-xl p-6 sm:p-8 album-sheet-shadow">
          <div className="flex items-center justify-between text-xs text-zinc-500 pb-4 border-b border-zinc-100">
            <span>미리보기 예시 · 한 쪽에 한 장</span>
            <span className="tabular-nums font-medium text-zinc-700">01 / 03</span>
          </div>

          <div className="my-5 flex-1 flex flex-col justify-center">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-zinc-100 border border-zinc-200/70">
              <img
                src={leadSample.src}
                alt={leadSample.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 space-y-1.5">
              <h2 className="font-serif text-lg font-semibold text-zinc-900">
                {leadSample.title}
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">
                {leadSample.description}
              </p>
            </div>
          </div>

          {/* Secondary Spread Thumbnails */}
          <div className="pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4">
            {secondarySamples.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-12 shrink-0 overflow-hidden rounded-sm bg-zinc-100 border border-zinc-200/70">
                  <img
                    src={item.src}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-400 tabular-nums">
                    {String(idx + 2).padStart(2, '0')}쪽
                  </p>
                  <p className="text-xs font-medium text-zinc-800 truncate">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Concise 3-step guide strip below split */}
      <div className="mt-12 pt-8 border-t border-zinc-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 tabular-nums">01.</p>
          <p className="font-semibold text-zinc-900">사진 여러 장 업로드</p>
          <p className="text-zinc-500 leading-relaxed">
            원하는 사진들을 한 번에 올리면 자동으로 한 쪽에 한 장씩 페이지가 구성됩니다.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 tabular-nums">02.</p>
          <p className="font-semibold text-zinc-900">제목과 설명 기록</p>
          <p className="text-zinc-500 leading-relaxed">
            이전·다음 버튼으로 페이지를 넘기며 각 사진에 어울리는 제목과 이야기를 적으세요.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 tabular-nums">03.</p>
          <p className="font-semibold text-zinc-900">PDF 앨범으로 저장</p>
          <p className="text-zinc-500 leading-relaxed">
            세로형 또는 가로형 A4 판형으로 편집한 뒤 버튼 한 번으로 PDF 파일을 내려받습니다.
          </p>
        </div>
      </div>
    </main>
  );
};
