'use client';

import { useState } from 'react';

interface SuccessScreenProps {
  fileName: string;
  slideCount: number;
  fileSizeBytes: number;
  onDownload: () => void;
  onCreateAnother: () => void;
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const INCLUDED = [
  'Structured slides',
  'Real royalty-free images',
  'Speaker notes',
  'Professional formatting',
];

export default function SuccessScreen({
  fileName,
  slideCount,
  fileSizeBytes,
  onDownload,
  onCreateAnother,
}: SuccessScreenProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-14 w-14 animate-[scaleIn_300ms_ease-out] items-center justify-center rounded-full bg-success/10 text-3xl">
          ✅
        </span>
        <h2 className="text-xl font-semibold text-text-primary">
          Presentation ready!
        </h2>
      </div>

      <div className="w-full rounded-xl border border-border bg-surface p-5 text-left">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            📊
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">
              {fileName}
            </p>
            <p className="text-xs text-text-muted">
              Generated just now • {slideCount} slides •{' '}
              {formatSize(fileSizeBytes)}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDownload}
        className="bg-brand flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:shadow-lg hover:brightness-105"
      >
        ⬇ Download Presentation
      </button>

      <div className="w-full text-left">
        <p className="mb-2 text-sm font-semibold text-text-primary">
          What&apos;s included
        </p>
        <ul className="space-y-1">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-text-muted">
              <span className="text-success">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onCreateAnother}
        className="text-sm font-semibold text-primary hover:underline"
      >
        ← Create another presentation
      </button>

      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-text-subtle">Share feedback</p>
        {feedback ? (
          <p className="text-sm text-success">Thanks for the feedback!</p>
        ) : (
          <div className="flex gap-3 text-xl">
            {['👍', '👎', '⭐'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFeedback(emoji)}
                className="transition-transform hover:scale-125"
                aria-label={`Rate ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
