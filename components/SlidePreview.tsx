'use client';

/* eslint-disable @next/next/no-img-element */
import type { SlideData } from '@/lib/types';
import { resolveRoles, legibleTextOn, parseStat, COVER_TYPES } from '@/lib/slide-templates';

interface SlidePreviewProps {
  slide: SlideData;
  paletteId: string;
}

function ImageBox({
  url,
  keywords,
  placeholderBg,
  className,
}: {
  url?: string;
  keywords: string[];
  placeholderBg: string;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={keywords.join(' ') || 'slide image'}
        className={`h-full w-full object-contain ${className ?? ''}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1 text-center ${className ?? ''}`}
      style={{ backgroundColor: placeholderBg }}
    >
      <span className="text-2xl opacity-50">🖼️</span>
      <span className="px-2 text-[10px]" style={{ color: legibleTextOn(placeholderBg) }}>
        {keywords.slice(0, 2).join(' · ') || 'image'}
      </span>
    </div>
  );
}

export default function SlidePreview({ slide, paletteId }: SlidePreviewProps) {
  const roles = resolveRoles(paletteId);
  const st = slide.style ?? {};

  // Palette roles are the base; per-slide refine overrides win.
  const accent = st.accentColor || roles.primary; // title bar / cover / accent bar
  const text = st.textColor || roles.text;
  const bodyBg = st.background || roles.background;
  const coverBg = st.background || st.accentColor || roles.primary;
  const quoteBg = st.background || roles.background;
  const muted = roles.secondary;
  const center = st.align === 'center';
  const boldCls = st.bold ? 'font-semibold' : '';
  const statColors = st.accentColor
    ? [accent, accent, accent, accent]
    : [roles.accent, roles.secondary, roles.primary, roles.accent];

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border shadow-md">
      {COVER_TYPES.includes(slide.type) ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ backgroundColor: coverBg }}
        >
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl" style={{ color: legibleTextOn(coverBg) }}>
            {slide.title}
          </h2>
          {slide.content[0] && (
            <p className="text-sm sm:text-base" style={{ color: legibleTextOn(coverBg), opacity: 0.9 }}>
              {slide.content[0]}
            </p>
          )}
        </div>
      ) : slide.type === 'stats' ? (
        <div className="flex h-full w-full flex-col" style={{ backgroundColor: bodyBg }}>
          <div className="px-4 py-2 text-sm font-bold" style={{ backgroundColor: accent, color: legibleTextOn(accent) }}>
            {slide.title}
          </div>
          <div className="flex flex-1 items-center justify-center gap-3 p-4">
            {slide.content.slice(0, 4).map((item, i) => {
              const { value, label } = parseStat(item);
              const fill = statColors[i % statColors.length];
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-center rounded-lg p-2 text-center"
                  style={{ backgroundColor: fill }}
                >
                  <span className="text-lg font-bold leading-none sm:text-2xl" style={{ color: legibleTextOn(fill) }}>
                    {value}
                  </span>
                  <span className="mt-1 text-[10px] leading-tight" style={{ color: legibleTextOn(fill), opacity: 0.9 }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : slide.type === 'image_focus' ? (
        <div className="flex h-full w-full flex-col" style={{ backgroundColor: bodyBg }}>
          <div className="h-3/5 w-full">
            <ImageBox url={slide.imageUrl} keywords={slide.imageKeywords} placeholderBg={muted} />
          </div>
          <div className={`flex flex-1 flex-col justify-center px-4 ${center ? 'text-center' : ''}`}>
            <h3 className={`text-base leading-tight ${boldCls || 'font-bold'}`} style={{ color: text }}>
              {slide.title}
            </h3>
            {slide.content[0] && (
              <p className="text-xs" style={{ color: muted }}>
                {slide.content[0]}
              </p>
            )}
          </div>
        </div>
      ) : slide.type === 'quote' ? (
        <div className="flex h-full w-full items-center" style={{ backgroundColor: quoteBg }}>
          <div className="h-full w-2" style={{ backgroundColor: accent }} />
          <div className={`flex-1 px-6 ${center ? 'text-center' : ''}`}>
            <p className="text-lg font-bold italic leading-snug sm:text-xl" style={{ color: text }}>
              “{slide.content[0] ?? slide.title}”
            </p>
            {slide.content[1] && (
              <p className="mt-3 text-xs" style={{ color: muted }}>
                — {slide.content[1]}
              </p>
            )}
          </div>
        </div>
      ) : (
        // content / process / comparison (left text, right image)
        <div className="flex h-full w-full flex-col" style={{ backgroundColor: bodyBg }}>
          <div className="px-4 py-2 text-sm font-bold" style={{ backgroundColor: accent, color: legibleTextOn(accent) }}>
            {slide.title}
          </div>
          <div className="flex flex-1 gap-3 p-4">
            <ul
              className={[
                'flex flex-1 flex-col justify-center gap-1.5',
                center ? 'items-center text-center' : '',
              ].join(' ')}
            >
              {slide.content.map((point, i) => (
                <li key={i} className={`flex gap-2 text-xs leading-snug ${boldCls}`} style={{ color: text }}>
                  {!center && <span style={{ color: accent }}>•</span>}
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="h-full w-2/5 overflow-hidden rounded-lg">
              <ImageBox url={slide.imageUrl} keywords={slide.imageKeywords} placeholderBg={muted} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
