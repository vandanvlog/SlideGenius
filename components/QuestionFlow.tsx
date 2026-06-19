'use client';

import FileUpload from './FileUpload';
import { PRESENTATION_TYPES } from '@/lib/color-schemes';

interface QuestionFlowProps {
  presentationType: string;
  otherText: string;
  onSelectType: (t: string) => void;
  onOtherText: (s: string) => void;
  slideCount: number | null;
  onSelectCount: (n: number) => void;
  hasCustomImages: boolean | null;
  onSelectCustom: (b: boolean) => void;
  customImages: File[];
  onCustomImages: (f: File[]) => void;
  disabled: boolean;
}

const pill = (selected: boolean) =>
  [
    'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    selected
      ? 'bg-brand border-transparent text-white shadow-sm shadow-primary/30'
      : 'border-border bg-field text-text-primary hover:border-primary/50',
  ].join(' ');

const isPreset = (t: string) => ['school', 'business', 'fun'].includes(t);

export default function QuestionFlow({
  presentationType,
  otherText,
  onSelectType,
  onOtherText,
  slideCount,
  onSelectCount,
  hasCustomImages,
  onSelectCustom,
  customImages,
  onCustomImages,
  disabled,
}: QuestionFlowProps) {
  const typeChosen = presentationType !== '';
  const countChosen = slideCount !== null;

  return (
    <div className="flex flex-col gap-5">
      {/* Q1 — type */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">
          What is this presentation for?
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PRESENTATION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelectType(t.value)}
              className={pill(presentationType === t.value)}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={otherText}
          disabled={disabled}
          onChange={(e) => {
            onOtherText(e.target.value);
            onSelectType(e.target.value.trim() ? 'other' : '');
          }}
          placeholder="Or type something else…"
          className={[
            'mt-2 w-full rounded-lg border bg-field px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50',
            presentationType === 'other' ? 'border-primary' : 'border-border',
          ].join(' ')}
        />
      </div>

      {/* Q2 — count */}
      {typeChosen && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">
            How many slides?
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onSelectCount(n)}
                className={pill(slideCount === n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q3 — custom images */}
      {typeChosen && countChosen && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">
            Do you have specific images for this presentation?
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectCustom(true)}
              className={pill(hasCustomImages === true)}
            >
              ✅ Yes, I&apos;ll upload them
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectCustom(false)}
              className={pill(hasCustomImages === false)}
            >
              ❌ No, use related images
            </button>
          </div>

          {hasCustomImages === true && (
            <div className="mt-3">
              <FileUpload
                accept="image/*"
                multiple
                files={customImages}
                onChange={onCustomImages}
                disabled={disabled}
                hint="Upload in order — 1st image → slide 1, 2nd → slide 2, etc."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
