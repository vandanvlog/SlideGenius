'use client';

import type { PresentationStyle } from '@/lib/types';

const STYLES: { value: PresentationStyle; label: string }[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'legal', label: 'Legal' },
];

interface StyleSelectorProps {
  value: PresentationStyle;
  onChange: (style: PresentationStyle) => void;
  disabled?: boolean;
}

export default function StyleSelector({
  value,
  onChange,
  disabled,
}: StyleSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-text-primary">
        Generation style
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STYLES.map((style) => {
          const selected = value === style.value;
          return (
            <button
              key={style.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(style.value)}
              className={[
                'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'bg-brand border-transparent text-white shadow-sm shadow-primary/30'
                  : 'border-border bg-white text-text-primary hover:border-primary/50 hover:bg-surface',
              ].join(' ')}
            >
              {style.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
