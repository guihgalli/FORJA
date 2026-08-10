import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePeriodizationWithAI } from "@/lib/ai/service";
import { ATHLETE_SEX_VALUES, normalizeAthleteSex } from "@/lib/ai/sex";
import {
  demoCalendar,
  demoExercises,
  demoHistory,
  demoProfile,
} from "@/lib/demo/store";

const BodySchema = z.object({
  goal: z.string(),
  frequency: z.number().int().min(1).max(7),
  duration: z.number().int(),
  equipment: z.array(z.string()).min(1),
  experience: z.string(),
  sport: z.string(),
  availableDays: z.array(z.string()),
  preferences: z.string().optional(),
  sex: z.enum(ATHLETE_SEX_VALUES).optional(),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const exercises = demoExercises.filter((e) => {
      if (body.equipment.includes("academia_completa")) return true;
      return (
        body.equipment.includes(e.equipment) || e.equipment === "peso_corporal"
      );
    });

    const sex =
      normalizeAthleteSex(body.sex) ??
      normalizeAthleteSex(demoProfile.sex) ??
      "masculino";

    const result = await generatePeriodizationWithAI({
      profile: {
        ...(demoProfile as unknown as Record<string, unknown>),
        sex,
      },
      history: demoHistory,
      exercises,
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
      plan: "TRAINER",
      usage: { used: 7, limit: 500 },
    });

    return NextResponse.json({
      ok: true,
      plan: result.plan,
      meta: result.meta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
