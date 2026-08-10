import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === "" || value === undefined) return null;
  return value;
};

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const optionalInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}, z.number().int().nullable());

const optionalText = z.preprocess(
  emptyToNull,
  z.string().trim().max(2000).nullable(),
);

const stringList = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()));

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  age: optionalInt.optional(),
  sex: z
    .preprocess(
      emptyToNull,
      z
        .enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"])
        .nullable(),
    )
    .optional(),
  height_cm: optionalNumber.optional(),
  weight_kg: optionalNumber.optional(),
  body_fat_pct: optionalNumber.optional(),
  goal: optionalText.optional(),
  level: optionalText.optional(),
  experience: optionalText.optional(),
  sport: optionalText.optional(),
  position: optionalText.optional(),
  weekly_frequency: optionalInt.optional(),
  available_days: stringList.optional(),
  session_duration_min: optionalInt.optional(),
  equipment: stringList.optional(),
  notes: optionalText.optional(),
  dietary_preference: optionalText.optional(),
  food_allergies: stringList.optional(),
  food_restrictions: stringList.optional(),
  meals_per_day: optionalInt.optional(),
  activity_level: optionalText.optional(),
  diet_notes: optionalText.optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
