import {
  extractSexFromProfile,
  muscleBiasForSex,
  normalizeAthleteSex,
  type AthleteSex,
} from "@/lib/ai/sex";
import type { AICompletionRequest, AICompletionResult, AIProvider } from "./types";

type CompactExercise = {
  id: string;
  name?: string;
  primary_muscle?: string;
  equipment?: string;
};

/** Provider local para desenvolvimento sem chave de LLM. */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const started = Date.now();
    const user = request.messages.find((m) => m.role === "user")?.content ?? "";
    const allowed = extractAllowedExercises(user);
    const sex = extractSexFromUserPrompt(user);
    const goal = extractGoal(user);
    const duration = extractDuration(user);

    // Heurística simples: se o prompt menciona periodização, devolve plano
    if (user.includes("periodização") || user.includes("4 semanas")) {
      const weekWorkout = buildWorkout(allowed, goal, duration, sex);
      const content = JSON.stringify({
        name: "Plano 4 semanas",
        goal,
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
      const id = allowed[0]?.id;
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
        next_workout: buildWorkout(allowed, goal, duration, sex),
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
        alternatives: allowed.slice(0, 3).map((e) => e.id),
        disclaimer:
          "Sugestão de treinamento com base na biblioteca — não é diagnóstico médico.",
      });
      return delayResult(content, started);
    }

    const content = JSON.stringify(buildWorkout(allowed, goal, duration, sex));
    return delayResult(content, started);
  }
}

function delayResult(content: string, started: number): AICompletionResult {
  return {
    content,
    model: "mock-forja-v2",
    inputTokens: 800,
    outputTokens: 400,
    latencyMs: Date.now() - started + 120,
    provider: "mock",
  };
}

function extractSexFromUserPrompt(user: string): AthleteSex | null {
  const profileIdx = user.indexOf("ATHLETE PROFILE:");
  if (profileIdx >= 0) {
    const slice = user.slice(profileIdx, profileIdx + 4000);
    try {
      const jsonStart = slice.indexOf("{");
      const jsonEnd = slice.indexOf("\nTRAINING HISTORY:");
      const raw =
        jsonEnd > jsonStart
          ? slice.slice(jsonStart, jsonEnd).trim()
          : slice.slice(jsonStart);
      const profile = JSON.parse(raw) as Record<string, unknown>;
      const fromProfile = extractSexFromProfile(profile);
      if (fromProfile) return fromProfile;
    } catch {
      // fallback regex below
    }
  }

  const m = user.match(/"sex"\s*:\s*"([^"]+)"/i);
  return m ? normalizeAthleteSex(m[1]) : null;
}

function extractAllowedExercises(user: string): CompactExercise[] {
  const availableIdx = user.indexOf("AVAILABLE EXERCISES:");
  if (availableIdx >= 0) {
    const slice = user.slice(availableIdx + "AVAILABLE EXERCISES:".length);
    const arrStart = slice.indexOf("[");
    if (arrStart >= 0) {
      let depth = 0;
      let end = -1;
      for (let i = arrStart; i < Math.min(slice.length, arrStart + 20000); i++) {
        const ch = slice[i];
        if (ch === "[") depth += 1;
        if (ch === "]") {
          depth -= 1;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end > arrStart) {
        try {
          const parsed = JSON.parse(slice.slice(arrStart, end + 1)) as CompactExercise[];
          if (Array.isArray(parsed) && parsed.length) {
            return parsed.filter((e) => typeof e?.id === "string");
          }
        } catch {
          // fall through to UUID scrape
        }
      }
    }
  }

  const matches = user.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  );
  const unique = [...new Set(matches ?? [])];
  if (unique.length > 0) return unique.map((id) => ({ id }));
  return [
    { id: "10000000-0000-4000-8000-000000000001", primary_muscle: "peito" },
    { id: "10000000-0000-4000-8000-000000000060", primary_muscle: "gluteos" },
    { id: "10000000-0000-4000-8000-000000000053", primary_muscle: "posteriores" },
    { id: "10000000-0000-4000-8000-000000000033", primary_muscle: "quadriceps" },
    { id: "10000000-0000-4000-8000-000000000023", primary_muscle: "ombros" },
    { id: "10000000-0000-4000-8000-000000000009", primary_muscle: "costas" },
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

function scoreExercise(
  exercise: CompactExercise,
  sex: AthleteSex | null,
  goal: string,
): number {
  const bias = muscleBiasForSex(sex);
  const muscle = exercise.primary_muscle ?? "";
  let score = 0;

  if (bias) {
    const preferIdx = bias.prefer.indexOf(muscle);
    if (preferIdx >= 0) score += 40 - preferIdx * 4;
    if (bias.deprioritize.includes(muscle)) score -= 12;
  }

  const g = goal.toLowerCase();
  if (
    (g.includes("futebol") || g.includes("explosão") || g.includes("performance")) &&
    ["quadriceps", "posteriores", "gluteos", "explosao", "core"].includes(muscle)
  ) {
    score += 10;
  }

  return score;
}

function pickExercises(
  exercises: CompactExercise[],
  count: number,
  sex: AthleteSex | null,
  goal: string,
): CompactExercise[] {
  const ranked = [...exercises].sort(
    (a, b) => scoreExercise(b, sex, goal) - scoreExercise(a, sex, goal),
  );

  const picked: CompactExercise[] = [];
  const seenMuscles = new Set<string>();

  for (const ex of ranked) {
    if (picked.length >= count) break;
    const muscle = ex.primary_muscle ?? ex.id;
    // Diversifica músculos, mas permite 2 do mesmo se lista for curta
    const same = picked.filter((p) => p.primary_muscle === ex.primary_muscle).length;
    if (same >= 2 && ranked.length > count) continue;
    picked.push(ex);
    seenMuscles.add(muscle);
  }

  let i = 0;
  while (picked.length < count && ranked.length) {
    picked.push(ranked[i % ranked.length]);
    i += 1;
  }

  return picked;
}

function buildWorkout(
  exercises: CompactExercise[],
  goal: string,
  duration: number,
  sex: AthleteSex | null,
) {
  const count = duration <= 30 ? 4 : duration <= 45 ? 5 : 6;
  const picked = pickExercises(exercises, count, sex, goal);
  const bias = muscleBiasForSex(sex);

  const higherReps =
    sex === "feminino" &&
    (goal === "Hipertrofia" || goal === "Definição" || goal === "Resistência");

  const name =
    goal === "Futebol" || goal === "Explosão"
      ? "Treino A - Potência e Lower"
      : bias
        ? `Treino A - ${bias.nameHint}`
        : "Treino A - Full Body";

  return {
    name,
    goal,
    duration_minutes: duration,
    rationale:
      bias?.rationaleHint ??
      "Seleção baseada em biblioteca validada, histórico e disponibilidade. Evita sobrecarga desnecessária antes de eventos esportivos.",
    exercises: picked.map((ex, index) => ({
      exercise_id: ex.id,
      order: index + 1,
      sets: index < 2 ? 4 : 3,
      rep_min: goal === "Força" ? 3 : higherReps ? 8 : 6,
      rep_max: goal === "Força" ? 5 : higherReps ? 15 : 10,
      rir: 2,
      rest_seconds: goal === "Força" ? 180 : higherReps ? 90 : 120,
      tempo: "3-1-1-0",
    })),
  };
}
