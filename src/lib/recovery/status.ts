import type { RecoveryStatus } from "@/types";

export type RecoveryInputs = {
  sessionRpe?: number | null;
  fatigue?: "baixa" | "media" | "alta" | string | null;
  recentVolumeScore?: number; // 0-100
  frequencyLast7Days?: number;
  sleepHours?: number | null;
  pain?: "nenhuma" | "leve" | "moderada" | "alta" | string | null;
  hardEventsNext24h?: boolean;
};

/** Indicador de prontidão para treino — não é diagnóstico médico. */
export function computeRecoveryStatus(input: RecoveryInputs): {
  status: RecoveryStatus;
  label: string;
  score: number;
  disclaimer: string;
} {
  let score = 70;

  if (input.sessionRpe != null) {
    if (input.sessionRpe >= 9) score -= 25;
    else if (input.sessionRpe >= 7.5) score -= 12;
    else if (input.sessionRpe <= 5) score += 5;
  }

  if (input.fatigue === "alta") score -= 20;
  if (input.fatigue === "media") score -= 8;
  if (input.fatigue === "baixa") score += 5;

  if ((input.recentVolumeScore ?? 50) > 80) score -= 15;
  if ((input.frequencyLast7Days ?? 0) >= 6) score -= 10;

  if (input.sleepHours != null) {
    if (input.sleepHours < 6) score -= 15;
    if (input.sleepHours >= 8) score += 8;
  }

  if (input.pain === "alta") score -= 30;
  if (input.pain === "moderada") score -= 15;
  if (input.pain === "leve") score -= 5;

  if (input.hardEventsNext24h) score -= 10;

  score = Math.max(0, Math.min(100, score));

  let status: RecoveryStatus = "good";
  let label = "Boa";
  if (score < 45) {
    status = "low";
    label = "Baixa";
  } else if (score < 70) {
    status = "moderate";
    label = "Moderada";
  }

  return {
    status,
    label,
    score,
    disclaimer:
      "Indicador de recuperação para organização do treino. Não constitui diagnóstico médico.",
  };
}
