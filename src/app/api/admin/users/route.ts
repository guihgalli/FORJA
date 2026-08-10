import { NextResponse } from "next/server";
import { requireAdminProfile, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAppRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 503 },
    );
  }

  const admin = await requireAdminProfile();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 503 },
    );
  }

  const admin = await requireAdminProfile();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string; role?: string };
  if (!body.id || !isAppRole(body.role)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (body.id === admin.id && body.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Você não pode remover o próprio papel de administrador." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase indisponível" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: body.role })
    .eq("id", body.id)
    .select("id, email, full_name, avatar_url, role, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mantém papel da membership ativa alinhado quando possível
  const me = await getCurrentProfile();
  if (me?.active_organization_id) {
    await supabase
      .from("organization_members")
      .update({ role: body.role })
      .eq("user_id", body.id)
      .eq("organization_id", me.active_organization_id);
  }

  return NextResponse.json({ ok: true, user: data });
}
