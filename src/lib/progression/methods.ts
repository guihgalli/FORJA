export type ProgressionMethod =
  | "double_progression"
  | "rir"
  | "rpe"
  | "percent_1rm"
  | "fixed_load"
  | "linear"
  | "undulating";

export function suggestNextLoad(input: {
  method: ProgressionMethod;
  loadKg: number;
  reps: number;
  repMax: number;
  rir?: number | null;
  targetRir?: number;
}) {
  const {
    method,
    loadKg,
    reps,
    repMax,
    rir,
    targetRir = 2,
  } = input;

  switch (method) {
    case "double_progression":
      if (reps >= repMax && (rir == null || rir >= targetRir)) {
        return {
          loadKg: loadKg + 2.5,
          repsHint: `${Math.max(1, repMax - 2)}-${repMax}`,
          note: "Topo da faixa atingido — aumente a carga.",
        };
      }
      return {
        loadKg,
        repsHint: `${reps + 1}-${repMax}`,
        note: "Mantenha a carga e busque +1 rep.",
      };
    case "rir":
      if ((rir ?? 2) > targetRir) {
        return {
          loadKg: loadKg + 2.5,
          repsHint: `${repMax - 2}-${repMax}`,
          note: "RIR alto — progresso de carga.",
        };
      }
      if ((rir ?? 2) < targetRir - 1) {
        return {
          loadKg: Math.max(0, loadKg - 2.5),
          repsHint: `${repMax - 2}-${repMax}`,
          note: "RIR baixo — reduza levemente a carga.",
        };
      }
      return { loadKg, repsHint: `${repMax - 2}-${repMax}`, note: "RIR no alvo." };
    case "linear":
      return {
        loadKg: loadKg + 2.5,
        repsHint: `${repMax - 2}-${repMax}`,
        note: "Progressão linear +2,5 kg.",
      };
    case "fixed_load":
      return {
        loadKg,
        repsHint: `${repMax - 2}-${repMax}`,
        note: "Carga fixa — foque na qualidade.",
      };
    default:
      return {
        loadKg: loadKg + (reps >= repMax ? 2.5 : 0),
        repsHint: `${repMax - 2}-${repMax}`,
        note: "Ajuste padrão conservador.",
      };
  }
}
