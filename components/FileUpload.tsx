'use client';

import { useRef, useState } from 'react';
import { MAX_FILE_BYTES } from '@/lib/client-files';

interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  hint?: string;
  disabled?: boolean;
}

export default function FileUpload({
  accept,
  multiple = false,
  files,
  onChange,
  hint,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter((f) => f.size <= MAX_FILE_BYTES);
    if (accepted.length === 0) return;
    onChange(multiple ? [...files, ...accepted] : [accepted[0]]);
  };

  const removeFile = (name: string) => {
    onChange(files.filter((f) => f.name !== name));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          'cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-field',
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="text-sm font-medium text-text-primary">
          📎 Drag files here or click to select
        </p>
        {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
      </div>

      {files.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-2 rounded-full border border-border bg-field px-3 py-1 text-xs text-text-primary"
            >
              <span className="max-w-[12rem] truncate">{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.name);
                }}
                disabled={disabled}
                className="text-text-subtle hover:text-error"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
