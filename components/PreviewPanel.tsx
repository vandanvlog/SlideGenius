'use client';

import SlidePreview from './SlidePreview';
import { SLIDE_TYPE_LABEL } from '@/lib/slide-templates';
import type { SlideData } from '@/lib/types';

interface PreviewPanelProps {
  slides: SlideData[];
  paletteId: string;
  currentIndex: number;
  onIndexChange: (i: number) => void;
  isExporting: boolean;
  onDownload: () => void;
}

export default function PreviewPanel({
  slides,
  paletteId,
  currentIndex,
  onIndexChange,
  isExporting,
  onDownload,
}: PreviewPanelProps) {
  if (slides.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="text-4xl opacity-40">🖼️</span>
        <p className="text-sm font-medium text-text-muted">No slides yet</p>
      </div>
    );
  }

  const slide = slides[currentIndex];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Slide {currentIndex + 1} / {slides.length}
        </span>
        <span className="rounded-full bg-field px-2.5 py-0.5 text-xs font-medium text-text-muted">
          {SLIDE_TYPE_LABEL[slide.type]}
        </span>
      </div>

      {/* Big slide preview */}
      <SlidePreview slide={slide} paletteId={paletteId} />

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => onIndexChange(currentIndex - 1)}
          className="rounded-lg border border-border bg-field px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>
        <div className="flex flex-1 flex-wrap justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={[
                'h-2 w-2 rounded-full transition-colors',
                i === currentIndex ? 'bg-primary' : 'bg-border hover:bg-text-subtle',
              ].join(' ')}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={currentIndex === slides.length - 1}
          onClick={() => onIndexChange(currentIndex + 1)}
          className="rounded-lg border border-border bg-field px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      {/* Download */}
      <button
        type="button"
        onClick={onDownload}
        disabled={isExporting}
        className="bg-brand mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-md shadow-primary/40 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Preparing download…
          </>
        ) : (
          '⬇ Download PowerPoint'
        )}
      </button>
    </div>
  );
}
