import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { bootstrapAdminIfNeeded } from "@/lib/auth/session";
import { isAthleteProfileComplete } from "@/lib/onboarding/schema";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // ignore in edge cases
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (data.user) {
    await bootstrapAdminIfNeeded(data.user.id, data.user.email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.role !== "ADMIN") {
      const { data: student } = await supabase
        .from("students")
        .select(
          "profile_completed_at, age, sex, height_cm, weight_kg, goal, experience, weekly_frequency, available_days, session_duration_min, equipment, dietary_preference, meals_per_day, activity_level",
        )
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!isAthleteProfileComplete(student)) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
