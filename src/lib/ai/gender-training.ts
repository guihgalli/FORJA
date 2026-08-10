import type { Exercise } from "@/types";

export type TrainingSex = "masculino" | "feminino";

const TRAINING_SEX_SET = new Set<string>(["masculino", "feminino"]);

export function resolveTrainingSex(
  sex: string | null | undefined,
): TrainingSex | null {
  if (!sex) return null;
  return TRAINING_SEX_SET.has(sex) ? (sex as TrainingSex) : null;
}

export function getTrainingSexLabel(sex: TrainingSex): string {
  return sex === "feminino" ? "Treino feminino" : "Treino masculino";
}

export function requireTrainingSexMessage(
  sex: string | null | undefined,
): string | null {
  if (resolveTrainingSex(sex)) return null;
  return "Informe masculino ou feminino no perfil para gerar treino. Treinos masculino e feminino são programações distintas.";
}

const FEMININE_PRIORITY_MUSCLES = new Set([
  "gluteos",
  "posteriores",
  "quadriceps",
  "core",
  "abdomen",
  "mobilidade",
]);

const MASCULINE_PRIORITY_MUSCLES = new Set([
  "peito",
  "costas",
  "ombros",
  "triceps",
  "biceps",
]);

/** Reordena exercícios para priorizar grupos musculares do sexo no prompt. */
export function prioritizeExercisesForSex(
  exercises: Exercise[],
  sex: TrainingSex,
): Exercise[] {
  const priority =
    sex === "feminino" ? FEMININE_PRIORITY_MUSCLES : MASCULINE_PRIORITY_MUSCLES;

  return [...exercises].sort((a, b) => {
    const aPriority = priority.has(a.primary_muscle) ? 0 : 1;
    const bPriority = priority.has(b.primary_muscle) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function buildGenderTrainingPrompt(sex: TrainingSex): string {
  if (sex === "feminino") {
    return `
REGRA PRIMORDIAL — TREINO FEMININO (OBRIGATÓRIO):
- Este atleta é FEMININO. O treino DEVE ser uma programação feminina, completamente distinta de treino masculino.
- NUNCA replique splits, ênfases ou templates masculinos (push/pull/legs clássico centrado em peito/costas pesadas).
- Prioridade absoluta: glúteos, posteriores de coxa, quadríceps e core. Inclua ativação/isolamento de glúteo quando fizer sentido.
- Membros superiores: tonificação equilibrada (costas, ombros, peito leve). Evite volume excessivo de peito/espalhamento "powerlifting masculino".
- Volume de lower body ≥ 50% das séries totais, salvo reabilitação ou restrição explícita.
- Prefira exercícios como: hip thrust, stiff/RDL, agachamento, afundo, leg press, abdução, elevação pélvica, glúteo na polia, posterior na mesa.
- Séries/reps: glúteo/pernas 8–15 reps com RIR 1–3; superiores 8–12; core 10–20.
- Nomeie o treino indicando foco feminino (ex.: "Treino A — Glúteo & Posterior").
`.trim();
  }

  return `
REGRA PRIMORDIAL — TREINO MASCULINO (OBRIGATÓRIO):
- Este atleta é MASCULINO. O treino DEVE ser uma programação masculina, completamente distinta de treino feminino.
- NUNCA replique templates femininos (glúteo/perna dominante, lower body ≥ 50% das séries, foco em abdução/hip thrust como base).
- Prioridade absoluta: peito, costas, ombros, braços e força nos compostos superiores.
- Pernas: 1 sessão sólida de pernas/compostos (agachamento, leg press, stiff) por ciclo; não transforme o treino em "só glúteo".
- Volume de upper body ≥ 50% das séries totais, salvo reabilitação ou restrição explícita.
- Prefira exercícios como: supino (reto/inclinado), remadas, puxadas, desenvolvimento, tríceps, bíceps, levantamento terra/agachamento.
- Séries/reps: compostos principais 4–8 reps; acessórios 8–12; RIR 1–3.
- Nomeie o treino indicando foco masculino (ex.: "Treino A — Peito & Tríceps").
`.trim();
}

export function buildGenderVolumeHint(sex: TrainingSex): {
  primaryMuscles: Set<string>;
  minPrimaryShare: number;
} {
  return sex === "feminino"
    ? { primaryMuscles: FEMININE_PRIORITY_MUSCLES, minPrimaryShare: 0.45 }
    : { primaryMuscles: MASCULINE_PRIORITY_MUSCLES, minPrimaryShare: 0.45 };
}
