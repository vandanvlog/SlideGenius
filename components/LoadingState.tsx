'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  'Analyzing your content',
  'Generating slide structure',
  'Adding images',
  'Building your preview',
];

export default function LoadingState() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <h3 className="text-lg font-semibold text-text-primary">
        Generating your presentation…
      </h3>
      <ul className="w-full max-w-xs space-y-2 text-left">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={step}
              className={[
                'flex items-center gap-2 text-sm transition-colors',
                done || current ? 'text-text-primary' : 'text-text-subtle',
              ].join(' ')}
            >
              <span className="w-4">
                {done ? '✓' : current ? '🔄' : '⏳'}
              </span>
              {step}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-text-subtle">Estimated time: ~20 seconds</p>
    </div>
  );
}
