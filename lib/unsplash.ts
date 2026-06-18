// Fetch a single relevant image URL from Unsplash for a set of keywords.
// Designed to fail gracefully: any error or timeout returns '' so that
// presentation generation can continue without an image.

const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';
const TIMEOUT_MS = 2000;

interface UnsplashSearchResponse {
  results?: Array<{
    urls?: {
      regular?: string;
    };
  }>;
}

export async function fetchImageUrl(keywords: string[]): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    // Image enrichment is optional — no key just means no images.
    return '';
  }

  const query = keywords.filter(Boolean).join(' ').trim();
  if (!query) {
    return '';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: controller.signal,
    });

    if (!res.ok) {
      return '';
    }

    const data = (await res.json()) as UnsplashSearchResponse;
    return data.results?.[0]?.urls?.regular ?? '';
  } catch {
    // Timeout, network error, or bad JSON — degrade gracefully.
    return '';
  } finally {
    clearTimeout(timeout);
  }
}
