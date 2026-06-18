'use client';

import { useCallback, useState } from 'react';
import UploadZone from '@/components/UploadZone';
import PromptInput from '@/components/PromptInput';
import StyleSelector from '@/components/StyleSelector';
import SlideCountSelector from '@/components/SlideCountSelector';
import GenerateButton from '@/components/GenerateButton';
import LoadingScreen from '@/components/LoadingScreen';
import SuccessScreen from '@/components/SuccessScreen';
import ErrorMessage from '@/components/ErrorMessage';
import type { PresentationStyle, SlideCount } from '@/lib/types';

type AppState = 'idle' | 'loading' | 'success';

interface Result {
  blobUrl: string;
  fileName: string;
  slideCount: number;
  fileSizeBytes: number;
}

// Read a File into a base64 string (without the data: prefix).
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

const TIPS = [
  'Be specific — the clearer your input, the sharper your slides.',
  'Works with any content: research, reports, or a quick idea.',
  'Every deck includes real images and speaker notes.',
];

export default function Home() {
  const [state, setState] = useState<AppState>('idle');

  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<PresentationStyle>('business');
  const [selectedSlideCount, setSelectedSlideCount] = useState<SlideCount>('10');

  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setInputError(false);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      setError('Please upload a PDF or Word (.docx) file.');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setFileContent(base64);
      setFileName(file.name);
      // A file overrides any typed prompt to keep the request unambiguous.
      setPrompt('');
    } catch {
      setError('We could not read that file. Please try another.');
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setFileContent('');
    setFileName('');
  }, []);

  const handleGenerate = useCallback(async () => {
    const hasFile = Boolean(fileContent && fileName);
    const hasPrompt = prompt.trim().length > 0;

    if (!hasFile && !hasPrompt) {
      setInputError(true);
      setError('Please upload a file or describe your presentation.');
      return;
    }

    setError(null);
    setInputError(false);
    setState('loading');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: hasFile ? fileContent : undefined,
          fileName: hasFile ? fileName : undefined,
          prompt: hasPrompt ? prompt.trim() : undefined,
          style: selectedStyle,
          slideCount: selectedSlideCount,
        }),
      });

      if (!res.ok) {
        let message = 'We could not generate your presentation. Please try again.';
        try {
          const data = await res.json();
          if (data?.error?.message) message = data.error.message;
        } catch {
          /* non-JSON error body — keep default message */
        }
        setError(message);
        setState('idle');
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const slideCount = parseInt(
        res.headers.get('X-Slide-Count') ?? selectedSlideCount,
        10
      );
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const downloadName = match?.[1] ?? 'Presentation.pptx';

      setResult({
        blobUrl,
        fileName: downloadName,
        slideCount,
        fileSizeBytes: blob.size,
      });
      setState('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setState('idle');
    }
  }, [fileContent, fileName, prompt, selectedStyle, selectedSlideCount]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.blobUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [result]);

  const handleCreateAnother = useCallback(() => {
    if (result) URL.revokeObjectURL(result.blobUrl);
    setResult(null);
    setFileContent('');
    setFileName('');
    setPrompt('');
    setSelectedStyle('business');
    setSelectedSlideCount('10');
    setError(null);
    setInputError(false);
    setState('idle');
  }, [result]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Top bar — logo pinned top-left, help pinned top-right */}
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-brand flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-md shadow-primary/40">
            ✨
          </span>
          <div>
            <h1 className="text-gradient text-2xl font-bold tracking-tight sm:text-3xl">
              SlideGenius
            </h1>
            <p className="text-sm text-white/60">AI Presentation Maker</p>
          </div>
        </div>
        <a
          href="https://github.com/vandanvlog/SlideGenius"
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
          aria-label="Help"
        >
          ?
        </a>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-2">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40">
        <div className="bg-brand h-1.5 w-full" />
        <div className="p-6">
        {state === 'loading' && <LoadingScreen />}

        {state === 'success' && result && (
          <SuccessScreen
            fileName={result.fileName}
            slideCount={result.slideCount}
            fileSizeBytes={result.fileSizeBytes}
            onDownload={handleDownload}
            onCreateAnother={handleCreateAnother}
          />
        )}

        {state === 'idle' && (
          <div className="flex flex-col gap-6">
            <UploadZone
              fileName={fileName}
              onFileSelect={handleFileSelect}
              onClear={handleClearFile}
            />

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                or
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <PromptInput
              value={prompt}
              onChange={(v) => {
                setPrompt(v);
                if (inputError) setInputError(false);
              }}
              error={inputError}
            />

            <StyleSelector value={selectedStyle} onChange={setSelectedStyle} />
            <SlideCountSelector
              value={selectedSlideCount}
              onChange={setSelectedSlideCount}
            />

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

            <GenerateButton onClick={handleGenerate} />

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold text-text-primary">Tips</p>
              <ul className="space-y-1">
                {TIPS.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm text-text-muted">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        </div>
        </div>

        <footer className="mt-6 text-center text-xs text-white/40">
          Built with Next.js, Claude, and Unsplash.
        </footer>
      </div>
    </main>
  );
}
