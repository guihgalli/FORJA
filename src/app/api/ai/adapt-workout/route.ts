import { NextResponse } from "next/server";
import { adaptWorkoutWithAI } from "@/lib/ai/service";
import { demoExercises, demoTodayWorkout } from "@/lib/demo/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await adaptWorkoutWithAI({
      workout: body.workout ?? demoTodayWorkout,
      performance: body.performance ?? {
        load_kg: 90,
        reps: 8,
        rir: 3,
        rpe: 7,
      },
      exercises: demoExercises,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
