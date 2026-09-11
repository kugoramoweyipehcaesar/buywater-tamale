import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "buywater-tamale-h2o-secret-2024";
const TOKEN_NAME = "buywater_token";

/** Hash a plain password */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/** Compare plain password with hash */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** Create a JWT for a user */
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

/** Get current user from request cookies (server-side) */
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

/** Require ADMIN role */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    const err = new Error("Forbidden – admin only");
    err.status = 403;
    throw err;
  }
  return user;
}

export { TOKEN_NAME };
