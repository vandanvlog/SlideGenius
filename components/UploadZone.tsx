'use client';

import { useRef, useState } from 'react';

interface UploadZoneProps {
  fileName: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ACCEPTED = '.pdf,.docx';

export default function UploadZone({
  fileName,
  onFileSelect,
  onClear,
  disabled,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFileSelect(files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={[
        'rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {fileName ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl" aria-hidden>
            📄
          </span>
          <p className="text-sm font-semibold text-text-primary">{fileName}</p>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="text-sm font-semibold text-error hover:underline disabled:opacity-50"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span
            className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 text-2xl"
            aria-hidden
          >
            📄
          </span>
          <p className="text-base font-semibold text-text-primary">
            {dragging ? 'Release to upload' : 'Drag a file here'}
          </p>
          <p className="text-sm text-text-muted">PDF or Word (.docx)</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Choose File
          </button>
        </div>
      )}
    </div>
  );
}
