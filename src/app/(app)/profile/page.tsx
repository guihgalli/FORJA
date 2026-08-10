"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AthleteProfile } from "@/types";

const emptyProfile: AthleteProfile = {
  full_name: "",
  age: null,
  sex: null,
  height_cm: null,
  weight_kg: null,
  body_fat_pct: null,
  goal: null,
  level: null,
  experience: null,
  sport: null,
  position: null,
  weekly_frequency: null,
  available_days: [],
  session_duration_min: null,
  equipment: [],
  notes: null,
};

type FieldKey =
  | "full_name"
  | "age"
  | "sex"
  | "height_cm"
  | "weight_kg"
  | "body_fat_pct"
  | "goal"
  | "level"
  | "experience"
  | "sport"
  | "position"
  | "weekly_frequency"
  | "session_duration_min";

const FIELDS: Array<[string, FieldKey]> = [
  ["Nome", "full_name"],
  ["Idade", "age"],
  ["Sexo", "sex"],
  ["Altura (cm)", "height_cm"],
  ["Peso (kg)", "weight_kg"],
  ["% Gordura", "body_fat_pct"],
  ["Objetivo", "goal"],
  ["Nível", "level"],
  ["Experiência", "experience"],
  ["Esporte", "sport"],
  ["Posição", "position"],
  ["Frequência semanal", "weekly_frequency"],
  ["Duração (min)", "session_duration_min"],
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<AthleteProfile>(emptyProfile);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const json = (await res.json()) as {
          profile?: AthleteProfile;
          meta?: { email?: string | null };
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Falha ao carregar perfil");
          return;
        }
        if (!cancelled) {
          setProfile(json.profile ?? emptyProfile);
          setEmail(json.meta?.email ?? null);
        }
      } catch {
        if (!cancelled) setError("Falha de rede ao carregar perfil");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const json = (await res.json()) as {
        profile?: AthleteProfile;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Não foi possível salvar o perfil");
        return;
      }
      if (json.profile) setProfile(json.profile);
      setMessage("Perfil salvo.");
    } catch {
      setError("Falha de rede ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-in-up pb-8">
        <p className="text-sm text-white/55">Carregando perfil…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in-up pb-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Perfil do atleta
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          {profile.full_name || "Seu perfil"}
        </h1>
        {email && <p className="mt-1 text-sm text-white/50">{email}</p>}
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        {FIELDS.map(([label, key]) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={profile[key] == null ? "" : String(profile[key])}
              onChange={(e) =>
                setProfile((p) => ({ ...p, [key]: e.target.value }))
              }
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <Label>Dias disponíveis</Label>
          <Input
            value={(profile.available_days ?? []).join(", ")}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                available_days: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="SEG, TER, QUI"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Equipamentos</Label>
          <Input
            value={(profile.equipment ?? []).join(", ")}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                equipment: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="academia_completa, halteres"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea
            value={profile.notes ?? ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, notes: e.target.value }))
            }
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Salvando…" : "Salvar perfil"}
        </Button>
      </form>

      {message && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        <Button asChild variant="secondary">
          <Link href="/exercises">Biblioteca de exercícios</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/ai/report">Análise do mês</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/goals">Metas</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/measurements">Avaliação física</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Administração</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/login">Conta / Auth</Link>
        </Button>
      </div>
    </div>
  );
}
