import { NextResponse } from "next/server";
import { z } from "zod";
import { assertProfileTrainingSex } from "@/lib/ai/assert-training-sex";
import { generateWorkoutWithAI } from "@/lib/ai/service";
import {
  demoCalendar,
  demoExercises,
  demoHistory,
  demoProfile,
} from "@/lib/demo/store";
import { loadAthleteProfile } from "@/lib/profile/load";

const BodySchema = z.object({
  goal: z.string(),
  frequency: z.number().int().min(1).max(7),
  duration: z.number().int(),
  equipment: z.array(z.string()).min(1),
  experience: z.string(),
  sport: z.string(),
  availableDays: z.array(z.string()),
  preferences: z.string().optional(),
});

function filterExercises(equipment: string[]) {
  return demoExercises.filter((e) => {
    if (equipment.includes("academia_completa")) return true;
    return equipment.includes(e.equipment) || e.equipment === "peso_corporal";
  });
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    const ip = req.headers.get("x-forwarded-for") ?? "local";
    if (ip.length > 500) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 429 });
    }

    const loaded = await loadAthleteProfile();
    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const profile = loaded.profile.profile_completed_at
      ? loaded.profile
      : demoProfile;

    const trainingSex = assertProfileTrainingSex(profile);

    const result = await generateWorkoutWithAI({
      trainingSex,
      profile: profile as unknown as Record<string, unknown>,
      history: demoHistory,
      exercises: filterExercises(body.equipment),
      calendar: demoCalendar,
      form: {
        goal: body.goal,
        frequency: body.frequency,
        duration: body.duration,
        equipment: body.equipment,
        experience: body.experience,
        sport: body.sport,
        availableDays: body.availableDays,
        preferences: body.preferences,
      },
      plan: "FREE",
      usage: { used: 7, limit: 10 },
    });

    return NextResponse.json({
      ok: true,
      workout: result.workout,
      violations: result.violations,
      meta: result.meta,
      usage: "8/10 gerações utilizadas",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
