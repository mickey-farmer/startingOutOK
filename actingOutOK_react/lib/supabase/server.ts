import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Server-only Supabase client with service role. Use in API routes and server code. */
export function getSupabase() {
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey);
}
