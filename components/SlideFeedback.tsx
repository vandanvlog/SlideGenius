'use client';

import { useRef, useState } from 'react';
import { fileToDataUrl, MAX_FILE_BYTES } from '@/lib/client-files';

interface SlideFeedbackProps {
  slideNumber: number;
  isLoading: boolean;
  onApply: (feedback: string, newImageDataUrl?: string) => void;
}

export default function SlideFeedback({
  slideNumber,
  isLoading,
  onApply,
}: SlideFeedbackProps) {
  const [feedback, setFeedback] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const addImage = (list: FileList | null) => {
    const file = list?.[0];
    if (file && file.type.startsWith('image/') && file.size <= MAX_FILE_BYTES) {
      setImage(file);
    }
  };

  const canApply = (feedback.trim().length > 0 || image !== null) && !isLoading;

  const handleApply = async () => {
    if (!canApply) return;
    const dataUrl = image ? await fileToDataUrl(image) : undefined;
    onApply(feedback.trim(), dataUrl);
    setFeedback('');
    setImage(null);
  };

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-text-primary">
        Refine slide {slideNumber}
      </h4>

      {/* Composer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!isLoading) addImage(e.dataTransfer.files);
        }}
        className={[
          'rounded-xl border bg-field transition-colors',
          dragging ? 'border-primary' : 'border-border focus-within:border-primary/60',
        ].join(' ')}
      >
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={isLoading}
          rows={2}
          placeholder="What would you change? e.g. “Shorten the bullets”, “Make it a quote slide”, “Add a growth stat”."
          className="w-full resize-none rounded-xl bg-transparent px-3 pt-3 text-sm text-text-primary placeholder:text-text-subtle focus:outline-none disabled:opacity-50"
        />

        {image && (
          <div className="px-3 pb-1">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text-primary">
              🖼️ <span className="max-w-[12rem] truncate">{image.name}</span>
              <button
                type="button"
                onClick={() => setImage(null)}
                disabled={isLoading}
                className="text-text-subtle hover:text-error"
                aria-label="Remove image"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-50"
          >
            <span className="text-base">📎</span> Image
          </button>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => addImage(e.target.files)}
          />

          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="bg-brand flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white shadow-sm shadow-primary/40 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Applying…
              </>
            ) : (
              'Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
