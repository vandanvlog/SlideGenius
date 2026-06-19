'use client';

import { useCallback, useRef, useState } from 'react';
import ChatPanel, { type GeneratePayload } from '@/components/ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';
import SlideFeedback from '@/components/SlideFeedback';
import { DEFAULT_PALETTE_ID } from '@/lib/palettes';
import { IMAGE_SLIDE_TYPES } from '@/lib/slide-templates';
import type { AppPhase, SlideData } from '@/lib/types';

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('input');
  const [error, setError] = useState<string | null>(null);

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [presentationType, setPresentationType] = useState('business');
  const [paletteId, setPaletteId] = useState<string>(DEFAULT_PALETTE_ID);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Bump to remount ChatPanel on reset (clears its internal form state).
  const [chatKey, setChatKey] = useState(0);
  const customImagesRef = useRef<string[]>([]);

  const handleGenerate = useCallback(async (payload: GeneratePayload) => {
    setError(null);
    setIsGenerating(true);
    setPhase('generating');
    setPresentationType(payload.presentationType);
    setPaletteId(payload.paletteId);
    customImagesRef.current = payload.customImageDataUrls;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: payload.description,
          presentationType: payload.presentationType,
          slideCount: payload.slideCount,
          hasCustomImages: payload.hasCustomImages,
          customImageCount: payload.customImageDataUrls.length,
          attachedFiles: payload.attachedFiles,
          paletteId: payload.paletteId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message ?? 'Generation failed. Please try again.');
        setPhase('input');
        return;
      }

      let resultSlides: SlideData[] = data.slides;
      // Distribute user-uploaded images in order onto ONLY the slides that
      // actually display an image, so none are wasted on covers/stats/quotes.
      if (payload.hasCustomImages && customImagesRef.current.length > 0) {
        const imgs = customImagesRef.current;
        let k = 0;
        resultSlides = resultSlides.map((s) => {
          if (IMAGE_SLIDE_TYPES.includes(s.type) && k < imgs.length) {
            return { ...s, imageUrl: imgs[k++] };
          }
          return s;
        });
      }

      setSlides(resultSlides);
      setCurrentIndex(0);
      setPhase('preview');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setPhase('input');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleRefine = useCallback(
    async (feedback: string, newImageDataUrl?: string) => {
      const slide = slides[currentIndex];
      if (!slide) return;
      setError(null);
      setIsRefining(true);
      try {
        const res = await fetch('/api/refine-slide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide,
            feedback,
            presentationType,
            newImage: newImageDataUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data?.error?.message ?? "Couldn't refine that slide.");
          return;
        }
        setSlides((prev) =>
          prev.map((s, i) => (i === currentIndex ? data.updatedSlide : s))
        );
      } catch {
        setError('Network error while refining. Please try again.');
      } finally {
        setIsRefining(false);
      }
    },
    [slides, currentIndex, presentationType]
  );

  const handleDownload = useCallback(async () => {
    if (slides.length === 0) return;
    setError(null);
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, paletteId }),
      });
      if (!res.ok) {
        let message = "Couldn't build the PowerPoint file.";
        try {
          const data = await res.json();
          if (data?.error?.message) message = data.error.message;
        } catch {
          /* binary or empty */
        }
        setError(message);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1] ?? 'Presentation.pptx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Network error while exporting. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [slides, paletteId]);

  const handleReset = useCallback(() => {
    setPhase('input');
    setSlides([]);
    setCurrentIndex(0);
    setError(null);
    setPresentationType('business');
    setPaletteId(DEFAULT_PALETTE_ID);
    customImagesRef.current = [];
    setChatKey((k) => k + 1);
  }, []);

  // Split (refine | preview) layout only once slides exist.
  const isPreview = phase === 'preview';

  return (
    <main className="flex min-h-screen flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-5 py-3 sm:px-8">
        <span className="text-sm font-semibold tracking-tight text-text-muted">
          SlideGenius
        </span>
        <a
          href="https://github.com/vandanvlog/SlideGenius"
          target="_blank"
          rel="noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-primary/50 hover:text-text-primary"
          aria-label="Help"
        >
          ?
        </a>
      </div>

      {isPreview ? (
        // ---- Preview phase: left = start over + refine, right = slide preview ----
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-6 md:flex-row md:px-6">
          {/* LEFT — start over + refine */}
          <section className="flex flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-black/30 md:h-[calc(100vh-6rem)] md:w-[38%]">
            <button
              type="button"
              onClick={handleReset}
              className="self-start rounded-lg border border-border bg-field px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary/50"
            >
              ← Start over
            </button>

            {error && (
              <div className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}

            <SlideFeedback
              key={currentIndex}
              slideNumber={currentIndex + 1}
              isLoading={isRefining}
              onApply={handleRefine}
            />

            <p className="text-xs text-text-subtle">
              Your edit updates the slide shown on the right. Use Prev / Next to
              move between slides.
            </p>
          </section>

          {/* RIGHT — slide preview + download */}
          <section className="overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-black/30 md:h-[calc(100vh-6rem)] md:flex-1">
            <PreviewPanel
              slides={slides}
              paletteId={paletteId}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              isExporting={isExporting}
              onDownload={handleDownload}
            />
          </section>
        </div>
      ) : (
        // ---- Input / questions / generating: centered single column ----
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-[8vh]">
          <ChatPanel
            key={chatKey}
            isLoading={isGenerating}
            error={error}
            onGenerate={handleGenerate}
          />
        </div>
      )}
    </main>
  );
}
