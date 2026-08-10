import type { AppRole } from "@/types";

export const APP_ROLES: AppRole[] = ["ADMIN", "TRAINER", "STUDENT"];

export function isAppRole(value: unknown): value is AppRole {
  return value === "ADMIN" || value === "TRAINER" || value === "STUDENT";
}

export function roleLabel(role: AppRole) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "TRAINER":
      return "Personal";
    default:
      return "Aluno";
  }
}

export function parseAdminEmails(raw?: string | null) {
  if (!raw) return [] as string[];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
