'use client';

import { useEffect, useState } from 'react';

const STATUS_MESSAGES = [
  'Analyzing your content…',
  'Structuring your slides…',
  'Fetching royalty-free images…',
  'Finalizing your presentation…',
];

const TIPS = [
  '💡 Pro tip: Be specific in your prompt for sharper slides.',
  '💡 Works with any content — research, reports, or rough notes.',
  '💡 Each slide includes speaker notes you can present from.',
  '💡 Images are real, royalty-free photos from Unsplash.',
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(8);
  const [statusIndex, setStatusIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Animate an indeterminate-but-reassuring progress bar toward ~92%.
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 6));
    }, 700);
    return () => clearInterval(interval);
  }, []);

  // Cycle status text.
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips every 5 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <h2 className="text-xl font-semibold text-text-primary">
        Generating your presentation
      </h2>

      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm font-medium text-text-muted" aria-live="polite">
          {STATUS_MESSAGES[statusIndex]}
        </p>
      </div>

      <div className="w-full">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-text-subtle">
          <span>{Math.round(progress)}%</span>
          <span>Estimated time: &lt; 30 seconds</span>
        </div>
      </div>

      <p className="text-sm text-text-muted">{TIPS[tipIndex]}</p>
    </div>
  );
}
