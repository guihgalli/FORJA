import { createClient } from "@/lib/supabase/server";
import type { AthleteProfile } from "@/types";

export type LoadedAthleteProfile = {
  profile: AthleteProfile;
  meta: {
    email: string | null;
    role: string;
    avatar_url: string | null;
    student_id: string | null;
  };
};

export type LoadAthleteProfileError = {
  error: string;
  status: 401 | 500 | 503;
};

export async function loadAthleteProfile(): Promise<
  LoadedAthleteProfile | LoadAthleteProfileError
> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase não configurado", status: 503 };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado", status: 401 };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message, status: 500 };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(
      "id, age, sex, height_cm, weight_kg, body_fat_pct, goal, level, experience, sport, position, weekly_frequency, available_days, session_duration_min, equipment, notes, dietary_preference, food_allergies, food_restrictions, meals_per_day, activity_level, diet_notes, profile_completed_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (studentError) {
    return { error: studentError.message, status: 500 };
  }

  const athlete: AthleteProfile = {
    id: user.id,
    full_name:
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "",
    age: student?.age ?? null,
    sex: student?.sex ?? null,
    height_cm: student?.height_cm != null ? Number(student.height_cm) : null,
    weight_kg: student?.weight_kg != null ? Number(student.weight_kg) : null,
    body_fat_pct:
      student?.body_fat_pct != null ? Number(student.body_fat_pct) : null,
    goal: student?.goal ?? null,
    level: student?.level ?? null,
    experience: student?.experience ?? null,
    sport: student?.sport ?? null,
    position: student?.position ?? null,
    weekly_frequency: student?.weekly_frequency ?? null,
    available_days: student?.available_days ?? [],
    session_duration_min: student?.session_duration_min ?? null,
    equipment: student?.equipment ?? [],
    notes: student?.notes ?? null,
    profile_completed_at: student?.profile_completed_at ?? null,
    dietary_preference: student?.dietary_preference ?? null,
    food_allergies: student?.food_allergies ?? [],
    food_restrictions: student?.food_restrictions ?? [],
    meals_per_day: student?.meals_per_day ?? null,
    activity_level: student?.activity_level ?? null,
    diet_notes: student?.diet_notes ?? null,
  };

  return {
    profile: athlete,
    meta: {
      email: profile?.email ?? user.email ?? null,
      role: profile?.role ?? "STUDENT",
      avatar_url: profile?.avatar_url ?? null,
      student_id: student?.id ?? null,
    },
  };
}
