export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsSearchResult {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

export async function searchPexels(
  query: string,
  page = 1,
  perPage = 20
): Promise<PexelsSearchResult> {
  const res = await fetch(
    `/api/pexels?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
  );
  if (!res.ok) return { photos: [], total_results: 0, page, per_page: perPage };
  return res.json();
}
