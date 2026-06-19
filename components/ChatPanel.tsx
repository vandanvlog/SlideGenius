'use client';

import { useRef, useState } from 'react';
import QuestionFlow from './QuestionFlow';
import ErrorMessage from './ErrorMessage';
import PalettePicker from './PalettePicker';
import { fileToBase64, fileToDataUrl, MAX_FILE_BYTES } from '@/lib/client-files';
import { PRESENTATION_TYPES } from '@/lib/color-schemes';
import { getPaletteById, DEFAULT_PALETTE_ID } from '@/lib/palettes';

export interface GeneratePayload {
  description: string;
  presentationType: string;
  presentationTypeLabel: string;
  slideCount: number;
  hasCustomImages: boolean;
  customImageDataUrls: string[];
  attachedFiles: { name: string; content: string }[];
  paletteId: string;
}

interface ChatPanelProps {
  isLoading: boolean;
  error: string | null;
  onGenerate: (payload: GeneratePayload) => void;
}

export default function ChatPanel({
  isLoading,
  error,
  onGenerate,
}: ChatPanelProps) {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [started, setStarted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [presentationType, setPresentationType] = useState('');
  const [otherText, setOtherText] = useState('');
  const [slideCount, setSlideCount] = useState<number | null>(null);
  const [hasCustomImages, setHasCustomImages] = useState<boolean | null>(null);
  const [customImages, setCustomImages] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  const busy = isLoading || preparing;

  const canContinue = description.trim().length > 0 || files.length > 0;
  const ready =
    canContinue &&
    presentationType !== '' &&
    slideCount !== null &&
    hasCustomImages !== null;

  const typeLabel =
    PRESENTATION_TYPES.find((t) => t.value === presentationType)?.label ??
    (presentationType === 'other' ? otherText || 'Custom' : presentationType);

  const addDocs = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter(
      (f) => /\.(pdf|docx)$/i.test(f.name) && f.size <= MAX_FILE_BYTES
    );
    if (accepted.length > 0) setFiles((prev) => [...prev, ...accepted]);
  };

  const removeDoc = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleGenerate = async () => {
    if (!ready || slideCount === null || hasCustomImages === null) return;
    setPreparing(true);
    try {
      const attachedFiles = await Promise.all(
        files.map(async (f) => ({ name: f.name, content: await fileToBase64(f) }))
      );
      const customImageDataUrls = hasCustomImages
        ? await Promise.all(customImages.map((f) => fileToDataUrl(f)))
        : [];
      const resolvedType =
        presentationType === 'other' ? otherText.trim() || 'other' : presentationType;

      onGenerate({
        description: description.trim(),
        presentationType: resolvedType,
        presentationTypeLabel: typeLabel,
        slideCount,
        hasCustomImages,
        customImageDataUrls,
        attachedFiles,
        paletteId: paletteId ?? DEFAULT_PALETTE_ID,
      });
    } finally {
      setPreparing(false);
    }
  };

  // ---- Input + questions view (single composer) ----
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">
          What can I help you present?
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Describe your deck (attach a PDF or Word doc if you like) and I&apos;ll build it slide by slide.
        </p>
      </div>

      {/* Composer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) addDocs(e.dataTransfer.files);
        }}
        className={[
          'rounded-2xl border bg-surface shadow-xl shadow-black/30 transition-colors',
          dragging ? 'border-primary' : 'border-border focus-within:border-primary/60',
        ].join(' ')}
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          rows={3}
          placeholder="Describe your presentation… e.g. “A deck on 2026 AI trends for a business audience.”"
          className="w-full resize-none rounded-2xl bg-transparent px-4 pt-4 text-sm leading-relaxed text-text-primary placeholder:text-text-subtle focus:outline-none disabled:opacity-50"
        />

        {/* Attached file chips */}
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-4 pb-1">
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-field px-2.5 py-1 text-xs text-text-primary"
              >
                <span>📄</span>
                <span className="max-w-[12rem] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeDoc(file.name)}
                  disabled={busy}
                  className="text-text-subtle hover:text-error"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Composer toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-field hover:text-text-primary disabled:opacity-50"
            >
              <span className="text-base">📎</span> Attach
            </button>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={(e) => addDocs(e.target.files)}
            />

            {paletteId ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-text-primary">
                <span className="text-base">🎨</span>
                <span className="max-w-[10rem] truncate">
                  {getPaletteById(paletteId)?.name ?? 'Palette'}
                </span>
                <button
                  type="button"
                  onClick={() => setPaletteId(null)}
                  disabled={busy}
                  className="text-text-subtle hover:text-error"
                  aria-label="Clear colour scheme"
                >
                  ✕
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowPalette(true)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-field hover:text-text-primary disabled:opacity-50"
              >
                <span className="text-base">🎨</span> Choose colour scheme
              </button>
            )}
          </div>

          {!started && (
            <button
              type="button"
              disabled={!canContinue || busy}
              onClick={() => setStarted(true)}
              className="bg-brand flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white shadow-sm shadow-primary/40 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue →
            </button>
          )}
        </div>
      </div>

      {/* Questions appear after Continue */}
      {started && (
        <div className="mt-6 flex flex-col gap-5">
          <QuestionFlow
            presentationType={presentationType}
            otherText={otherText}
            onSelectType={setPresentationType}
            onOtherText={setOtherText}
            slideCount={slideCount}
            onSelectCount={setSlideCount}
            hasCustomImages={hasCustomImages}
            onSelectCustom={setHasCustomImages}
            customImages={customImages}
            onCustomImages={setCustomImages}
            disabled={busy}
          />

          {error && <ErrorMessage message={error} />}

          <button
            type="button"
            disabled={!ready || busy}
            onClick={handleGenerate}
            className="bg-brand flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-md shadow-primary/40 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating…
              </>
            ) : (
              '✨ Generate Presentation'
            )}
          </button>
        </div>
      )}

      {/* Error before questions are shown */}
      {!started && error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <PalettePicker
        open={showPalette}
        selectedId={paletteId}
        onUse={(id) => setPaletteId(id)}
        onClose={() => setShowPalette(false)}
      />
    </div>
  );
}
