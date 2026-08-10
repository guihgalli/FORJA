import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/profile/schema";
import type { AthleteProfile } from "@/types";

async function loadAthleteProfile() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase não configurado", status: 503 as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado", status: 401 as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message, status: 500 as const };
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
    return { error: studentError.message, status: 500 as const };
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

export async function GET() {
  const result = await loadAthleteProfile();
  if ("error" in result && result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  if (input.full_name !== undefined) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: input.full_name })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  const { data: student, error: studentLookupError } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (studentLookupError) {
    return NextResponse.json(
      { error: studentLookupError.message },
      { status: 500 },
    );
  }

  if (!student) {
    return NextResponse.json(
      { error: "Registro de aluno não encontrado" },
      { status: 404 },
    );
  }

  const studentPatch: Record<string, unknown> = {};
  const studentKeys = [
    "age",
    "sex",
    "height_cm",
    "weight_kg",
    "body_fat_pct",
    "goal",
    "level",
    "experience",
    "sport",
    "position",
    "weekly_frequency",
    "available_days",
    "session_duration_min",
    "equipment",
    "notes",
    "dietary_preference",
    "food_allergies",
    "food_restrictions",
    "meals_per_day",
    "activity_level",
    "diet_notes",
  ] as const;

  for (const key of studentKeys) {
    if (input[key] !== undefined) {
      studentPatch[key] = input[key];
    }
  }

  if (Object.keys(studentPatch).length > 0) {
    const { error: updateError } = await supabase
      .from("students")
      .update(studentPatch)
      .eq("id", student.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const refreshed = await loadAthleteProfile();
  if ("error" in refreshed && refreshed.error) {
    return NextResponse.json(
      { error: refreshed.error },
      { status: refreshed.status },
    );
  }

  return NextResponse.json({ ok: true, ...refreshed });
}
