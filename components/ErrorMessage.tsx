'use client';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-error/40 bg-error/5 p-4">
      <span className="mt-0.5 text-lg" aria-hidden>
        ⚠️
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-error">Something went wrong</p>
        <p className="mt-0.5 text-sm text-text-muted">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm font-semibold text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
