import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePresentation } from '@/lib/pptx-generator';
import type { SlideData } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slideSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  content: z.array(z.string()),
  imageKeywords: z.array(z.string()),
  speakerNotes: z.string(),
  imageUrl: z.string().optional(),
  style: z
    .object({
      accentColor: z.string().optional(),
      textColor: z.string().optional(),
      background: z.string().optional(),
      align: z.enum(['left', 'center']).optional(),
      bold: z.boolean().optional(),
    })
    .optional(),
});

const schema = z.object({
  slides: z.array(slideSchema).min(1, 'No slides to export.'),
  paletteId: z.string().default('corporate-blue'),
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

  const { slides, paletteId } = parsed.data;

  try {
    const buffer = await generatePresentation(slides as SlideData[], paletteId);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const fileName = `Presentation_${timestamp}.pptx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return errorResponse('GENERATION_FAILED', "Couldn't build the PowerPoint file.", 500);
  }
}
