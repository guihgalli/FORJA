import { z } from "zod";

export const SEX_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
] as const;

export const GOAL_OPTIONS = [
  "Hipertrofia",
  "Emagrecimento",
  "Força",
  "Definição",
  "Resistência",
  "Performance esportiva",
  "Reabilitação",
  "Saúde geral",
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
] as const;

export const EQUIPMENT_OPTIONS = [
  { value: "academia_completa", label: "Academia completa" },
  { value: "academia_basica", label: "Academia básica" },
  { value: "halteres", label: "Halteres" },
  { value: "barra", label: "Barra" },
  { value: "maquinas", label: "Máquinas" },
  { value: "peso_corporal", label: "Peso corporal" },
  { value: "elasticos", label: "Elásticos" },
] as const;

export const DAY_OPTIONS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"] as const;

export const DIETARY_OPTIONS = [
  { value: "omnivoro", label: "Onívoro" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "pescetariano", label: "Pescetariano" },
  { value: "flexitariano", label: "Flexitariano" },
  { value: "outro", label: "Outro" },
] as const;

export const ACTIVITY_OPTIONS = [
  { value: "sedentario", label: "Sedentário" },
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
  { value: "atleta", label: "Atleta" },
] as const;

export const ALLERGY_OPTIONS = [
  "lactose",
  "gluten",
  "ovos",
  "amendoim",
  "frutos_do_mar",
  "soja",
  "nenhuma",
] as const;

export const RESTRICTION_OPTIONS = [
  "sem_acucar",
  "low_carb",
  "sem_carne_vermelha",
  "halal",
  "kosher",
  "nenhuma",
] as const;

export const onboardingSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome").max(120),
  age: z.coerce.number().int().min(12).max(100),
  sex: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]),
  height_cm: z.coerce.number().min(120).max(250),
  weight_kg: z.coerce.number().min(30).max(300),
  body_fat_pct: z.coerce.number().min(3).max(60).optional().nullable(),
  goal: z.string().trim().min(2),
  experience: z.enum(["iniciante", "intermediario", "avancado"]),
  level: z.enum(["iniciante", "intermediario", "avancado"]).optional(),
  sport: z.string().trim().max(80).optional().nullable(),
  weekly_frequency: z.coerce.number().int().min(1).max(7),
  available_days: z.array(z.string()).min(1, "Selecione ao menos um dia"),
  session_duration_min: z.coerce.number().int().min(20).max(180),
  equipment: z.array(z.string()).min(1, "Selecione ao menos um equipamento"),
  dietary_preference: z.enum([
    "omnivoro",
    "vegetariano",
    "vegano",
    "pescetariano",
    "flexitariano",
    "outro",
  ]),
  food_allergies: z.array(z.string()).default([]),
  food_restrictions: z.array(z.string()).default([]),
  meals_per_day: z.coerce.number().int().min(2).max(8),
  activity_level: z.enum([
    "sedentario",
    "leve",
    "moderado",
    "intenso",
    "atleta",
  ]),
  notes: z.string().trim().max(1000).optional().nullable(),
  diet_notes: z.string().trim().max(1000).optional().nullable(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type StudentProfileRow = {
  profile_completed_at?: string | null;
  age?: number | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  experience?: string | null;
  weekly_frequency?: number | null;
  available_days?: string[] | null;
  session_duration_min?: number | null;
  equipment?: string[] | null;
  dietary_preference?: string | null;
  meals_per_day?: number | null;
  activity_level?: string | null;
};

/** Perfil pronto para a IA gerar treino/dieta. */
export function isAthleteProfileComplete(
  student: StudentProfileRow | null | undefined,
): boolean {
  if (!student) return false;
  if (student.profile_completed_at) return true;

  const days = student.available_days ?? [];
  const equipment = student.equipment ?? [];

  return Boolean(
    student.age &&
      student.sex &&
      student.height_cm &&
      student.weight_kg &&
      student.goal &&
      student.experience &&
      student.weekly_frequency &&
      days.length > 0 &&
      student.session_duration_min &&
      equipment.length > 0 &&
      student.dietary_preference &&
      student.meals_per_day &&
      student.activity_level,
  );
}
