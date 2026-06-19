'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PALETTES,
  getRoles,
  getPaletteById,
  DEFAULT_PALETTE_ID,
} from '@/lib/palettes';
import { legibleTextOn } from '@/lib/slide-templates';

interface PalettePickerProps {
  open: boolean;
  selectedId: string | null;
  onUse: (id: string) => void;
  onClose: () => void;
}

function SampleSlide({ paletteId }: { paletteId: string }) {
  const palette = getPaletteById(paletteId) ?? getPaletteById(DEFAULT_PALETTE_ID)!;
  const roles = getRoles(palette);

  return (
    <div
      className="flex aspect-video w-full overflow-hidden rounded-lg border border-border shadow-md"
      style={{ backgroundColor: roles.background }}
    >
      {/* left accent bar = primary */}
      <div className="w-2.5 shrink-0" style={{ backgroundColor: roles.primary }} />
      <div className="flex flex-1 items-center gap-4 p-4">
        <div className="flex-1">
          <h4 className="text-base font-bold leading-tight" style={{ color: roles.primary }}>
            Sample slide title
          </h4>
          <p className="mt-1 text-xs leading-snug" style={{ color: roles.text }}>
            Body text uses the darkest colour so it stays readable on the
            background.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: roles.secondary }}>
            Sub-header in the secondary colour.
          </p>
        </div>
        {/* highlighted stat box = accent */}
        <div
          className="flex h-16 w-20 flex-col items-center justify-center rounded-md"
          style={{ backgroundColor: roles.accent }}
        >
          <span
            className="text-lg font-bold leading-none"
            style={{ color: legibleTextOn(roles.accent) }}
          >
            87%
          </span>
          <span
            className="mt-0.5 text-[9px] leading-tight"
            style={{ color: legibleTextOn(roles.accent) }}
          >
            key stat
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PalettePicker({
  open,
  selectedId,
  onUse,
  onClose,
}: PalettePickerProps) {
  const [tempId, setTempId] = useState(selectedId ?? DEFAULT_PALETTE_ID);
  const [filter, setFilter] = useState('');

  // Reset working selection each time the overlay opens.
  useEffect(() => {
    if (open) {
      setTempId(selectedId ?? DEFAULT_PALETTE_ID);
      setFilter('');
    }
  }, [open, selectedId]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? PALETTES.filter((p) => p.name.toLowerCase().includes(q)) : PALETTES;
  }, [filter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Choose a colour scheme
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-field hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Two-pane body: compact sample + filter (left), scrollable grid (right) */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left — sample + filter */}
          <div className="shrink-0 border-b border-border p-4 md:w-[40%] md:border-b-0 md:border-r">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
              Live preview
            </p>
            <SampleSlide paletteId={tempId} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter palettes by name…"
              className="mt-3 w-full rounded-lg border border-border bg-field px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-2 text-xs text-text-muted">
              Selected: <span className="text-text-primary">{getPaletteById(tempId)?.name}</span>
            </p>
          </div>

          {/* Right — scrollable grid */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {filtered.map((p) => {
                const selected = p.id === tempId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTempId(p.id)}
                    className={[
                      'overflow-hidden rounded-lg border-2 text-left transition-colors',
                      selected
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-border hover:border-primary/50',
                    ].join(' ')}
                  >
                    <div className="flex h-12 w-full">
                      {p.colors.map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="bg-field px-2 py-1.5 text-xs font-medium text-text-primary">
                      {p.name}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-text-muted">
                  No palettes match “{filter}”.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-field px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onUse(tempId);
                onClose();
              }}
              className="bg-brand rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/40 transition-all hover:brightness-110"
            >
              Use this palette
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
