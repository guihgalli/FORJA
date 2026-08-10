import type { GeneratedWorkoutDTO } from "@/lib/ai/schemas/workout";
import type { CalendarEventLite, Exercise } from "@/types";

export type RuleViolation = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type RuleContext = {
  allowedExerciseIds: Set<string>;
  exercisesById: Map<string, Exercise>;
  equipment?: string[];
  calendar?: CalendarEventLite[];
  maxExercises?: number;
  maxSetsPerExercise?: number;
  avoidHeavyLegsBeforeGameHours?: number;
  genderVolume?: {
    primaryMuscles: Set<string>;
    minPrimaryShare: number;
  };
  skipGenderVolume?: boolean;
};

const HEAVY_LEG_MUSCLES = new Set([
  "quadriceps",
  "posteriores",
  "gluteos",
  "explosao",
]);

export function validateWorkoutAgainstRules(
  workout: GeneratedWorkoutDTO,
  ctx: RuleContext,
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const maxExercises = ctx.maxExercises ?? 12;
  const maxSets = ctx.maxSetsPerExercise ?? 8;

  if (workout.exercises.length > maxExercises) {
    violations.push({
      code: "MAX_EXERCISES",
      message: `Treino excede ${maxExercises} exercícios.`,
      severity: "error",
    });
  }

  const seen = new Set<string>();
  for (const ex of workout.exercises) {
    if (!ctx.allowedExerciseIds.has(ex.exercise_id)) {
      violations.push({
        code: "UNKNOWN_EXERCISE",
        message: `exercise_id não permitido: ${ex.exercise_id}`,
        severity: "error",
      });
      continue;
    }

    if (seen.has(ex.exercise_id)) {
      violations.push({
        code: "DUPLICATE_EXERCISE",
        message: `Exercício duplicado: ${ex.exercise_id}`,
        severity: "warning",
      });
    }
    seen.add(ex.exercise_id);

    if (ex.sets > maxSets) {
      violations.push({
        code: "MAX_SETS",
        message: `Séries acima do limite (${maxSets}) para ${ex.exercise_id}`,
        severity: "error",
      });
    }

    const meta = ctx.exercisesById.get(ex.exercise_id);
    if (meta && ctx.equipment?.length) {
      const ok =
        ctx.equipment.includes("academia_completa") ||
        ctx.equipment.includes(meta.equipment) ||
        meta.equipment === "peso_corporal";
      if (!ok) {
        violations.push({
          code: "EQUIPMENT_MISMATCH",
          message: `${meta.name} exige equipamento indisponível (${meta.equipment}).`,
          severity: "error",
        });
      }
    }
  }

  if (ctx.calendar?.length) {
    const soonGame = ctx.calendar.find((ev) => {
      const type = ev.event_type;
      if (type !== "jogo" && type !== "futebol") return false;
      const hours =
        (new Date(ev.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
      return hours >= 0 && hours <= (ctx.avoidHeavyLegsBeforeGameHours ?? 36);
    });

    if (soonGame) {
      const heavy = workout.exercises.some((ex) => {
        const meta = ctx.exercisesById.get(ex.exercise_id);
        return meta && HEAVY_LEG_MUSCLES.has(meta.primary_muscle);
      });
      if (heavy) {
        violations.push({
          code: "CALENDAR_CONFLICT",
          message:
            "Evite estímulo pesado de pernas imediatamente antes de jogo/futebol.",
          severity: "error",
        });
      }
    }
  }

  const volume = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  if (volume > 36) {
    violations.push({
      code: "VOLUME_CAP",
      message: "Volume total de séries acima do limite de segurança (36).",
      severity: "error",
    });
  }

  if (ctx.genderVolume && !ctx.skipGenderVolume && volume > 0) {
    const primarySets = workout.exercises.reduce((acc, ex) => {
      const meta = ctx.exercisesById.get(ex.exercise_id);
      return meta && ctx.genderVolume!.primaryMuscles.has(meta.primary_muscle)
        ? acc + ex.sets
        : acc;
    }, 0);
    const share = primarySets / volume;
    if (share < ctx.genderVolume.minPrimaryShare) {
      violations.push({
        code: "GENDER_VOLUME",
        message: `Treino não respeita a ênfase do sexo (mínimo ${Math.round(ctx.genderVolume.minPrimaryShare * 100)}% de séries nos grupos prioritários).`,
        severity: "error",
      });
    }
  }

  return violations;
}

export function sanitizeWorkout(
  workout: GeneratedWorkoutDTO,
  allowed: Set<string>,
): GeneratedWorkoutDTO {
  const filtered = workout.exercises
    .filter((e) => allowed.has(e.exercise_id))
    .map((e, idx) => ({
      ...e,
      order: idx + 1,
      sets: Math.min(Math.max(e.sets, 1), 8),
      rep_min: Math.min(e.rep_min, e.rep_max),
      rep_max: Math.max(e.rep_min, e.rep_max),
      rir: e.rir != null ? Math.min(Math.max(e.rir, 0), 5) : 2,
      rest_seconds: e.rest_seconds ?? 90,
    }));

  return { ...workout, exercises: filtered };
}
