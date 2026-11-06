export const CLOUDINARY_CLOUD = "w80ziw3i";
export const CLOUDINARY_FOLDER = "scarf-store";
export const CLOUDINARY_API_KEY = "674471489383227";
export const CLOUDINARY_API_SECRET = "Q2ge60UiH57StwOIc8QTw1Hu2cw";

export function productImageUrl(
  publicId: string,
  version?: number,
  format = "jpg"
) {
  if (publicId.startsWith("http") || publicId.startsWith("/")) return publicId;
  const v = version ? `v${version}/` : "";
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${v}${publicId}.${format}`;
}

export async function fetchMediaList(): Promise<
  { name: string; url: string; path: string; createdTime: string }[]
> {
  try {
    const res = await fetch(
      `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/list/${CLOUDINARY_FOLDER}.json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.resources?.length) return [];
    return data.resources
      .filter((r: any) => (r.public_id || "").startsWith(`${CLOUDINARY_FOLDER}/`))
      .map((r: any) => ({
        name: r.public_id.replace(`${CLOUDINARY_FOLDER}/`, ""),
        url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/v${r.version}/${r.public_id}.${r.format}`,
        path: r.public_id,
        createdTime: r.created_at,
      }));
  } catch {
    return [];
  }
}
