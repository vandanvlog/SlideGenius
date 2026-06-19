// Client-side helpers for reading File objects.

// Full data URL: "data:<mime>;base64,<data>" — used for images shown in the
// browser and embedded directly into the pptx.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

// Bare base64 (no data: prefix) — used for PDF/DOCX sent to the parser.
export async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
