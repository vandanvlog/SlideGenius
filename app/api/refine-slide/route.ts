import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { refineSlide } from '@/lib/claude';
import { fetchImageUrl } from '@/lib/unsplash';
import type { SlideData, SlideOutline } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const styleSchema = z
  .object({
    accentColor: z.string().optional(),
    textColor: z.string().optional(),
    background: z.string().optional(),
    align: z.enum(['left', 'center']).optional(),
    bold: z.boolean().optional(),
  })
  .optional();

const slideSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  content: z.array(z.string()),
  imageKeywords: z.array(z.string()),
  speakerNotes: z.string(),
  imageUrl: z.string().optional(),
  style: styleSchema,
});

const schema = z.object({
  slide: slideSchema,
  feedback: z.string().min(1, 'Tell me what to change.'),
  presentationType: z.string().default('business'),
  newImage: z.string().optional(), // data URL for a user-supplied image
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

  const { slide, feedback, presentationType, newImage } = parsed.data;

  try {
    const outline: SlideOutline = {
      number: slide.id,
      type: slide.type as SlideOutline['type'],
      title: slide.title,
      content: slide.content,
      imageKeywords: slide.imageKeywords,
      speakerNotes: slide.speakerNotes,
      style: slide.style,
    };

    let updated: SlideOutline;
    try {
      updated = await refineSlide(outline, feedback, presentationType);
    } catch (err) {
      if (err instanceof Error && err.message === 'SERVER_MISCONFIGURED') {
        return errorResponse('SERVER_MISCONFIGURED', 'Server misconfigured.', 500);
      }
      return errorResponse('GENERATION_FAILED', "Couldn't refine that slide. Try again.", 500);
    }

    // Decide the image:
    // 1. A newly uploaded image wins.
    // 2. Keep an existing user-uploaded image (data URL).
    // 3. Otherwise re-fetch from Unsplash with the (possibly new) keywords.
    let imageUrl = slide.imageUrl ?? '';
    if (newImage) {
      imageUrl = newImage;
    } else if (imageUrl.startsWith('data:')) {
      // keep the user's custom image
    } else {
      imageUrl = await fetchImageUrl(updated.imageKeywords).catch(() => '');
    }

    const updatedSlide: SlideData = {
      id: slide.id,
      type: updated.type,
      title: updated.title,
      content: updated.content,
      imageKeywords: updated.imageKeywords,
      speakerNotes: updated.speakerNotes,
      imageUrl,
      // Merge: keep prior style fields the model didn't re-specify.
      style: { ...slide.style, ...updated.style },
    };

    return NextResponse.json({ success: true, updatedSlide });
  } catch {
    return errorResponse('GENERATION_FAILED', 'Something went wrong. Please try again.', 500);
  }
}
