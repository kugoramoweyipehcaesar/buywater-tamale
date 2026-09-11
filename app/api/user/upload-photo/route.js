import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const MAX_BYTES = 400_000; // ~400KB base64 limit

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let photo = body.photo || body.profilePhoto || "";

    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    // Accept data URL only
    if (!photo.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image. Use JPEG or PNG." },
        { status: 400 }
      );
    }

    if (photo.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Please use a smaller photo (under ~300KB)." },
        { status: 400 }
      );
    }

    // Basic type check
    if (
      !photo.startsWith("data:image/jpeg") &&
      !photo.startsWith("data:image/png") &&
      !photo.startsWith("data:image/webp") &&
      !photo.startsWith("data:image/gif")
    ) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP or GIF allowed" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: photo },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        hostel: true,
        customHostel: true,
        profilePhoto: true,
      },
    });

    try {
      revalidatePath("/profile");
      revalidatePath("/admin");
    } catch (_) {}

    return NextResponse.json({ user: updated, success: true });
  } catch (e) {
    console.error("upload-photo", e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: null },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        hostel: true,
        customHostel: true,
        profilePhoto: true,
      },
    });
    return NextResponse.json({ user: updated, success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
