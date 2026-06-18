'use client';

interface GenerateButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function GenerateButton({
  onClick,
  loading,
  disabled,
}: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="bg-brand flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all duration-200 hover:shadow-lg hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Generating…
        </>
      ) : (
        'Generate Presentation'
      )}
    </button>
  );
}
