import { jsPDF } from 'jspdf';
import { AlbumFont, AlbumPhoto, PdfSettings } from '../types/album';
import {
  AlbumThemePalette,
  getAlbumFontConfig,
  getAlbumThemePalette,
} from '../constants/albumThemes';

async function ensureAlbumFontsLoaded(font: AlbumFont, sampleText = ''): Promise<void> {
  const fontConfig = getAlbumFontConfig(font);
  const textToLoad = `${sampleText} 가나다라마바사아자차카타파하 나의 사진 앨범 제목 설명`.trim();
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.allSettled(
      fontConfig.preloadSpecs.map((spec) => document.fonts.load(spec, textToLoad))
    );
    await document.fonts.ready;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Wraps Korean/English/mixed text cleanly onto lines that fit within maxWidth.
 * Respects explicit newline characters and handles continuous Korean phrases gracefully.
 */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines?: number
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    let currentLine = '';
    const chars = Array.from(paragraph);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        // Try to break at last space if the word isn't huge
        const lastSpaceIdx = currentLine.lastIndexOf(' ');
        if (lastSpaceIdx > currentLine.length * 0.45 && char !== ' ') {
          lines.push(currentLine.slice(0, lastSpaceIdx).trimEnd());
          currentLine = currentLine.slice(lastSpaceIdx + 1) + char;
        } else {
          lines.push(currentLine.trimEnd());
          currentLine = char === ' ' ? '' : char;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.trimEnd());
    }
  }

  if (maxLines && lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    const last = trimmed[maxLines - 1];
    trimmed[maxLines - 1] = last.length > 2 ? `${last.slice(0, -1)}…` : last;
    return trimmed;
  }

  return lines;
}

function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  palette: AlbumThemePalette
) {
  const imgRatio = img.naturalWidth / img.naturalHeight || 1;
  const boxRatio = boxW / boxH;

  let drawW = boxW;
  let drawH = boxH;

  if (imgRatio > boxRatio) {
    drawW = boxW;
    drawH = boxW / imgRatio;
  } else {
    drawH = boxH;
    drawW = boxH * imgRatio;
  }

  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;

  ctx.save();
  ctx.fillStyle = palette.matBg;
  ctx.fillRect(drawX, drawY, drawW, drawH);
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.strokeStyle = palette.photoBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(drawX, drawY, drawW, drawH);
  ctx.restore();
}

function renderCoverPage(
  canvas: HTMLCanvasElement,
  settings: PdfSettings,
  totalPhotos: number,
  firstImg: HTMLImageElement | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const palette = getAlbumThemePalette(settings.theme);
  const fontConfig = getAlbumFontConfig(settings.font);
  const W = canvas.width;
  const H = canvas.height;
  const isPortrait = H > W;

  ctx.fillStyle = palette.sheetBg;
  ctx.fillRect(0, 0, W, H);

  const inset = isPortrait ? 90 : 85;
  ctx.strokeStyle = palette.sheetBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

  const centerX = W / 2;
  const titleText = settings.albumTitle.trim() || '나의 사진 앨범';
  const subtitleText = settings.albumSubtitle.trim();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (isPortrait) {
    ctx.fillStyle = palette.mutedText;
    ctx.font = '500 24px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
    ctx.fillText('PHOTOGRAPH MONOGRAPH', centerX, 190);

    ctx.fillStyle = palette.titleText;
    ctx.font = `${fontConfig.titleWeight} ${fontConfig.coverTitleSize}px ${fontConfig.canvasFontFamily}`;
    const titleLines = wrapTextLines(ctx, titleText, W - 360, 2);
    let y = 275;
    for (const line of titleLines) {
      ctx.fillText(line, centerX, y);
      y += fontConfig.coverTitleSize + 24;
    }

    if (subtitleText) {
      ctx.fillStyle = palette.descText;
      ctx.font = `${fontConfig.descWeight} ${fontConfig.coverSubtitleSize}px ${fontConfig.canvasFontFamily}`;
      ctx.fillText(subtitleText, centerX, y + 18);
      y += fontConfig.coverSubtitleSize + 40;
    }

    const photoTop = Math.max(y + 90, 560);
    const photoH = H - photoTop - 320;
    const photoW = W - 380;
    if (firstImg && photoH > 200) {
      drawFittedImage(ctx, firstImg, 190, photoTop, photoW, photoH, palette);
    }

    ctx.fillStyle = palette.mutedText;
    ctx.font = '500 24px "Noto Sans KR", sans-serif';
    ctx.fillText(`총 ${totalPhotos}쪽의 사진 기록`, centerX, H - 190);
  } else {
    const padX = 160;
    ctx.textAlign = 'left';

    const leftMaxW = W * 0.42;
    ctx.fillStyle = palette.mutedText;
    ctx.font = '500 22px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
    ctx.fillText('PHOTOGRAPH MONOGRAPH', padX, 240);

    ctx.fillStyle = palette.titleText;
    ctx.font = `${fontConfig.titleWeight} ${fontConfig.coverTitleSize - 4}px ${fontConfig.canvasFontFamily}`;
    const titleLines = wrapTextLines(ctx, titleText, leftMaxW, 3);
    let y = 320;
    for (const line of titleLines) {
      ctx.fillText(line, padX, y);
      y += fontConfig.coverTitleSize + 20;
    }

    if (subtitleText) {
      ctx.fillStyle = palette.descText;
      ctx.font = `${fontConfig.descWeight} ${fontConfig.coverSubtitleSize - 2}px ${fontConfig.canvasFontFamily}`;
      const subLines = wrapTextLines(ctx, subtitleText, leftMaxW, 2);
      y += 24;
      for (const line of subLines) {
        ctx.fillText(line, padX, y);
        y += fontConfig.coverSubtitleSize + 14;
      }
    }

    ctx.fillStyle = palette.accentText;
    ctx.fillRect(padX, H - 280, 64, 3);

    ctx.fillStyle = palette.descText;
    ctx.font = '500 24px "Noto Sans KR", sans-serif';
    ctx.fillText(`총 ${totalPhotos}쪽의 사진 기록`, padX, H - 245);

    if (firstImg) {
      const boxX = W * 0.52;
      const boxY = 180;
      const boxW = W - boxX - 150;
      const boxH = H - 360;
      drawFittedImage(ctx, firstImg, boxX, boxY, boxW, boxH, palette);
    }
  }
}

function renderPhotoPage(
  canvas: HTMLCanvasElement,
  photo: AlbumPhoto,
  img: HTMLImageElement | null,
  pageIndex: number,
  totalPages: number,
  settings: PdfSettings
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const palette = getAlbumThemePalette(settings.theme);
  const fontConfig = getAlbumFontConfig(settings.font);
  const W = canvas.width;
  const H = canvas.height;
  const isPortrait = H > W;

  ctx.fillStyle = palette.sheetBg;
  ctx.fillRect(0, 0, W, H);

  const padNum = String(pageIndex + 1).padStart(2, '0');
  const padTotal = String(totalPages).padStart(2, '0');
  const titleText = photo.title.trim();
  const descText = photo.description.trim();
  const albumTitle = settings.albumTitle.trim() || 'MONOGRAPH';

  if (isPortrait) {
    const marginX = 140;
    const marginTop = 140;
    const contentW = W - marginX * 2;
    const photoBoxH = 1320;

    if (img) {
      drawFittedImage(ctx, img, marginX, marginTop, contentW, photoBoxH, palette);
    }

    const ruleY = marginTop + photoBoxH + 84;
    ctx.fillStyle = palette.divider;
    ctx.fillRect(marginX, ruleY, contentW, 2);

    let textY = ruleY + 56;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (titleText) {
      ctx.fillStyle = palette.titleText;
      ctx.font = `${fontConfig.titleWeight} ${fontConfig.pageTitleSize}px ${fontConfig.canvasFontFamily}`;
      const titleLines = wrapTextLines(ctx, titleText, contentW, 2);
      for (const line of titleLines) {
        ctx.fillText(line, marginX, textY);
        textY += fontConfig.pageTitleLineHeight;
      }
      textY += 20;
    }

    if (descText) {
      ctx.fillStyle = palette.descText;
      ctx.font = `${fontConfig.descWeight} ${fontConfig.pageDescSize}px ${fontConfig.canvasFontFamily}`;
      const maxDescLines = titleText ? 6 : 8;
      const descLines = wrapTextLines(ctx, descText, contentW, maxDescLines);
      for (const line of descLines) {
        ctx.fillText(line, marginX, textY);
        textY += fontConfig.pageDescLineHeight;
      }
    }

    if (settings.showPageNumbers) {
      const footerY = H - 115;
      ctx.fillStyle = palette.mutedText;
      ctx.font = '500 21px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(albumTitle, marginX, footerY);

      ctx.fillStyle = palette.pageNumText;
      ctx.textAlign = 'right';
      ctx.fillText(`${padNum} / ${padTotal}`, W - marginX, footerY);
    }
  } else {
    const marginX = 130;
    const marginY = 140;
    const photoBoxW = Math.round(W * 0.58);
    const photoBoxH = H - marginY * 2;

    if (img) {
      drawFittedImage(ctx, img, marginX, marginY, photoBoxW, photoBoxH, palette);
    }

    const colX = marginX + photoBoxW + 96;
    const colW = W - colX - marginX;
    let textY = marginY + 30;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (settings.showPageNumbers) {
      ctx.fillStyle = palette.accentText;
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(padNum, colX, textY);
      textY += 54;
    }

    if (titleText) {
      ctx.fillStyle = palette.titleText;
      ctx.font = `${fontConfig.titleWeight} ${fontConfig.pageTitleSize}px ${fontConfig.canvasFontFamily}`;
      const titleLines = wrapTextLines(ctx, titleText, colW, 3);
      for (const line of titleLines) {
        ctx.fillText(line, colX, textY);
        textY += fontConfig.pageTitleLineHeight;
      }
      textY += 28;
    }

    if (titleText && descText) {
      ctx.fillStyle = palette.divider;
      ctx.fillRect(colX, textY, 56, 2);
      textY += 34;
    }

    if (descText) {
      ctx.fillStyle = palette.descText;
      ctx.font = `${fontConfig.descWeight} ${fontConfig.pageDescSize}px ${fontConfig.canvasFontFamily}`;
      const descLines = wrapTextLines(ctx, descText, colW, 14);
      for (const line of descLines) {
        ctx.fillText(line, colX, textY);
        textY += fontConfig.pageDescLineHeight;
      }
    }

    if (settings.showPageNumbers) {
      const footerY = H - marginY - 26;
      ctx.fillStyle = palette.mutedText;
      ctx.font = '500 21px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(albumTitle, colX, footerY);

      ctx.fillStyle = palette.pageNumText;
      ctx.textAlign = 'right';
      ctx.fillText(`${padNum} / ${padTotal}`, W - marginX, footerY);
    }
  }
}

export async function exportAlbumToPdf(
  photos: AlbumPhoto[],
  settings: PdfSettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (photos.length === 0) return;

  await ensureAlbumFontsLoaded(settings.font);

  const isPortrait = settings.orientation === 'portrait';
  const canvas = document.createElement('canvas');
  canvas.width = isPortrait ? 1654 : 2339;
  canvas.height = isPortrait ? 2339 : 1654;

  const doc = new jsPDF({
    orientation: isPortrait ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = doc.internal.pageSize.getWidth();
  const pageHeightMm = doc.internal.pageSize.getHeight();
  const totalSteps = photos.length + (settings.includeCover ? 1 : 0);
  let step = 0;

  let firstImg: HTMLImageElement | null = null;
  try {
    firstImg = await loadImageElement(photos[0].src);
  } catch {
    firstImg = null;
  }

  let hasAddedFirstPdfPage = false;

  if (settings.includeCover) {
    renderCoverPage(canvas, settings, photos.length, firstImg);
    const coverData = canvas.toDataURL('image/jpeg', 0.92);
    doc.addImage(coverData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
    hasAddedFirstPdfPage = true;
    step += 1;
    onProgress?.(step, totalSteps);
    await new Promise((r) => setTimeout(r, 10));
  }

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    let img: HTMLImageElement | null = i === 0 ? firstImg : null;
    if (!img) {
      try {
        img = await loadImageElement(photo.src);
      } catch {
        img = null;
      }
    }

    renderPhotoPage(canvas, photo, img, i, photos.length, settings);
    const pageData = canvas.toDataURL('image/jpeg', 0.92);

    if (hasAddedFirstPdfPage) {
      doc.addPage('a4', isPortrait ? 'portrait' : 'landscape');
    }
    doc.addImage(pageData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
    hasAddedFirstPdfPage = true;

    step += 1;
    onProgress?.(step, totalSteps);
    await new Promise((r) => setTimeout(r, 10));
  }

  const safeName = (settings.albumTitle.trim() || '나의_사진_앨범')
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80);

  doc.save(`${safeName}.pdf`);
}

export async function exportCurrentPageToPng(
  photo: AlbumPhoto,
  pageIndex: number,
  totalPages: number,
  settings: PdfSettings
): Promise<void> {
  const sampleText = `${photo.title} ${photo.description} ${settings.albumTitle}`;
  await ensureAlbumFontsLoaded(settings.font, sampleText);

  const isPortrait = settings.orientation === 'portrait';
  const canvas = document.createElement('canvas');
  canvas.width = isPortrait ? 1654 : 2339;
  canvas.height = isPortrait ? 2339 : 1654;

  let img: HTMLImageElement | null = null;
  try {
    img = await loadImageElement(photo.src);
  } catch {
    img = null;
  }

  renderPhotoPage(canvas, photo, img, pageIndex, totalPages, settings);

  // Match the preview sheet's crisp outer border
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const palette = getAlbumThemePalette(settings.theme);
    ctx.strokeStyle = palette.sheetBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) {
    throw new Error('Failed to encode PNG image');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (settings.albumTitle.trim() || '나의_사진_앨범')
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 60);
  const pageNum = String(pageIndex + 1).padStart(2, '0');

  link.href = url;
  link.download = `${safeName}_${pageNum}쪽.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
