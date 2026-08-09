import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKg(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

export function epley1RM(loadKg: number, reps: number) {
  if (reps <= 0) return 0;
  if (reps === 1) return loadKg;
  return Math.round((loadKg * (1 + reps / 30)) * 10) / 10;
}

export function planGenerationLimit(plan: string) {
  switch (plan) {
    case "PRO":
      return 100;
    case "TRAINER":
      return 500;
    case "ENTERPRISE":
      return 10_000;
    default:
      return 10;
  }
}
