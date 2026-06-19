// Helpers shared by the HTML preview and the pptx generator so a slide looks
// the same in the browser and in the downloaded file.
import type { SlideType } from './types';
import {
  contrastRatio,
  getRoles,
  getPaletteById,
  DEFAULT_PALETTE_ID,
  type PaletteRoles,
} from './palettes';

// Resolve a palette id to its role colours, always falling back to the default
// so generation/preview never break on a missing or invalid id.
export function resolveRoles(paletteId?: string): PaletteRoles {
  const palette =
    (paletteId ? getPaletteById(paletteId) : undefined) ??
    getPaletteById(DEFAULT_PALETTE_ID)!;
  return getRoles(palette);
}

// Pick black or white (whichever is more legible) for text placed on a fill.
export function legibleTextOn(fill: string): string {
  return contrastRatio(fill, '#FFFFFF') >= contrastRatio(fill, '#111827')
    ? '#FFFFFF'
    : '#111827';
}

// Slide types that lead with a full-bleed image.
export const IMAGE_LEADING_TYPES: SlideType[] = ['image_focus'];

// Slide types that show an image beside the text.
export const SIDE_IMAGE_TYPES: SlideType[] = ['content', 'comparison', 'process'];

// Slide types rendered as a full colored cover (no body image).
export const COVER_TYPES: SlideType[] = ['title', 'section', 'closing'];

// Slide types that actually display an image — used to distribute the user's
// uploaded images only onto slides that can show them (so none are wasted).
export const IMAGE_SLIDE_TYPES: SlideType[] = [
  'content',
  'process',
  'comparison',
  'image_focus',
];

export interface ParsedStat {
  value: string;
  label: string;
}

// Stats slides return content items like "1.2M :: Peak circulation".
// We also tolerate " - ", " — ", and ":" as separators.
export function parseStat(item: string): ParsedStat {
  const separators = [' :: ', '::', ' — ', ' - ', ' – ', ': '];
  for (const sep of separators) {
    const idx = item.indexOf(sep);
    if (idx > 0) {
      return {
        value: item.slice(0, idx).trim(),
        label: item.slice(idx + sep.length).trim(),
      };
    }
  }
  // No separator — treat the whole thing as a label.
  return { value: '•', label: item.trim() };
}

export const SLIDE_TYPE_LABEL: Record<SlideType, string> = {
  title: 'Title',
  content: 'Content',
  stats: 'Stats',
  image_focus: 'Image',
  quote: 'Quote',
  process: 'Process',
  comparison: 'Comparison',
  section: 'Section',
  closing: 'Closing',
};
