import { z } from "zod";

export const WorkoutExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  order: z.number().int().min(1).max(30),
  sets: z.number().int().min(1).max(10),
  rep_min: z.number().int().min(1).max(50),
  rep_max: z.number().int().min(1).max(50),
  rir: z.number().min(0).max(5).optional(),
  rpe: z.number().min(1).max(10).optional(),
  rest_seconds: z.number().int().min(15).max(600).optional(),
  tempo: z.string().max(20).optional(),
  target_load_kg: z.number().min(0).max(1000).optional(),
  notes: z.string().max(500).optional(),
});

export const GeneratedWorkoutSchema = z
  .object({
    name: z.string().min(3).max(120),
    goal: z.string().min(2).max(80),
    duration_minutes: z.number().int().min(15).max(180),
    rationale: z.string().max(2000).optional(),
    exercises: z.array(WorkoutExerciseSchema).min(1).max(20),
  })
  .superRefine((val, ctx) => {
    val.exercises.forEach((ex, idx) => {
      if (ex.rep_max < ex.rep_min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `rep_max < rep_min no exercício ${idx + 1}`,
          path: ["exercises", idx, "rep_max"],
        });
      }
    });
  });

export const GeneratedPeriodizationSchema = z.object({
  name: z.string().min(3).max(120),
  goal: z.string().min(2).max(80),
  weeks: z
    .array(
      z.object({
        week_number: z.number().int().min(1).max(12),
        focus: z.string().min(2).max(80),
        workouts: z.array(GeneratedWorkoutSchema).min(1).max(7),
      }),
    )
    .min(1)
    .max(12),
});

export const AdaptWorkoutSchema = z.object({
  summary: z.string().min(3).max(1000),
  adjustments: z
    .array(
      z.object({
        exercise_id: z.string().uuid(),
        suggestion: z.string().min(3).max(500),
        new_load_kg: z.number().min(0).max(1000).optional(),
        new_reps: z.string().max(40).optional(),
        new_rir: z.number().min(0).max(5).optional(),
      }),
    )
    .min(1)
    .max(20),
  next_workout: GeneratedWorkoutSchema.optional(),
});

export type GeneratedWorkoutDTO = z.infer<typeof GeneratedWorkoutSchema>;
export type GeneratedPeriodizationDTO = z.infer<
  typeof GeneratedPeriodizationSchema
>;
