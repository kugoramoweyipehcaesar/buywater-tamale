import { prisma } from "@/lib/prisma";

/**
 * Fire-and-forget activity log. Never throws to callers.
 */
export async function logActivity({ userId, email, action, details, ip } = {}) {
  try {
    if (!action) return;
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        email: email || null,
        action: String(action).toUpperCase(),
        details: details ? String(details).slice(0, 4000) : null,
        ip: ip || null,
      },
    });
  } catch (e) {
    console.error("[activityLogger]", e?.message || e);
  }
}
