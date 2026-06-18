import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseFile } from '@/lib/file-parser';
import { generateOutline } from '@/lib/claude';
import { fetchImageUrl } from '@/lib/unsplash';
import { generatePresentation, type SlideWithImage } from '@/lib/pptx-generator';
import type { ApiErrorCode } from '@/lib/types';

// PDF/DOCX parsing + PPT generation need the Node runtime (not Edge).
export const runtime = 'nodejs';
// Generation can take a while; allow up to 60s on platforms that honor this.
export const maxDuration = 60;

const requestSchema = z
  .object({
    fileContent: z.string().optional(),
    fileName: z.string().optional(),
    prompt: z.string().optional(),
    style: z
      .enum(['academic', 'business', 'creative', 'legal'])
      .default('business'),
    slideCount: z.enum(['5', '10', '15', '20']).default('10'),
  })
  .refine((data) => Boolean(data.fileContent) || Boolean(data.prompt), {
    message: 'Either a file or a prompt is required.',
  })
  .refine(
    (data) =>
      !data.fileContent ||
      (data.fileName
        ? /\.(pdf|docx)$/i.test(data.fileName)
        : false),
    {
      message: 'Uploaded file must be a .pdf or .docx and include a filename.',
    }
  );

function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export async function POST(req: NextRequest) {
  // 1. Parse + validate input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('INVALID_INPUT', 'Request body must be valid JSON.', 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.';
    return errorResponse('INVALID_INPUT', message, 400);
  }

  const { fileContent, fileName, prompt, style, slideCount } = parsed.data;

  try {
    // 2. Resolve source content (file takes precedence over prompt)
    let content: string;
    if (fileContent && fileName) {
      try {
        content = await parseFile(fileContent, fileName);
      } catch {
        return errorResponse(
          'INVALID_FILE',
          "We couldn't read that file. Please upload a valid PDF or Word (.docx) document.",
          400
        );
      }
    } else {
      content = prompt!.trim();
    }

    if (!content) {
      return errorResponse(
        'INVALID_INPUT',
        'No usable content was found. Try a different file or prompt.',
        400
      );
    }

    // 3. Generate the outline with Claude
    let slides;
    try {
      slides = await generateOutline(content, style, parseInt(slideCount, 10));
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

    // 4. Fetch images in parallel (graceful — failures yield empty strings)
    const imageResults = await Promise.allSettled(
      slides.map((slide) => fetchImageUrl(slide.imageKeywords))
    );
    const slidesWithImages: SlideWithImage[] = slides.map((slide, i) => ({
      ...slide,
      imageUrl:
        imageResults[i].status === 'fulfilled' ? imageResults[i].value : '',
    }));

    // 5. Build the PowerPoint
    let buffer: Buffer;
    try {
      buffer = await generatePresentation(slidesWithImages);
    } catch {
      return errorResponse(
        'GENERATION_FAILED',
        "We couldn't assemble the PowerPoint file. Please try again.",
        500
      );
    }

    // 6. Stream the file back
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const fileNameOut = `Presentation_${timestamp}.pptx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileNameOut}"`,
        'X-Slide-Count': String(slides.length),
      },
    });
  } catch {
    return errorResponse(
      'GENERATION_FAILED',
      'Something went wrong while generating your presentation. Please try again.',
      500
    );
  }
}
