import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "buywater-tamale-h2o-secret-2024";
const TOKEN_NAME = "buywater_token";

/** Roles that have full admin access */
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/** True if role is ADMIN or SUPER_ADMIN */
export function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role || "").toUpperCase());
}

/** Hash a plain password */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/** Compare plain password with hash */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** Create a JWT for a user (embeds role at sign time) */
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/** Verify JWT and return payload or null */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Get current user from request cookies (server-side).
 * ALWAYS fetches fresh role (and other fields) from the database.
 * Never trusts the JWT role for authorization decisions.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
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
      banned: true,
      createdAt: true,
    },
  });
  if (!user || user.banned) return null;
  return user;
}

/** Require logged-in user; throws if not */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return user;
}

/**
 * Require ADMIN or SUPER_ADMIN role.
 * Uses fresh DB role via getCurrentUser().
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdminRole(user.role)) {
    const err = new Error("Forbidden – admin only");
    err.status = 403;
    throw err;
  }
  return user;
}

/**
 * Re-issue the session cookie with the latest role/name from DB.
 * Call this after promoting/demoting a user so their next request
 * has an up-to-date JWT (middleware can still decode it).
 */
export async function refreshSessionCookie(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user) return null;

  const token = signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return user;
}

/**
 * Clear the auth cookie (force logout for current browser).
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { TOKEN_NAME };
