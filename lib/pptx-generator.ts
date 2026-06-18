import pptxgen from 'pptxgenjs';
import type { SlideOutline } from './types';

// A slide outline optionally enriched with a resolved image URL.
export type SlideWithImage = SlideOutline & { imageUrl?: string };

const IMAGE_FETCH_TIMEOUT_MS = 3000;

// Fetch a remote image and return it as a pptxgenjs data string
// ("<mime>;base64,<data>"). Returns null on any failure so the slide
// renders without an image.
async function fetchImageData(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `${contentType};base64,${base64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Build a .pptx presentation from slide outlines and return it as a Buffer.
 */
export async function generatePresentation(
  slides: SlideWithImage[]
): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';
  pptx.author = 'SlideGenius';
  pptx.company = 'SlideGenius';

  // Pre-fetch all image bytes in parallel (graceful: nulls allowed).
  const imageData = await Promise.all(
    slides.map((slide) =>
      slide.imageUrl ? fetchImageData(slide.imageUrl) : Promise.resolve(null)
    )
  );

  slides.forEach((slide, index) => {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };

    const hasImage = Boolean(imageData[index]);
    const bulletWidth = hasImage ? 7.3 : 12.3;

    // Title
    s.addText(slide.title, {
      x: 0.5,
      y: 0.4,
      w: 12.3,
      h: 1.0,
      fontSize: 32,
      bold: true,
      color: '111827',
      fontFace: 'Arial',
    });

    // Bullet points (left column)
    const bulletText = slide.bulletPoints.map((point) => ({
      text: point,
      options: { bullet: true, breakLine: true },
    }));
    if (bulletText.length > 0) {
      s.addText(bulletText, {
        x: 0.5,
        y: 1.7,
        w: bulletWidth,
        h: 5.0,
        fontSize: 18,
        color: '374151',
        fontFace: 'Arial',
        valign: 'top',
        lineSpacingMultiple: 1.3,
      });
    }

    // Image (right side) — only if we successfully fetched it
    const data = imageData[index];
    if (data) {
      s.addImage({
        data,
        x: 8.5,
        y: 1.7,
        w: 4.0,
        h: 4.0,
        sizing: { type: 'contain', w: 4.0, h: 4.0 },
      });
    }

    // Speaker notes
    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes);
    }
  });

  // outputType 'nodebuffer' returns a Node Buffer.
  const out = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return out;
}
