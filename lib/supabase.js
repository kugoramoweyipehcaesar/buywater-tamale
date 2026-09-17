/**
 * Optional Supabase client helpers for future features (Auth UI, Realtime, Storage).
 * BuyWater data access remains Prisma + DATABASE_URL (Postgres on Supabase).
 *
 * Install when needed: npm install @supabase/supabase-js
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Render.
 */

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

/**
 * Returns true when public Supabase env vars are present.
 * Does not create a client until @supabase/supabase-js is installed.
 */
export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}
