import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        price: Number(body.price),
        description: body.description || "",
        image: body.image || "/uploads/product.svg",
        category: body.category || "water",
        stock: Number(body.stock) || 100,
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
