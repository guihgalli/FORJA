import { EXPERIENCE_OPTIONS } from "@/lib/onboarding/schema";
import type { AthleteProfile } from "@/types";

export type GenerateWorkoutFormValues = {
  goal: string;
  frequency: number;
  duration: number;
  equipment: string[];
  experience: string;
  sport: string;
  availableDays: string[];
  preferences: string;
};

const GENERATE_SPORTS = [
  "Nenhum",
  "Futebol",
  "Corrida",
  "Ciclismo",
  "Basquete",
  "Outros",
] as const;

const GENERATE_DURATIONS = [30, 45, 60, 90];

const EXPERIENCE_LABELS = Object.fromEntries(
  EXPERIENCE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

function normalizeSport(sport: string | null | undefined): string {
  if (!sport?.trim()) return "Nenhum";
  const trimmed = sport.trim();
  const exact = GENERATE_SPORTS.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exact) return exact;
  if (trimmed.toLowerCase().includes("futebol")) return "Futebol";
  return "Outros";
}

function closestDuration(minutes: number | null | undefined): number {
  if (!minutes) return 60;
  return GENERATE_DURATIONS.reduce((prev, curr) =>
    Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev,
  );
}

/** Converte o perfil do onboarding em valores iniciais do formulário de geração. */
export function profileToGenerateForm(
  profile: AthleteProfile,
): GenerateWorkoutFormValues {
  const sport = normalizeSport(profile.sport);
  const preferencesParts: string[] = [];

  if (profile.notes?.trim()) {
    preferencesParts.push(profile.notes.trim());
  }
  if (profile.sport?.trim() && sport === "Outros") {
    preferencesParts.push(`Esporte: ${profile.sport.trim()}`);
  }
  if (profile.diet_notes?.trim()) {
    preferencesParts.push(`Dieta: ${profile.diet_notes.trim()}`);
  }

  return {
    goal: profile.goal?.trim() || "Hipertrofia",
    frequency: profile.weekly_frequency ?? 4,
    duration: closestDuration(profile.session_duration_min),
    equipment: profile.equipment?.length
      ? profile.equipment
      : ["academia_completa"],
    experience: profile.experience
      ? (EXPERIENCE_LABELS[profile.experience] ?? profile.experience)
      : "Intermediário",
    sport,
    availableDays: profile.available_days?.length
      ? profile.available_days
      : ["SEG", "TER", "QUI", "SÁB"],
    preferences: preferencesParts.join("\n"),
  };
}
