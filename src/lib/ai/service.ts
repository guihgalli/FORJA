import {
  AdaptWorkoutSchema,
  GeneratedPeriodizationSchema,
  GeneratedWorkoutSchema,
} from "@/lib/ai/schemas/workout";
import { getAIProvider } from "@/lib/ai/providers";
import {
  PROMPT_VERSION,
  SYSTEM_RULES,
  buildGenerateWorkoutPrompt,
  buildPeriodizationPrompt,
} from "@/lib/ai/prompts/system";
import {
  sanitizeWorkout,
  validateWorkoutAgainstRules,
  type RuleViolation,
} from "@/lib/ai/rules/engine";
import {
  buildGenderTrainingPrompt,
  buildGenderVolumeHint,
  prioritizeExercisesForSex,
  type TrainingSex,
} from "@/lib/ai/gender-training";
import type { CalendarEventLite, Exercise, TrainingHistoryPoint } from "@/types";
import { planGenerationLimit } from "@/lib/utils";

export type GenerateWorkoutInput = {
  trainingSex: TrainingSex;
  profile: Record<string, unknown>;
  history: TrainingHistoryPoint[];
  exercises: Exercise[];
  calendar: CalendarEventLite[];
  form: {
    goal: string;
    frequency: number;
    duration: number;
    equipment: string[];
    experience: string;
    sport: string;
    availableDays: string[];
    preferences?: string;
  };
  plan?: string;
  usage?: { used: number; limit?: number };
};

function assertUsage(plan = "FREE", usage?: { used: number; limit?: number }) {
  const limit = usage?.limit ?? planGenerationLimit(plan);
  const used = usage?.used ?? 0;
  if (used >= limit) {
    throw new Error(`Limite de gerações atingido (${used}/${limit}).`);
  }
}

function parseJson(content: string) {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Resposta da IA não contém JSON.");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function generateWorkoutWithAI(input: GenerateWorkoutInput) {
  assertUsage(input.plan, input.usage);

  const provider = getAIProvider();
  const orderedExercises = prioritizeExercisesForSex(
    input.exercises,
    input.trainingSex,
  );
  const allowedIds = new Set(orderedExercises.map((e) => e.id));
  const exercisesById = new Map(orderedExercises.map((e) => [e.id, e]));
  const genderRules = buildGenderTrainingPrompt(input.trainingSex);
  const genderVolume = buildGenderVolumeHint(input.trainingSex);
  const skipGenderVolume =
    input.form.goal.toLowerCase() === "reabilitação" ||
    input.form.goal.toLowerCase() === "reabilitacao";
  const exercisesForPrompt = orderedExercises.slice(0, 80).map((e) => ({
    id: e.id,
    name: e.name,
    primary_muscle: e.primary_muscle,
    equipment: e.equipment,
    difficulty: e.difficulty,
    movement_pattern: e.movement_pattern,
    exercise_type: e.exercise_type,
  }));

  let attempt = 0;
  let lastError: string | undefined;
  let violations: RuleViolation[] = [];

  while (attempt < 2) {
    attempt += 1;
    const completion = await provider.complete({
      messages: [
        { role: "system", content: SYSTEM_RULES },
        {
          role: "user",
          content:
            buildGenerateWorkoutPrompt({
              profile: input.profile,
              history: input.history,
              exercises: exercisesForPrompt,
              calendar: input.calendar,
              form: {
                ...input.form,
                training_sex: input.trainingSex,
              },
              genderRules,
            }) +
            (lastError
              ? `\nCORREÇÃO OBRIGATÓRIA: ${lastError}. Violações: ${JSON.stringify(violations)}`
              : ""),
        },
      ],
      responseFormat: "json",
      temperature: 0.3,
    });

    try {
      const raw = parseJson(completion.content);
      const parsed = GeneratedWorkoutSchema.parse(raw);
      const sanitized = sanitizeWorkout(parsed, allowedIds);
      violations = validateWorkoutAgainstRules(sanitized, {
        allowedExerciseIds: allowedIds,
        exercisesById,
        equipment: input.form.equipment,
        calendar: input.calendar,
        genderVolume,
        skipGenderVolume,
      });

      const hard = violations.filter((v) => v.severity === "error");
      if (hard.length) {
        lastError = hard.map((v) => v.message).join("; ");
        continue;
      }

      if (!sanitized.exercises.length) {
        lastError = "Nenhum exercício válido após sanitização.";
        continue;
      }

      return {
        workout: sanitized,
        violations,
        meta: {
          provider: completion.provider,
          model: completion.model,
          promptVersion: PROMPT_VERSION,
          inputTokens: completion.inputTokens,
          outputTokens: completion.outputTokens,
          latencyMs: completion.latencyMs,
          attempts: attempt,
          trainingSex: input.trainingSex,
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Falha de validação";
    }
  }

  throw new Error(
    `Falha ao validar treino da IA após retries: ${lastError ?? "desconhecido"}`,
  );
}

export async function generatePeriodizationWithAI(input: GenerateWorkoutInput) {
  assertUsage(input.plan, input.usage);
  const provider = getAIProvider();
  const orderedExercises = prioritizeExercisesForSex(
    input.exercises,
    input.trainingSex,
  );
  const allowedIds = new Set(orderedExercises.map((e) => e.id));
  const exercisesById = new Map(orderedExercises.map((e) => [e.id, e]));
  const genderRules = buildGenderTrainingPrompt(input.trainingSex);
  const genderVolume = buildGenderVolumeHint(input.trainingSex);
  const skipGenderVolume =
    input.form.goal.toLowerCase() === "reabilitação" ||
    input.form.goal.toLowerCase() === "reabilitacao";

  const completion = await provider.complete({
    messages: [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: buildPeriodizationPrompt({
          profile: input.profile,
          history: input.history,
          exercises: orderedExercises.slice(0, 80).map((e) => ({
            id: e.id,
            name: e.name,
            primary_muscle: e.primary_muscle,
            equipment: e.equipment,
          })),
          calendar: input.calendar,
          form: {
            ...input.form,
            training_sex: input.trainingSex,
          },
          genderRules,
        }),
      },
    ],
    responseFormat: "json",
  });

  const raw = parseJson(completion.content);
  const parsed = GeneratedPeriodizationSchema.parse(raw);

  for (const week of parsed.weeks) {
    for (const workout of week.workouts) {
      const sanitized = sanitizeWorkout(workout, allowedIds);
      const hard = validateWorkoutAgainstRules(sanitized, {
        allowedExerciseIds: allowedIds,
        exercisesById,
        equipment: input.form.equipment,
        calendar: input.calendar,
        genderVolume,
        skipGenderVolume,
      }).filter((v) => v.severity === "error");
      if (hard.length) {
        throw new Error(
          `Periodização inválida na semana ${week.week_number}: ${hard[0].message}`,
        );
      }
      Object.assign(workout, sanitized);
    }
  }

  return {
    plan: parsed,
    meta: {
      provider: completion.provider,
      model: completion.model,
      promptVersion: PROMPT_VERSION,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      latencyMs: completion.latencyMs,
      trainingSex: input.trainingSex,
    },
  };
}

export async function adaptWorkoutWithAI(input: {
  workout: unknown;
  performance: unknown;
  exercises: Exercise[];
}) {
  const provider = getAIProvider();
  const allowed = new Set(input.exercises.map((e) => e.id));
  const completion = await provider.complete({
    messages: [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: [
          "TASK: ADAPTAR PRÓXIMO TREINO",
          "WORKOUT:",
          JSON.stringify(input.workout),
          "PERFORMANCE:",
          JSON.stringify(input.performance),
          "AVAILABLE EXERCISES:",
          JSON.stringify(input.exercises.slice(0, 40).map((e) => e.id)),
        ].join("\n"),
      },
    ],
    responseFormat: "json",
  });

  const parsed = AdaptWorkoutSchema.parse(parseJson(completion.content));
  parsed.adjustments = parsed.adjustments.filter((a) =>
    allowed.has(a.exercise_id),
  );
  if (parsed.next_workout) {
    parsed.next_workout = sanitizeWorkout(parsed.next_workout, allowed);
  }
  return { adaptation: parsed, meta: completion };
}

export async function askAI(input: {
  question: string;
  workoutContext: unknown;
  exercises: Exercise[];
}) {
  const provider = getAIProvider();
  const completion = await provider.complete({
    messages: [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: [
          "TASK: PERGUNTAR À IA",
          "QUESTION:",
          input.question,
          "WORKOUT CONTEXT:",
          JSON.stringify(input.workoutContext),
          "AVAILABLE EXERCISES:",
          JSON.stringify(
            input.exercises.slice(0, 60).map((e) => ({
              id: e.id,
              name: e.name,
              primary_muscle: e.primary_muscle,
              equipment: e.equipment,
            })),
          ),
          "Responda em JSON: {answer, alternatives?: string[], disclaimer}",
        ].join("\n"),
      },
    ],
    responseFormat: "json",
  });

  return { answer: parseJson(completion.content), meta: completion };
}

export async function generateMonthlyReport(input: {
  stats: unknown;
  history: unknown;
}) {
  const provider = getAIProvider();
  const completion = await provider.complete({
    messages: [
      { role: "system", content: SYSTEM_RULES },
      {
        role: "user",
        content: [
          "TASK: ANÁLISE DO MÊS / relatório",
          "STATS:",
          JSON.stringify(input.stats),
          "HISTORY:",
          JSON.stringify(input.history),
          "JSON: {positives, improvements, evolution, recommendations, disclaimer}",
        ].join("\n"),
      },
    ],
    responseFormat: "json",
  });
  return { report: parseJson(completion.content), meta: completion };
}
