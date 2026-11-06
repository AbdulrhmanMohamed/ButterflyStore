import { NextResponse } from "next/server";
import { products } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = products.list(1000);
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}
