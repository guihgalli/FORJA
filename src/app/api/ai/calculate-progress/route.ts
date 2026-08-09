import { NextResponse } from "next/server";
import { epley1RM } from "@/lib/utils";
import { suggestNextLoad } from "@/lib/progression/methods";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const loadKg = Number(body.load_kg ?? 0);
    const reps = Number(body.reps ?? 0);
    const estimated1rm = epley1RM(loadKg, reps);
    const suggestion = suggestNextLoad({
      method: body.method ?? "double_progression",
      loadKg,
      reps,
      repMax: Number(body.rep_max ?? 8),
      rir: body.rir,
    });
    return NextResponse.json({ ok: true, estimated1rm, suggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
