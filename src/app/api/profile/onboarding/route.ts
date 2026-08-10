import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/onboarding/schema";

export async function POST(request: Request) {
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

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados incompletos",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const now = new Date().toISOString();

  const allergies = (input.food_allergies ?? []).filter((a) => a !== "nenhuma");
  const restrictions = (input.food_restrictions ?? []).filter(
    (r) => r !== "nenhuma",
  );

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  if (!student) {
    return NextResponse.json(
      { error: "Perfil de aluno não encontrado" },
      { status: 404 },
    );
  }

  const { error: updateError } = await supabase
    .from("students")
    .update({
      age: input.age,
      sex: input.sex,
      height_cm: input.height_cm,
      weight_kg: input.weight_kg,
      body_fat_pct: input.body_fat_pct ?? null,
      goal: input.goal,
      experience: input.experience,
      level: input.level ?? input.experience,
      sport: input.sport || null,
      weekly_frequency: input.weekly_frequency,
      available_days: input.available_days,
      session_duration_min: input.session_duration_min,
      equipment: input.equipment,
      notes: input.notes || null,
      dietary_preference: input.dietary_preference,
      food_allergies: allergies,
      food_restrictions: restrictions,
      meals_per_day: input.meals_per_day,
      activity_level: input.activity_level,
      diet_notes: input.diet_notes || null,
      profile_completed_at: now,
    })
    .eq("id", student.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profile_completed_at: now,
    redirect: "/dashboard",
  });
}
