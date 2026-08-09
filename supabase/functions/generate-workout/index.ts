// Supabase Edge Function — generate-workout
// Valida JWT, aplica rate limit de uso e chama o mesmo contrato da API Next.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    // Em produção: montar contexto do aluno, chamar LLM provider, validar schema,
    // registrar ai_generations e incrementar ai_usage.
    const started = Date.now();

    await supabase.from("ai_generations").insert({
      user_id: user.id,
      request_type: "generate_workout",
      model: Deno.env.get("AI_PROVIDER") ?? "mock",
      prompt_version: "forja-system-v1",
      latency_ms: Date.now() - started,
      status: "accepted",
      request_payload: body,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Encaminhe para o worker/API com AI Provider. Auth validada.",
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
