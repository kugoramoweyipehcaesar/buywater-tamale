import { NextResponse } from "next/server";
import { makeBuyWaterPng, makeScreenshotPng } from "@/lib/pngIcon";

export const dynamic = "force-static";
export const revalidate = 86400;

/** Serves /icons/icon-192.png, maskable-*.png, screenshot-*.png */
export async function GET(_request, { params }) {
  const name = (params?.name || "").toString();

  if (name === "screenshot-narrow.png") {
    const png = makeScreenshotPng(1080, 1920);
    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
  if (name === "screenshot-wide.png") {
    const png = makeScreenshotPng(1920, 1080);
    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

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
