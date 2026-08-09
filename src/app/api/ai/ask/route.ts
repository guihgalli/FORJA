import { NextResponse } from "next/server";
import { askAI } from "@/lib/ai/service";
import { demoExercises } from "@/lib/demo/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = String(body.question ?? "").slice(0, 500);
    if (!question) {
      return NextResponse.json({ error: "Pergunta obrigatória" }, { status: 400 });
    }
    const result = await askAI({
      question,
      workoutContext: body.workoutContext ?? {},
      exercises: demoExercises,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
