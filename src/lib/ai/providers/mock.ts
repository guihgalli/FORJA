import type { AICompletionRequest, AICompletionResult, AIProvider } from "./types";

/** Provider local para desenvolvimento sem chave de LLM. */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const started = Date.now();
    const user = request.messages.find((m) => m.role === "user")?.content ?? "";
    const allowed = extractAllowedIds(user);

    // Heurística simples: se o prompt menciona periodização, devolve plano
    if (user.includes("periodização") || user.includes("4 semanas")) {
      const weekWorkout = buildWorkout(allowed, "Hipertrofia", 60);
      const content = JSON.stringify({
        name: "Plano 4 semanas",
        goal: "Hipertrofia",
        weeks: [
          { week_number: 1, focus: "Adaptação", workouts: [weekWorkout] },
          {
            week_number: 2,
            focus: "Progressão",
            workouts: [
              {
                ...weekWorkout,
                name: "Treino A - Progressão",
                exercises: weekWorkout.exercises.map((e) => ({
                  ...e,
                  rir: Math.max(0, (e.rir ?? 2) - 0.5),
                })),
              },
            ],
          },
          {
            week_number: 3,
            focus: "Intensificação",
            workouts: [
              {
                ...weekWorkout,
                name: "Treino A - Intensificação",
                exercises: weekWorkout.exercises.map((e) => ({
                  ...e,
                  sets: Math.min(6, e.sets + 1),
                  rir: 1,
                })),
              },
            ],
          },
          {
            week_number: 4,
            focus: "Deload",
            workouts: [
              {
                ...weekWorkout,
                name: "Treino A - Deload",
                exercises: weekWorkout.exercises.map((e) => ({
                  ...e,
                  sets: Math.max(2, e.sets - 1),
                  rir: 3,
                })),
              },
            ],
          },
        ],
      });
      return delayResult(content, started);
    }

    if (user.includes("ADAPTAR") || user.includes("adapt")) {
      const id = allowed[0];
      const content = JSON.stringify({
        summary:
          "Desempenho sólido com RIR residual. Progressão conservadora sugerida.",
        adjustments: [
          {
            exercise_id: id,
            suggestion: "Aumentar carga em 2,5 kg mantendo as reps-alvo.",
            new_load_kg: 85,
            new_reps: "6-8",
            new_rir: 2,
          },
        ],
        next_workout: buildWorkout(allowed, "Hipertrofia", 60),
      });
      return delayResult(content, started);
    }

    if (user.includes("ANÁLISE DO MÊS") || user.includes("relatório")) {
      const content = JSON.stringify({
        positives: [
          "Boa aderência aos treinos da semana",
          "Progressão de carga em movimentos compostos",
        ],
        improvements: [
          "Evitar volume alto de pernas na véspera de jogos",
          "Registrar RIR com mais consistência",
        ],
        evolution: "Volume semanal estável com tendência de alta nas cargas.",
        recommendations: [
          "Manter double progression nos compostos",
          "Incluir 1 sessão de mobilidade pós-jogo",
        ],
        disclaimer:
          "Orientações de treinamento — não substituem avaliação médica.",
      });
      return delayResult(content, started);
    }

    if (user.includes("PERGUNTAR") || user.toLowerCase().includes("substitu")) {
      const content = JSON.stringify({
        answer:
          "Sim. Você pode substituir por um exercício da mesma família de movimento e equipamento disponível, mantendo séries/reps semelhantes.",
        alternatives: allowed.slice(0, 3),
        disclaimer:
          "Sugestão de treinamento com base na biblioteca — não é diagnóstico médico.",
      });
      return delayResult(content, started);
    }

    const content = JSON.stringify(
      buildWorkout(allowed, extractGoal(user), extractDuration(user)),
    );
    return delayResult(content, started);
  }
}

function delayResult(content: string, started: number): AICompletionResult {
  return {
    content,
    model: "mock-forja-v1",
    inputTokens: 800,
    outputTokens: 400,
    latencyMs: Date.now() - started + 120,
    provider: "mock",
  };
}

function extractAllowedIds(user: string) {
  // Prefer IDs listed under AVAILABLE EXERCISES block when present
  const availableIdx = user.indexOf("AVAILABLE EXERCISES:");
  const slice =
    availableIdx >= 0 ? user.slice(availableIdx, availableIdx + 12000) : user;
  const matches = slice.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  );
  const unique = [...new Set(matches ?? [])];
  if (unique.length > 0) return unique;
  return [
    "10000000-0000-4000-8000-000000000001",
    "10000000-0000-4000-8000-000000000006",
    "10000000-0000-4000-8000-000000000033",
    "10000000-0000-4000-8000-000000000023",
    "10000000-0000-4000-8000-000000000053",
    "10000000-0000-4000-8000-000000000009",
  ];
}

function extractGoal(user: string) {
  const goals = [
    "Hipertrofia",
    "Força",
    "Definição",
    "Resistência",
    "Explosão",
    "Velocidade",
    "Futebol",
    "Performance esportiva",
    "Reabilitação",
  ];
  return goals.find((g) => user.includes(g)) ?? "Hipertrofia";
}

function extractDuration(user: string) {
  const m = user.match(/\b(30|45|60|90)\b/);
  return m ? Number(m[1]) : 60;
}

function buildWorkout(ids: string[], goal: string, duration: number) {
  const count = duration <= 30 ? 4 : duration <= 45 ? 5 : 6;
  const picked = ids.slice(0, count);
  while (picked.length < count) {
    picked.push(ids[picked.length % ids.length]);
  }

  return {
    name:
      goal === "Futebol" || goal === "Explosão"
        ? "Treino A - Potência e Upper"
        : "Treino A - Peito e Tríceps",
    goal,
    duration_minutes: duration,
    rationale:
      "Seleção baseada em biblioteca validada, histórico e disponibilidade. Evita sobrecarga desnecessária antes de eventos esportivos.",
    exercises: picked.map((exercise_id, index) => ({
      exercise_id,
      order: index + 1,
      sets: index < 2 ? 4 : 3,
      rep_min: goal === "Força" ? 3 : 6,
      rep_max: goal === "Força" ? 5 : 10,
      rir: 2,
      rest_seconds: goal === "Força" ? 180 : 120,
      tempo: "3-1-1-0",
    })),
  };
}
