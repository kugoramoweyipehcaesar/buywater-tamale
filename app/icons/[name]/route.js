import { NextResponse } from "next/server";
import { makeBuyWaterPng } from "@/lib/pngIcon";

export const dynamic = "force-static";
export const revalidate = 86400;

/** Serves /icons/icon-192.png etc. as real PNG for PWABuilder */
export async function GET(_request, { params }) {
  const name = (params?.name || "").toString();
  const match = name.match(/^(?:icon|maskable)-(\d+)\.png$/i);
  let size = 512;
  if (match) size = Number(match[1]);
  if (![48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512].includes(size)) {
    size = 512;
  }
  const png = makeBuyWaterPng(size);
  return new NextResponse(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
