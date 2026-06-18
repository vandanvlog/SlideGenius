# SlideGenius

AI-powered presentation maker. Turn a **PDF**, **Word document**, or a **text prompt** into a professional, downloadable **PowerPoint (.pptx)** — complete with structured slides, real royalty-free images, and speaker notes.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Claude, and the Unsplash API.

---

## How it works

1. Upload a PDF/DOCX or describe your deck in a prompt.
2. Pick a style (Academic / Business / Creative / Legal) and slide count (5 / 10 / 15 / 20).
3. The backend extracts your content, asks **Claude** for a structured outline, fetches matching images from **Unsplash**, and builds a `.pptx` with **pptxgenjs**.
4. Download your presentation.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| AI | `@anthropic-ai/sdk` — model `claude-sonnet-4-6` |
| Images | Unsplash API |
| PPT generation | `pptxgenjs` |
| File parsing | `pdfjs-dist` (PDF), `mammoth` (DOCX) |
| Validation | `zod` |

> **Model note:** the original spec referenced `claude-3-5-sonnet`, which Anthropic
> retired on 2025-10-28. This app uses **`claude-sonnet-4-6`**, the official
> drop-in replacement (same Sonnet tier). To change it, edit the `MODEL`
> constant in [`lib/claude.ts`](lib/claude.ts).
>
> **DOCX note:** the spec listed the `docx` package, but that library only
> *creates* Word files — it can't read them. DOCX text extraction uses
> **`mammoth`** instead.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
UNSPLASH_ACCESS_KEY=xxxxx
```

- **`ANTHROPIC_API_KEY`** — required. Get one at <https://console.anthropic.com>.
- **`UNSPLASH_ACCESS_KEY`** — optional but recommended. Get one at
  <https://unsplash.com/developers>. Without it, slides are generated without images.

> ⚠️ Never commit `.env.local`. It is already in `.gitignore`. Treat any leaked
> key as compromised and rotate it immediately.

### 3. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Project structure

```
app/
  api/generate/route.ts   # POST /api/generate — the full pipeline
  layout.tsx              # Root layout + global styles
  page.tsx                # Single-page app (idle / loading / success states)
lib/
  types.ts                # Shared TypeScript interfaces
  claude.ts               # Claude outline generation
  unsplash.ts             # Image lookup (graceful fallback)
  file-parser.ts          # PDF + DOCX text extraction
  pptx-generator.ts       # PowerPoint assembly
components/                # UI components (upload, selectors, screens, etc.)
```

---

## API

### `POST /api/generate`

Request body (JSON):

```jsonc
{
  "fileContent": "<base64>",   // optional — base64-encoded PDF/DOCX
  "fileName": "deck.pdf",       // required if fileContent is set (.pdf or .docx)
  "prompt": "AI trends 2026",   // optional — used if no file
  "style": "business",          // academic | business | creative | legal
  "slideCount": "10"            // 5 | 10 | 15 | 20
}
```

Either `fileContent` **or** `prompt` is required. On success, responds with the
binary `.pptx` (`Content-Disposition: attachment`). On failure, responds with
`{ success: false, error: { code, message } }` and an appropriate status code.

---

## Build & deploy

```bash
npm run build && npm start
```

To deploy on **Vercel**: push to GitHub, import the repo, and add
`ANTHROPIC_API_KEY` and `UNSPLASH_ACCESS_KEY` as environment variables in the
project settings.
