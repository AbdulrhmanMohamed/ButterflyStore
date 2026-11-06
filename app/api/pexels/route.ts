import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const page = req.nextUrl.searchParams.get("page") || "1";
  const per_page = req.nextUrl.searchParams.get("per_page") || "20";

  if (!q) return NextResponse.json({ photos: [], total_results: 0 });

  const key = process.env.PEXELS_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing PEXELS_API_KEY" }, { status: 500 });

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return NextResponse.json({ photos: [], total_results: 0 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ photos: [], total_results: 0 });
  }
}
