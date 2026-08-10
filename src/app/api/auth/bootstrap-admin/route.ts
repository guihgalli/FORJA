import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bootstrapAdminIfNeeded } from "@/lib/auth/session";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "no_supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const promoted = await bootstrapAdminIfNeeded(user.id, user.email);
  return NextResponse.json({ ok: true, promoted });
}
