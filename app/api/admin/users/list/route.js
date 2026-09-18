import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const role = (searchParams.get("role") || "all").toLowerCase();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    const where = {};
    if (role === "admins" || role === "admin") {
      where.role = { in: ["ADMIN", "SUPER_ADMIN"] };
    } else if (role === "riders" || role === "rider") {
      where.role = "RIDER";
    } else if (role === "customers" || role === "user") {
      where.role = "USER";
    }
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, admins, riders, newUsers, users, activeToday] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
      prisma.user.count({ where: { role: "RIDER" } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          phone: true,
          role: true,
          hostel: true,
          profilePhoto: true,
          banned: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order
        .findMany({
          where: { createdAt: { gte: startOfDay }, userId: { not: null } },
          select: { userId: true },
          distinct: ["userId"],
        })
        .then((rows) => rows.length)
        .catch(() => 0),
    ]);

    const totalAll = await prisma.user.count();

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        orderCount: u._count?.orders || 0,
        _count: undefined,
      })),
      stats: {
        totalUsers: totalAll,
        admins,
        riders,
        activeToday,
        newUsers7d: newUsers,
      },
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
