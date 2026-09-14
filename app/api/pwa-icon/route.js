import { NextResponse } from "next/server";
import { makeBuyWaterPng } from "@/lib/pngIcon";

export const dynamic = "force-static";
export const revalidate = 86400;

const ALLOWED = new Set([48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512]);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let size = Number(searchParams.get("size") || 512);
  if (!ALLOWED.has(size)) size = 512;
  const png = makeBuyWaterPng(size);
  return new NextResponse(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
