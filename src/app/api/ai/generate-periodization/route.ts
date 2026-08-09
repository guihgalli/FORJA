import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePeriodizationWithAI } from "@/lib/ai/service";
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
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const result = await generatePeriodizationWithAI({
      profile: demoProfile as unknown as Record<string, unknown>,
      history: demoHistory,
      exercises: demoExercises,
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
