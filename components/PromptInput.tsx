'use client';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function PromptInput({
  value,
  onChange,
  disabled,
  error,
}: PromptInputProps) {
  return (
    <div>
      <label
        htmlFor="prompt"
        className="mb-2 block text-sm font-semibold text-text-primary"
      >
        Describe your presentation
      </label>
      <textarea
        id="prompt"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your presentation… e.g. “Create a deck on 2026 AI trends for a business audience.”"
        rows={4}
        className={[
          'w-full resize-y rounded-lg border bg-surface px-4 py-3 text-base leading-relaxed text-text-primary',
          'placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-error' : 'border-border',
        ].join(' ')}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error">
          Please upload a file or describe your presentation to continue.
        </p>
      )}
    </div>
  );
}
