import Anthropic from '@anthropic-ai/sdk';
import type { SlideOutline } from './types';

// Current Sonnet-tier model. The spec referenced "claude-3-5-sonnet", which was
// retired on 2025-10-28; claude-sonnet-4-6 is Anthropic's official drop-in
// replacement (same tier — fast and cost-effective). Change this one string to
// use a different model.
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are a professional presentation designer. Given content and a style, generate a structured slide outline in JSON format.

Return ONLY valid JSON — no markdown, no code fences, no commentary before or after. The JSON must be an object with a "slides" array. Each slide object must have exactly these keys:
- "title": a concise slide title, max 60 characters
- "bulletPoints": an array of 3-5 strings, each max 80 characters
- "speakerNotes": 1-2 sentences of speaker notes (string)
- "imageKeywords": an array of exactly 3 short keywords for image search

Tailor tone and structure to the requested style:
- academic: rigorous, citation-minded, structured argument
- business: outcome-focused, data-driven, executive tone
- creative: vivid, narrative, energetic
- legal: precise, formal, risk-aware`;

// Strip optional ```json ... ``` fences and grab the outermost JSON object so we
// tolerate any stray prose the model might wrap around the payload.
function extractJson(raw: string): string {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

/**
 * Generate a slide outline from arbitrary content using Claude.
 * Throws an Error with code 'SERVER_MISCONFIGURED' or 'GENERATION_FAILED'.
 */
export async function generateOutline(
  content: string,
  style: string,
  slideCount: number
): Promise<SlideOutline[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('SERVER_MISCONFIGURED');
  }

  const client = new Anthropic({ apiKey });

  const userMessage = `Create a ${slideCount}-slide presentation outline in the "${style}" style.

Base it on the following content:
"""
${content}
"""

Produce exactly ${slideCount} slides.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    if (!textBlock) {
      throw new Error('GENERATION_FAILED');
    }

    const parsed = JSON.parse(extractJson(textBlock.text)) as {
      slides?: SlideOutline[];
    };
    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      throw new Error('GENERATION_FAILED');
    }

    // Normalize defensively so downstream PPT generation never sees undefined.
    return parsed.slides.map((slide) => ({
      title: String(slide.title ?? 'Untitled'),
      bulletPoints: Array.isArray(slide.bulletPoints)
        ? slide.bulletPoints.map(String)
        : [],
      speakerNotes: String(slide.speakerNotes ?? ''),
      imageKeywords: Array.isArray(slide.imageKeywords)
        ? slide.imageKeywords.map(String)
        : [],
    }));
  } catch (err) {
    // Re-throw our own coded errors untouched; wrap everything else.
    if (err instanceof Error && err.message === 'SERVER_MISCONFIGURED') {
      throw err;
    }
    throw new Error('GENERATION_FAILED');
  }
}
