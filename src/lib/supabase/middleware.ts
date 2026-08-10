import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAthleteProfileComplete } from "@/lib/onboarding/schema";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/workout",
  "/progress",
  "/calendar",
  "/profile",
  "/exercises",
  "/goals",
  "/measurements",
  "/trainer",
  "/ai",
  "/admin",
  "/onboarding",
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

const ONBOARDING_ALLOWED = ["/onboarding", "/api/profile/onboarding"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isOnboardingAllowed(pathname: string) {
  return ONBOARDING_ALLOWED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  // Sem Supabase: bloqueia rotas protegidas (produção exige Auth real)
  if (!url || !key) {
    if (isProtectedPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      redirectUrl.searchParams.set(
        "error",
        "Configure o Supabase para acessar o app em produção.",
      );
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let profileComplete = true;
  let role: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    role = profile?.role ?? null;
    const isAdmin = role === "ADMIN";

    if (!isAdmin) {
      const { data: student } = await supabase
        .from("students")
        .select(
          "profile_completed_at, age, sex, height_cm, weight_kg, goal, experience, weekly_frequency, available_days, session_duration_min, equipment, dietary_preference, meals_per_day, activity_level",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      profileComplete = isAthleteProfileComplete(student);
    }

    if (
      !profileComplete &&
      pathname.startsWith("/api/") &&
      !isOnboardingAllowed(pathname) &&
      !pathname.startsWith("/api/auth/")
    ) {
      return NextResponse.json(
        { error: "Complete o onboarding do perfil", redirect: "/onboarding" },
        { status: 403 },
      );
    }

    if (!profileComplete && isProtectedPath(pathname) && !isOnboardingAllowed(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (profileComplete && pathname === "/onboarding") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = profileComplete ? "/dashboard" : "/onboarding";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    if (role !== "ADMIN") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
