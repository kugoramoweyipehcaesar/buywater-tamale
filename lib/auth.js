import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "buywater-tamale-h2o-secret-2024";
const TOKEN_NAME = "buywater_token";

/** Admin-level roles (panel + APIs) */
export function isAdminRole(role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Hash a plain password */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/** Compare plain password with hash */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** Create a JWT for a user — role always from DB object passed in */
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
 * Get current user from cookie.
 * ALWAYS loads role (and profile) from the database — never trusts token.role alone.
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

/** Require ADMIN or SUPER_ADMIN (fresh from DB via getCurrentUser) */
export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdminRole(user.role)) {
    const err = new Error("Forbidden – admin only");
    err.status = 403;
    throw err;
  }
  return user;
}

/** Clear session cookie (logout / force re-login after role change) */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Re-issue JWT from DB so cookie matches current role.
 * Call after role updates or when client detects mismatch.
 */
export async function refreshSessionCookie() {
  const user = await getCurrentUser();
  if (!user) return null;
  const token = signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return user;
}

export { TOKEN_NAME };
