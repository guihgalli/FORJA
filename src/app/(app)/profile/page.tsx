"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoProfile } from "@/lib/demo/store";

export default function ProfilePage() {
  const [profile, setProfile] = useState(demoProfile);

  return (
    <div className="space-y-5 animate-in-up pb-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Perfil do atleta
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          {profile.full_name}
        </h1>
      </header>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Perfil salvo (demo). Com Supabase, persiste via RLS.");
        }}
      >
        {(
          [
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
          ] as const
        ).map(([label, key]) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={String(profile[key] ?? "")}
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
                available_days: e.target.value.split(",").map((s) => s.trim()),
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Equipamentos</Label>
          <Input
            value={(profile.equipment ?? []).join(", ")}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                equipment: e.target.value.split(",").map((s) => s.trim()),
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea
            value={profile.notes ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <Button type="submit" size="lg" className="w-full">
          Salvar perfil
        </Button>
      </form>

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
        <Button asChild variant="ghost">
          <Link href="/login">Conta / Auth</Link>
        </Button>
      </div>
    </div>
  );
}
