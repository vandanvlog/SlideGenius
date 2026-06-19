import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseFile } from '@/lib/file-parser';
import { generateSlides } from '@/lib/claude';
import { fetchImageUrl } from '@/lib/unsplash';
import type { SlideData } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z
  .object({
    description: z.string().optional().default(''),
    presentationType: z.string().default('business'),
    slideCount: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
    hasCustomImages: z.boolean().default(false),
    customImageCount: z.number().int().min(0).default(0),
    paletteId: z.string().optional(),
    attachedFiles: z
      .array(z.object({ name: z.string(), content: z.string() }))
      .optional()
      .default([]),
  })
  .refine((d) => d.description.trim().length > 0 || d.attachedFiles.length > 0, {
    message: 'Please describe your presentation or attach a file.',
  });

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_INPUT', 'Request body must be valid JSON.', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      'INVALID_INPUT',
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      400
    );
  }

  const { description, presentationType, slideCount, hasCustomImages, attachedFiles } =
    parsed.data;

  try {
    // 1. Build source content from description + any attached PDF/DOCX files.
    const parts: string[] = [];
    if (description.trim()) parts.push(description.trim());
    for (const file of attachedFiles) {
      if (/\.(pdf|docx)$/i.test(file.name)) {
        try {
          const text = await parseFile(file.content, file.name);
          if (text) parts.push(`From ${file.name}:\n${text}`);
        } catch {
          // Skip unreadable files but keep going.
        }
      }
    }
    const content = parts.join('\n\n').trim();
    if (!content) {
      return errorResponse(
        'INVALID_INPUT',
        'No usable content found. Add a description or a readable PDF/DOCX.',
        400
      );
    }

    // 2. Generate the outline.
    let outlines;
    try {
      outlines = await generateSlides(content, presentationType, slideCount, hasCustomImages);
    } catch (err) {
      if (err instanceof Error && err.message === 'SERVER_MISCONFIGURED') {
        return errorResponse(
          'SERVER_MISCONFIGURED',
          'The server is missing required configuration. Please contact the administrator.',
          500
        );
      }
      return errorResponse(
        'GENERATION_FAILED',
        "We couldn't generate your presentation. Please try again.",
        500
      );
    }

    // 3. Resolve images. Custom images are filled in by the client (it holds the
    //    uploaded data URLs); here we only fetch Unsplash when not using custom.
    let imageUrls: string[] = [];
    if (!hasCustomImages) {
      const results = await Promise.allSettled(
        outlines.map((o) => fetchImageUrl(o.imageKeywords))
      );
      imageUrls = results.map((r) => (r.status === 'fulfilled' ? r.value : ''));
    }

    const slides: SlideData[] = outlines.map((o, i) => ({
      id: o.number,
      type: o.type,
      title: o.title,
      content: o.content,
      imageKeywords: o.imageKeywords,
      speakerNotes: o.speakerNotes,
      imageUrl: hasCustomImages ? '' : imageUrls[i] ?? '',
      style: o.style,
    }));

    return NextResponse.json({ success: true, slides });
  } catch {
    return errorResponse('GENERATION_FAILED', 'Something went wrong. Please try again.', 500);
  }
}
