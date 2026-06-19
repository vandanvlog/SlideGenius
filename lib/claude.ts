import Anthropic from '@anthropic-ai/sdk';
import type { SlideOutline, SlideType, SlideStyle } from './types';

// Current Sonnet-tier model. (The spec's "claude-3-5-sonnet" was retired
// 2025-10-28; this is the official replacement.)
const MODEL = 'claude-sonnet-4-6';

const VALID_TYPES: SlideType[] = [
  'title',
  'content',
  'stats',
  'image_focus',
  'quote',
  'process',
  'comparison',
  'section',
  'closing',
];

const SYSTEM_PROMPT = `You are a professional presentation designer and content strategist. Analyze the user's input and generate a structured slide outline for a PowerPoint presentation.

Consider:
1. Presentation type (school, business, fun) to guide tone and depth
2. Slide count to pace the content
3. Variety — use different slide types so the deck stays visually interesting

For each slide choose a "type" from: title, content, stats, image_focus, quote, process, comparison, section, closing.

Rules per type:
- "title": opening slide. content = [one subtitle line].
- "content": 3-5 concise bullet points.
- "stats": 3-4 items, EACH formatted exactly as "VALUE :: Label" (e.g. "1.2M :: Peak circulation"). Keep VALUE short.
- "image_focus": a strong visual slide. content = [one short caption/description].
- "quote": content = [the quote text, then an attribution line].
- "process"/"comparison": 3-5 bullet points.
- "section": a divider. content = [one short line].
- "closing": a wrap-up / thank-you. content = [one closing line, optionally a call to action].

Match tone to type:
- school: educational, structured, simple language
- business: professional, data-driven, formal
- fun: engaging, creative, casual language

Constraints:
- title: max 60 characters
- imageKeywords: 2-3 short keywords for image search
- speakerNotes: 1-2 sentences

OPTIONAL per-slide "style" object — include it ONLY when the user explicitly asks for specific colors or text styling (otherwise omit it entirely):
- accentColor: hex like "#2563EB" — recolors the slide's accent (title bar, cover background, bullets, stat cards)
- textColor: hex — title/body text color
- background: hex — slide background color
- align: "left" or "center"
- bold: true or false
Use real 6-digit hex codes for any color the user names (e.g. blue -> "#2563EB", green -> "#16A34A", red -> "#DC2626", dark -> "#1F2937").

Return ONLY valid JSON — no markdown, no code fences, no commentary. Shape:
{"slides":[{"number":1,"type":"title","title":"...","content":["..."],"imageKeywords":["...","..."],"speakerNotes":"...","style":{"accentColor":"#2563EB"}}]}`;

// Strip optional code fences and isolate the outermost JSON object.
function extractJson(raw: string): string {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('SERVER_MISCONFIGURED');
  return new Anthropic({ apiKey });
}

function normalizeType(type: unknown): SlideType {
  return VALID_TYPES.includes(type as SlideType) ? (type as SlideType) : 'content';
}

// Accept "#RRGGBB" or "RRGGBB"; return normalized "#RRGGBB" or undefined.
function normalizeHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const m = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return m ? `#${m[1].toUpperCase()}` : undefined;
}

function normalizeStyle(raw: unknown): SlideStyle | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const style: SlideStyle = {};
  const accent = normalizeHex(r.accentColor);
  const text = normalizeHex(r.textColor);
  const bg = normalizeHex(r.background);
  if (accent) style.accentColor = accent;
  if (text) style.textColor = text;
  if (bg) style.background = bg;
  if (r.align === 'left' || r.align === 'center') style.align = r.align;
  if (typeof r.bold === 'boolean') style.bold = r.bold;
  return Object.keys(style).length > 0 ? style : undefined;
}

function normalizeSlide(raw: Record<string, unknown>, index: number): SlideOutline {
  return {
    number: typeof raw.number === 'number' ? raw.number : index + 1,
    type: normalizeType(raw.type),
    title: String(raw.title ?? 'Untitled'),
    content: Array.isArray(raw.content) ? raw.content.map(String) : [],
    imageKeywords: Array.isArray(raw.imageKeywords)
      ? raw.imageKeywords.map(String)
      : [],
    speakerNotes: String(raw.speakerNotes ?? ''),
    style: normalizeStyle(raw.style),
  };
}

/**
 * Generate a full slide outline. Throws Error('SERVER_MISCONFIGURED' | 'GENERATION_FAILED').
 */
export async function generateSlides(
  content: string,
  presentationType: string,
  slideCount: number,
  hasCustomImages: boolean
): Promise<SlideOutline[]> {
  const anthropic = client();

  const userMessage = `User has requested a ${slideCount}-slide presentation.

Description / source content:
"""
${content}
"""

Presentation type: ${presentationType}
${
  hasCustomImages
    ? 'The user will supply their own images in order, so imageKeywords are only a fallback.'
    : 'No custom images — provide good imageKeywords for each slide.'
}

Produce exactly ${slideCount} slides with variety in slide types. Start with a "title" slide and end with a "closing" slide.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    );
    if (!textBlock) throw new Error('GENERATION_FAILED');

    const parsed = JSON.parse(extractJson(textBlock.text)) as {
      slides?: Record<string, unknown>[];
    };
    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      throw new Error('GENERATION_FAILED');
    }

    return parsed.slides.map((s, i) => normalizeSlide(s, i));
  } catch (err) {
    if (err instanceof Error && err.message === 'SERVER_MISCONFIGURED') throw err;
    throw new Error('GENERATION_FAILED');
  }
}

/**
 * Regenerate a single slide based on user feedback. Returns the updated outline.
 */
export async function refineSlide(
  slide: SlideOutline,
  feedback: string,
  presentationType: string
): Promise<SlideOutline> {
  const anthropic = client();

  const userMessage = `Here is one slide from a "${presentationType}" presentation, as JSON:
${JSON.stringify(slide)}

The user wants this change:
"""
${feedback}
"""

Apply the feedback and return the UPDATED slide as a single JSON object with the same shape (number, type, title, content, imageKeywords, speakerNotes, and optionally "style"). You may change the "type" if the feedback calls for it.

IMPORTANT: If the feedback mentions colors, text color, background, alignment, or bold/emphasis, set the matching fields in a "style" object (accentColor / textColor / background as hex codes, align as "left"|"center", bold as true/false). Preserve any existing style fields the user did not ask to change. Return ONLY the JSON object — no markdown, no commentary.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    );
    if (!textBlock) throw new Error('GENERATION_FAILED');

    const parsed = JSON.parse(extractJson(textBlock.text)) as Record<string, unknown>;
    // Some responses wrap the slide as { slide: {...} } or { slides: [...] }.
    const obj = (parsed.slide as Record<string, unknown>) ??
      (Array.isArray(parsed.slides) ? (parsed.slides[0] as Record<string, unknown>) : parsed);

    const updated = normalizeSlide(obj, slide.number - 1);
    updated.number = slide.number; // preserve position
    return updated;
  } catch (err) {
    if (err instanceof Error && err.message === 'SERVER_MISCONFIGURED') throw err;
    throw new Error('GENERATION_FAILED');
  }
}
