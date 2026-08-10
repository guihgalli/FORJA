import { createClient } from "@/lib/supabase/server";
import { parseAdminEmails } from "@/lib/auth/roles";
import type { AppRole } from "@/types";

export type ProfileSession = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  active_organization_id: string | null;
};

export async function getSessionUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<ProfileSession | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, active_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    return {
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatar_url:
        (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null,
      role: "STUDENT",
      active_organization_id: null,
    };
  }

  return data as ProfileSession;
}

export async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ADMIN") return null;
  return profile;
}

/** Promove emails em ADMIN_EMAILS usando service role (bootstrap). */
export async function bootstrapAdminIfNeeded(userId: string, email?: string | null) {
  const allowlist = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (!email || allowlist.length === 0) return false;
  if (!allowlist.includes(email.toLowerCase())) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) return false;

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin
    .from("profiles")
    .update({ role: "ADMIN" })
    .eq("id", userId);

  return !error;
}
