import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/profile/schema";
import { loadAthleteProfile } from "@/lib/profile/load";

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
