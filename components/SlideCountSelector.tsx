'use client';

import type { SlideCount } from '@/lib/types';

const COUNTS: SlideCount[] = ['5', '10', '15', '20'];

interface SlideCountSelectorProps {
  value: SlideCount;
  onChange: (count: SlideCount) => void;
  disabled?: boolean;
}

export default function SlideCountSelector({
  value,
  onChange,
  disabled,
}: SlideCountSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-text-primary">
        Slide count
      </label>
      <div className="grid grid-cols-4 gap-2">
        {COUNTS.map((count) => {
          const selected = value === count;
          return (
            <button
              key={count}
              type="button"
              disabled={disabled}
              onClick={() => onChange(count)}
              className={[
                'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'bg-brand border-transparent text-white shadow-sm shadow-primary/30'
                  : 'border-border bg-white text-text-primary hover:border-primary/50 hover:bg-surface',
              ].join(' ')}
            >
              {count}
            </button>
          );
        })}
      </div>
    </div>
  );
}
