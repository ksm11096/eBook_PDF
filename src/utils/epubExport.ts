import JSZip from 'jszip';
import { AlbumPhoto, PdfSettings } from '../types/album';
import { getAlbumFontConfig, getAlbumThemePalette } from '../constants/albumThemes';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

async function imageToJpegBytes(
  img: HTMLImageElement,
  maxDimension = 1800,
  bgHex = '#FFFFFF'
): Promise<Uint8Array> {
  const natW = img.naturalWidth || 1200;
  const natH = img.naturalHeight || 900;
  const scale = Math.min(1, maxDimension / Math.max(natW, natH));
  const w = Math.max(1, Math.round(natW * scale));
  const h = Math.max(1, Math.round(natH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
  );
  if (!blob) {
    throw new Error('Failed to encode JPEG image for EPUB');
  }
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

async function renderCoverImageBytes(
  settings: PdfSettings,
  totalPhotos: number,
  firstImg: HTMLImageElement | null
): Promise<Uint8Array> {
  const palette = getAlbumThemePalette(settings.theme);
  const fontConfig = getAlbumFontConfig(settings.font);

  if (typeof document !== 'undefined' && document.fonts) {
    const textSample = `${settings.albumTitle} ${settings.albumSubtitle} ${settings.author} 가나다라마바사`;
    await Promise.allSettled(
      fontConfig.preloadSpecs.map((spec) => document.fonts.load(spec, textSample))
    );
    await document.fonts.ready;
  }

  // Standard 1600x2400 e-book cover ratio (2:3) recommended by Korean bookstores
  const W = 1600;
  const H = 2400;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.fillStyle = palette.sheetBg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = palette.sheetBorder;
  ctx.lineWidth = 3;
  ctx.strokeRect(84, 84, W - 168, H - 168);

  const centerX = W / 2;
  const titleText = settings.albumTitle.trim() || '나의 사진 앨범';
  const subtitleText = settings.albumSubtitle.trim();
  const authorText = settings.author.trim();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.fillStyle = palette.mutedText;
  ctx.font = '500 24px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillText('PHOTOGRAPH MONOGRAPH', centerX, 180);

  ctx.fillStyle = palette.titleText;
  ctx.font = `${fontConfig.titleWeight} ${fontConfig.coverTitleSize}px ${fontConfig.canvasFontFamily}`;
  ctx.fillText(titleText.slice(0, 28), centerX, 270);

  let nextY = 270 + fontConfig.coverTitleSize + 36;
  if (subtitleText) {
    ctx.fillStyle = palette.descText;
    ctx.font = `${fontConfig.descWeight} ${fontConfig.coverSubtitleSize}px ${fontConfig.canvasFontFamily}`;
    ctx.fillText(subtitleText.slice(0, 40), centerX, nextY);
    nextY += fontConfig.coverSubtitleSize + 44;
  }

  if (firstImg) {
    const boxX = 180;
    const boxY = Math.max(nextY + 40, 520);
    const boxW = W - 360;
    const boxH = H - boxY - 340;
    const imgRatio = firstImg.naturalWidth / firstImg.naturalHeight || 1;
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

    ctx.fillStyle = palette.matBg;
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.drawImage(firstImg, drawX, drawY, drawW, drawH);
    ctx.strokeStyle = palette.photoBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX, drawY, drawW, drawH);
  }

  ctx.fillStyle = palette.mutedText;
  ctx.font = '500 26px "Noto Sans KR", sans-serif';
  const footerLine = authorText
    ? `${authorText} · 총 ${totalPhotos}쪽의 사진 기록`
    : `총 ${totalPhotos}쪽의 사진 기록`;
  ctx.fillText(footerLine, centerX, H - 200);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
  );
  if (!blob) throw new Error('Failed to encode cover image');
  return new Uint8Array(await blob.arrayBuffer());
}

function buildCss(settings: PdfSettings): string {
  const palette = getAlbumThemePalette(settings.theme);
  const fontFamily =
    settings.font === 'gothic'
      ? '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
      : settings.font === 'handwriting'
      ? '"Nanum Pen Script", "Noto Serif KR", "Apple SD Gothic Neo", cursive, serif'
      : '"Noto Serif KR", "NanumMyeongjo", "Batang", Georgia, serif';

  return `@charset "UTF-8";

html, body {
  margin: 0;
  padding: 0;
  background-color: ${palette.sheetBg};
  color: ${palette.titleText};
  font-family: ${fontFamily};
  line-height: 1.7;
}

.page-wrap {
  box-sizing: border-box;
  max-width: 780px;
  margin: 0 auto;
  padding: 2.2em 1.6em;
  page-break-inside: avoid;
  break-inside: avoid;
}

.cover-wrap {
  box-sizing: border-box;
  max-width: 720px;
  margin: 0 auto;
  padding: 2em 1.4em;
  text-align: center;
}

.cover-img {
  display: block;
  max-width: 100%;
  max-height: 86vh;
  margin: 0 auto;
  border: 1px solid ${palette.sheetBorder};
}

.photo-frame {
  text-align: center;
  margin: 0 0 1.4em 0;
  padding: 0;
}

.photo-frame img {
  display: block;
  max-width: 100%;
  max-height: 62vh;
  width: auto;
  height: auto;
  margin: 0 auto;
  border: 1px solid ${palette.sheetBorder};
  background-color: ${palette.matBg};
}

.caption-box {
  border-top: 1px solid ${palette.divider};
  padding-top: 1.1em;
}

.page-index {
  font-size: 0.78em;
  letter-spacing: 0.06em;
  color: ${palette.accentText};
  margin: 0 0 0.4em 0;
  font-weight: 600;
}

.photo-title {
  font-size: 1.35em;
  font-weight: 700;
  color: ${palette.titleText};
  margin: 0 0 0.65em 0;
  line-height: 1.4;
}

.photo-desc {
  font-size: 0.98em;
  color: ${palette.descText};
  margin: 0;
  white-space: pre-line;
  line-height: 1.75;
}

.page-footer {
  margin-top: 1.8em;
  padding-top: 0.8em;
  border-top: 1px solid ${palette.divider};
  font-size: 0.75em;
  color: ${palette.mutedText};
  display: flex;
  justify-content: space-between;
}

nav#toc ol {
  list-style: decimal;
  padding-left: 1.5em;
}

nav#toc li {
  margin: 0.55em 0;
}

nav#toc a {
  color: ${palette.titleText};
  text-decoration: none;
}
`;
}

function buildXhtmlPage(
  photo: AlbumPhoto,
  imageHref: string,
  pageIndex: number,
  totalPages: number,
  settings: PdfSettings
): string {
  const padNum = String(pageIndex + 1).padStart(2, '0');
  const padTotal = String(totalPages).padStart(2, '0');
  const titleText = photo.title.trim();
  const descText = photo.description.trim();
  const docTitle = titleText || `${pageIndex + 1}쪽`;
  const albumTitle = settings.albumTitle.trim() || 'MONOGRAPH';

  const descParagraphs = descText
    ? descText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => `<p class="photo-desc">${escapeXml(line)}</p>`)
        .join('\n      ')
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(docTitle)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/album.css" />
</head>
<body>
  <section class="page-wrap">
    <figure class="photo-frame">
      <img src="../${escapeXml(imageHref)}" alt="${escapeXml(docTitle)}" />
    </figure>
    <div class="caption-box">
      ${
        settings.showPageNumbers
          ? `<p class="page-index">${padNum} / ${padTotal}</p>`
          : ''
      }
      ${titleText ? `<h1 class="photo-title">${escapeXml(titleText)}</h1>` : ''}
      ${descParagraphs}
    </div>
    ${
      settings.showPageNumbers
        ? `<footer class="page-footer"><span>${escapeXml(albumTitle)}</span><span>${padNum}쪽</span></footer>`
        : ''
    }
  </section>
</body>
</html>
`;
}

function buildCoverXhtml(albumTitle: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ko" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(albumTitle)} — 표지</title>
  <link rel="stylesheet" type="text/css" href="styles/album.css" />
</head>
<body epub:type="cover">
  <section class="cover-wrap">
    <img class="cover-img" src="images/cover.jpg" alt="${escapeXml(albumTitle)} 표지" />
  </section>
</body>
</html>
`;
}

function buildNavXhtml(
  albumTitle: string,
  photos: AlbumPhoto[],
  includeCover: boolean
): string {
  const items: string[] = [];
  if (includeCover) {
    items.push(`      <li><a href="cover.xhtml">표지</a></li>`);
  }
  photos.forEach((photo, idx) => {
    const fileNum = String(idx + 1).padStart(3, '0');
    const label = photo.title.trim()
      ? `${String(idx + 1).padStart(2, '0')}. ${photo.title.trim()}`
      : `${String(idx + 1).padStart(2, '0')}쪽`;
    items.push(`      <li><a href="pages/page-${fileNum}.xhtml">${escapeXml(label)}</a></li>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ko" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(albumTitle)} — 목차</title>
  <link rel="stylesheet" type="text/css" href="styles/album.css" />
</head>
<body>
  <nav epub:type="toc" id="toc" class="page-wrap">
    <h1 class="photo-title">목차</h1>
    <ol>
${items.join('\n')}
    </ol>
  </nav>
</body>
</html>
`;
}

function buildTocNcx(
  bookUuid: string,
  albumTitle: string,
  photos: AlbumPhoto[],
  includeCover: boolean
): string {
  const navPoints: string[] = [];
  let playOrder = 1;

  if (includeCover) {
    navPoints.push(`    <navPoint id="navpoint-cover" playOrder="${playOrder}">
      <navLabel><text>표지</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`);
    playOrder += 1;
  }

  photos.forEach((photo, idx) => {
    const fileNum = String(idx + 1).padStart(3, '0');
    const label = photo.title.trim()
      ? `${String(idx + 1).padStart(2, '0')}. ${photo.title.trim()}`
      : `${String(idx + 1).padStart(2, '0')}쪽`;
    navPoints.push(`    <navPoint id="navpoint-${fileNum}" playOrder="${playOrder}">
      <navLabel><text>${escapeXml(label)}</text></navLabel>
      <content src="pages/page-${fileNum}.xhtml"/>
    </navPoint>`);
    playOrder += 1;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${escapeXml(bookUuid)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(albumTitle)}</text>
  </docTitle>
  <navMap>
${navPoints.join('\n')}
  </navMap>
</ncx>
`;
}

function buildPackageOpf(
  bookUuid: string,
  settings: PdfSettings,
  photos: AlbumPhoto[],
  hasCoverImage: boolean
): string {
  const albumTitle = settings.albumTitle.trim() || '나의 사진 앨범';
  const author = settings.author.trim() || '포토 앨범 작가';
  const modifiedIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const manifestItems: string[] = [
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `    <item id="style" href="styles/album.css" media-type="text/css"/>`,
  ];

  const spineItems: string[] = [];

  if (settings.includeCover && hasCoverImage) {
    manifestItems.push(
      `    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>`,
      `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`    <itemref idref="cover"/>`);
  }

  photos.forEach((_, idx) => {
    const fileNum = String(idx + 1).padStart(3, '0');
    manifestItems.push(
      `    <item id="img-${fileNum}" href="images/photo-${fileNum}.jpg" media-type="image/jpeg"/>`,
      `    <item id="page-${fileNum}" href="pages/page-${fileNum}.xhtml" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`    <itemref idref="page-${fileNum}"/>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="ko">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${escapeXml(bookUuid)}</dc:identifier>
    <dc:title>${escapeXml(albumTitle)}</dc:title>
    <dc:language>ko</dc:language>
    <dc:creator id="creator">${escapeXml(author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    <meta property="dcterms:modified">${modifiedIso}</meta>
    ${hasCoverImage ? '<meta name="cover" content="cover-image"/>' : ''}
  </metadata>
  <manifest>
${manifestItems.join('\n')}
  </manifest>
  <spine toc="ncx">
${spineItems.join('\n')}
  </spine>
</package>
`;
}

/**
 * Exports the album as a standards-compliant EPUB 3.0 (.epub) file suitable for
 * Korean bookstores (Kyobo Book Centre, Ridibooks, Yes24) and standard e-readers.
 */
export async function exportAlbumToEpub(
  photos: AlbumPhoto[],
  settings: PdfSettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (photos.length === 0) return;

  const zip = new JSZip();
  const palette = getAlbumThemePalette(settings.theme);
  const albumTitle = settings.albumTitle.trim() || '나의 사진 앨범';
  const bookUuid = generateUuid();

  // 1. EPUB spec requires `mimetype` as the very first, uncompressed file
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/epub+zip"/>
  </rootfiles>
</container>
`
  );

  const oebps = zip.folder('OEBPS');
  if (!oebps) throw new Error('Failed to create OEBPS directory');

  oebps.file('styles/album.css', buildCss(settings));

  const totalSteps = photos.length + (settings.includeCover ? 1 : 0);
  let step = 0;

  let firstImg: HTMLImageElement | null = null;
  try {
    firstImg = await loadImageElement(photos[0].src);
  } catch {
    firstImg = null;
  }

  let hasCoverImage = false;
  if (settings.includeCover) {
    try {
      const coverBytes = await renderCoverImageBytes(settings, photos.length, firstImg);
      oebps.file('images/cover.jpg', coverBytes);
      oebps.file('cover.xhtml', buildCoverXhtml(albumTitle));
      hasCoverImage = true;
    } catch {
      hasCoverImage = false;
    }
    step += 1;
    onProgress?.(step, totalSteps);
  }

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const fileNum = String(i + 1).padStart(3, '0');
    const imgHref = `images/photo-${fileNum}.jpg`;

    let img: HTMLImageElement | null = i === 0 ? firstImg : null;
    if (!img) {
      try {
        img = await loadImageElement(photo.src);
      } catch {
        img = null;
      }
    }

    if (img) {
      const jpegBytes = await imageToJpegBytes(img, 1800, palette.sheetBg);
      oebps.file(imgHref, jpegBytes);
    }

    oebps.file(
      `pages/page-${fileNum}.xhtml`,
      buildXhtmlPage(photo, imgHref, i, photos.length, settings)
    );

    step += 1;
    onProgress?.(step, totalSteps);
    await new Promise((r) => setTimeout(r, 8));
  }

  oebps.file('nav.xhtml', buildNavXhtml(albumTitle, photos, settings.includeCover && hasCoverImage));
  oebps.file(
    'toc.ncx',
    buildTocNcx(bookUuid, albumTitle, photos, settings.includeCover && hasCoverImage)
  );
  oebps.file('package.opf', buildPackageOpf(bookUuid, settings, photos, hasCoverImage));

  const epubBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(epubBlob);
  const link = document.createElement('a');
  const safeName = albumTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || '나의_사진_앨범';
  link.href = url;
  link.download = `${safeName}.epub`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
