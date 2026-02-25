type PexelsPhotoResponse = {
  photos?: Array<{
    src?: {
      large?: string;
      large2x?: string;
      medium?: string;
    };
  }>;
};

export async function getPexelsImageByQuery(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || !query.trim()) return null;

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) return null;
    const data = (await response.json()) as PexelsPhotoResponse;
    const first = data.photos?.[0];
    return first?.src?.large2x ?? first?.src?.large ?? first?.src?.medium ?? null;
  } catch {
    return null;
  }
}
