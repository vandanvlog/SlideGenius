// Extract plain text from an uploaded PDF or DOCX file (provided as base64).
// Throws an Error with code 'INVALID_FILE' for unsupported or unparseable files.

const MAX_CHARS = 10_000; // cap extracted text for speed / token control

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // Use the legacy build, which runs in Node without a browser worker.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Disable the worker — we run inline in the Node process.
  pdfjs.GlobalWorkerOptions.workerSrc = '';

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    // No worker available server-side; let pdf.js use its fake worker.
    disableFontFace: true,
  });

  const doc = await loadingTask.promise;
  let text = '';

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    text += pageText + '\n';
    if (text.length >= MAX_CHARS) break;
  }

  await doc.cleanup();
  return text.slice(0, MAX_CHARS).trim();
}

async function parseDocx(buffer: Buffer): Promise<string> {
  // `mammoth` extracts raw text from .docx. (The `docx` package only *creates*
  // Word files, so it can't be used for parsing.)
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value.slice(0, MAX_CHARS).trim();
}

export async function parseFile(
  fileContent: string,
  fileName: string
): Promise<string> {
  const ext = getExtension(fileName);
  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileContent, 'base64');
  } catch {
    throw new Error('INVALID_FILE');
  }

  try {
    let text: string;
    if (ext === 'pdf') {
      text = await parsePdf(buffer);
    } else if (ext === 'docx') {
      text = await parseDocx(buffer);
    } else {
      throw new Error('INVALID_FILE');
    }

    if (!text) {
      throw new Error('INVALID_FILE');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_FILE') {
      throw err;
    }
    throw new Error('INVALID_FILE');
  }
}
