import pptxgen from 'pptxgenjs';
import type { SlideData, SlideStyle } from './types';
import { resolveRoles, legibleTextOn, parseStat, COVER_TYPES } from './slide-templates';
import type { PaletteRoles } from './palettes';

const IMAGE_FETCH_TIMEOUT_MS = 4000;

// pptxgenjs wants hex WITHOUT the leading '#'.
const hex = (c: string): string => c.replace('#', '');
// Legible black/white for text on a hexless fill colour.
const legibleOn = (hexless: string): string => hex(legibleTextOn(`#${hexless}`));

async function toPptxImageData(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:')) return src.slice('data:'.length);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(src, { signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    return `${contentType};base64,${base64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

type Slide = ReturnType<pptxgen['addSlide']>;

// Effective per-slide colours: palette roles are the base; per-slide style
// overrides (from refine) win. All values are hexless (no '#').
interface Eff {
  accent: string;
  text: string;
  bg: string;
  coverBg: string;
  quoteBg: string;
  placeholderBg: string;
  muted: string;
  stat: string[];
  align: 'left' | 'center';
  bold: boolean;
}

function effOf(roles: PaletteRoles, style?: SlideStyle): Eff {
  const st = style ?? {};
  const accent = hex(st.accentColor || roles.primary);
  return {
    accent,
    text: hex(st.textColor || roles.text),
    bg: hex(st.background || roles.background),
    coverBg: hex(st.background || st.accentColor || roles.primary),
    quoteBg: hex(st.background || roles.background),
    placeholderBg: hex(roles.secondary),
    muted: hex(roles.secondary),
    stat: st.accentColor
      ? [accent, accent, accent, accent]
      : [hex(roles.accent), hex(roles.secondary), hex(roles.primary), hex(roles.accent)],
    align: st.align === 'center' ? 'center' : 'left',
    bold: !!st.bold,
  };
}

function addTitleBar(slide: Slide, title: string, eff: Eff): void {
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.9,
    fill: { color: eff.accent },
    line: { color: eff.accent },
  });
  slide.addText(title, {
    x: 0.5,
    y: 0.12,
    w: 12.3,
    h: 0.66,
    fontSize: 28,
    bold: true,
    color: legibleOn(eff.accent),
    fontFace: 'Arial',
    valign: 'middle',
  });
}

function addPageNumber(slide: Slide, n: number, total: number, eff: Eff): void {
  slide.addText(`${n} / ${total}`, {
    x: 11.8,
    y: 7.0,
    w: 1.3,
    h: 0.35,
    fontSize: 10,
    color: eff.muted,
    align: 'right',
    fontFace: 'Arial',
  });
}

function renderCover(slide: Slide, data: SlideData, eff: Eff): void {
  slide.background = { color: eff.coverBg };
  const titleColor = legibleOn(eff.coverBg);
  slide.addText(data.title, {
    x: 0.7,
    y: 2.6,
    w: 11.9,
    h: 1.6,
    fontSize: 48,
    bold: true,
    color: titleColor,
    align: 'center',
    fontFace: 'Arial',
  });
  const subtitle = data.content[0] ?? '';
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.2,
      y: 4.3,
      w: 10.9,
      h: 1,
      fontSize: 22,
      color: titleColor,
      align: 'center',
      fontFace: 'Arial',
    });
  }
}

function renderContent(slide: Slide, data: SlideData, eff: Eff, imageData: string | null): void {
  slide.background = { color: eff.bg };
  addTitleBar(slide, data.title, eff);

  const hasImage = Boolean(imageData);
  const bullets = data.content.map((point) => ({
    text: point,
    options: {
      bullet: eff.align === 'center' ? false : { code: '2022' },
      color: eff.text,
      breakLine: true,
      bold: eff.bold,
      align: eff.align,
    },
  }));
  if (bullets.length > 0) {
    slide.addText(bullets, {
      x: 0.6,
      y: 1.3,
      w: hasImage ? 6.6 : 12.1,
      h: 5.2,
      fontSize: 18,
      color: eff.text,
      fontFace: 'Arial',
      valign: 'top',
      align: eff.align,
      lineSpacingMultiple: 1.35,
    });
  }
  if (imageData) {
    slide.addImage({
      data: imageData,
      x: 7.6,
      y: 1.4,
      w: 5.1,
      h: 4.9,
      sizing: { type: 'contain', w: 5.1, h: 4.9 },
    });
  }
}

function renderStats(slide: Slide, data: SlideData, eff: Eff): void {
  slide.background = { color: eff.bg };
  addTitleBar(slide, data.title, eff);

  const stats = data.content.slice(0, 4).map(parseStat);
  const cardW = 2.9;
  const gap = 0.35;
  const totalW = stats.length * cardW + (stats.length - 1) * gap;
  let x = (13.33 - totalW) / 2;

  stats.forEach((stat, idx) => {
    const color = eff.stat[idx % eff.stat.length];
    const onCard = legibleOn(color);
    slide.addShape('roundRect', {
      x,
      y: 2.0,
      w: cardW,
      h: 3.0,
      fill: { color },
      line: { color },
      rectRadius: 0.12,
    });
    slide.addText(stat.value, {
      x,
      y: 2.4,
      w: cardW,
      h: 1.2,
      fontSize: 40,
      bold: true,
      color: onCard,
      align: 'center',
      fontFace: 'Arial',
    });
    slide.addText(stat.label, {
      x: x + 0.15,
      y: 3.6,
      w: cardW - 0.3,
      h: 1.1,
      fontSize: 14,
      color: onCard,
      align: 'center',
      valign: 'top',
      fontFace: 'Arial',
    });
    x += cardW + gap;
  });
}

function renderImageFocus(slide: Slide, data: SlideData, eff: Eff, imageData: string | null): void {
  slide.background = { color: eff.bg };
  if (imageData) {
    slide.addImage({
      data: imageData,
      x: 0,
      y: 0,
      w: 13.33,
      h: 5.0,
      sizing: { type: 'contain', w: 13.33, h: 5.0 },
    });
  } else {
    slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 5.0, fill: { color: eff.placeholderBg } });
  }
  slide.addText(data.title, {
    x: 0.6,
    y: 5.2,
    w: 12.1,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: eff.text,
    align: eff.align,
    fontFace: 'Arial',
  });
  const caption = data.content[0] ?? '';
  if (caption) {
    slide.addText(caption, {
      x: 0.6,
      y: 6.0,
      w: 12.1,
      h: 0.9,
      fontSize: 14,
      color: eff.muted,
      align: eff.align,
      fontFace: 'Arial',
    });
  }
}

function renderQuote(slide: Slide, data: SlideData, eff: Eff): void {
  slide.background = { color: eff.quoteBg };
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 0.4,
    h: '100%',
    fill: { color: eff.accent },
    line: { color: eff.accent },
  });
  const quote = data.content[0] ?? data.title;
  const attribution = data.content[1] ?? '';
  slide.addText(`“${quote}”`, {
    x: 1.2,
    y: 2.2,
    w: 10.9,
    h: 2.6,
    fontSize: 32,
    bold: true,
    italic: true,
    color: eff.text,
    align: eff.align,
    valign: 'middle',
    fontFace: 'Arial',
  });
  if (attribution) {
    slide.addText(`— ${attribution}`, {
      x: 1.2,
      y: 4.9,
      w: 10.9,
      h: 0.5,
      fontSize: 16,
      color: eff.muted,
      align: eff.align,
      fontFace: 'Arial',
    });
  }
}

/**
 * Build a .pptx from slide data using the chosen palette's roles. Returns a Buffer.
 */
export async function generatePresentation(
  slides: SlideData[],
  paletteId: string
): Promise<Buffer> {
  const roles = resolveRoles(paletteId);
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';
  pptx.author = 'SlideGenius';
  pptx.company = 'SlideGenius';

  const images = await Promise.all(
    slides.map((s) => (s.imageUrl ? toPptxImageData(s.imageUrl) : Promise.resolve(null)))
  );

  slides.forEach((data, i) => {
    const slide = pptx.addSlide();
    const eff = effOf(roles, data.style);
    const imageData = images[i];
    const isCover = COVER_TYPES.includes(data.type);

    switch (data.type) {
      case 'title':
      case 'section':
      case 'closing':
        renderCover(slide, data, eff);
        break;
      case 'stats':
        renderStats(slide, data, eff);
        break;
      case 'image_focus':
        renderImageFocus(slide, data, eff, imageData);
        break;
      case 'quote':
        renderQuote(slide, data, eff);
        break;
      case 'content':
      case 'process':
      case 'comparison':
      default:
        renderContent(slide, data, eff, imageData);
        break;
    }

    if (data.speakerNotes) slide.addNotes(data.speakerNotes);
    if (!isCover) addPageNumber(slide, i + 1, slides.length, eff);
  });

  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
}
