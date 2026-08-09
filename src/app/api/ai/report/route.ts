import { NextResponse } from "next/server";
import { generateMonthlyReport } from "@/lib/ai/service";
import { demoHistory } from "@/lib/demo/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await generateMonthlyReport({
      stats: body.stats ?? {},
      history: demoHistory,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
