"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GenerateWorkoutFormValues } from "@/lib/ai/generate-form";
import type { TrainingSex } from "@/lib/ai/gender-training";

const GOALS = [
  "Hipertrofia",
  "Força",
  "Definição",
  "Resistência",
  "Explosão",
  "Velocidade",
  "Futebol",
  "Performance esportiva",
  "Reabilitação",
];
const FREQ = [1, 2, 3, 4, 5, 6];
const DURATIONS = [30, 45, 60, 90];
const EQUIPMENT = [
  "academia_completa",
  "academia_basica",
  "halteres",
  "barra",
  "maquinas",
  "peso_corporal",
  "elasticos",
];
const EXPERIENCE = ["Iniciante", "Intermediário", "Avançado"];
const SPORTS = ["Nenhum", "Futebol", "Corrida", "Ciclismo", "Basquete", "Outros"];
const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm transition",
        active
          ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

const DEFAULT_VALUES: GenerateWorkoutFormValues = {
  goal: "Hipertrofia",
  frequency: 4,
  duration: 60,
  equipment: ["academia_completa"],
  experience: "Intermediário",
  sport: "Futebol",
  availableDays: ["SEG", "TER", "QUI", "SÁB"],
  preferences: "Quero melhorar minha explosão para futebol.",
};

export function GenerateWorkoutForm({
  initialValues,
  fromOnboarding = false,
  trainingSex = null,
  trainingSexLabel = null,
}: {
  initialValues?: Partial<GenerateWorkoutFormValues>;
  fromOnboarding?: boolean;
  trainingSex?: TrainingSex | null;
  trainingSexLabel?: string | null;
}) {
  const defaults = { ...DEFAULT_VALUES, ...initialValues };
  const [goal, setGoal] = useState(defaults.goal);
  const [frequency, setFrequency] = useState(defaults.frequency);
  const [duration, setDuration] = useState(defaults.duration);
  const [equipment, setEquipment] = useState<string[]>(defaults.equipment);
  const [experience, setExperience] = useState(defaults.experience);
  const [sport, setSport] = useState(defaults.sport);
  const [availableDays, setAvailableDays] = useState(defaults.availableDays);
  const [preferences, setPreferences] = useState(defaults.preferences);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState("7/10 gerações utilizadas");
  const canGenerate = Boolean(trainingSex);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  async function onSubmit(mode: "workout" | "periodization") {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpoint =
        mode === "workout"
          ? "/api/ai/generate-workout"
          : "/api/ai/generate-periodization";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          frequency,
          duration,
          equipment,
          experience,
          sport,
          availableDays,
          preferences,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na geração");
      setResult(data);
      setUsage("8/10 gerações utilizadas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-28">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
            {usage}
          </Badge>
          {trainingSexLabel && (
            <Badge className="border-sky-400/30 bg-sky-400/10 text-sky-100">
              {trainingSexLabel}
            </Badge>
          )}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
          ✨ Gerar treino com IA
        </h1>
        <p className="text-white/60">
          A IA monta treinos distintos para perfil masculino e feminino, com
          base no seu questionário.
        </p>
        {!canGenerate && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            Informe masculino ou feminino no{" "}
            <Link href="/profile" className="underline underline-offset-2">
              perfil
            </Link>{" "}
            para gerar treino. Treinos masculino e feminino são programações
            completamente diferentes.
          </p>
        )}
        {fromOnboarding && (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
            Campos pré-preenchidos com base no seu questionário de onboarding.
            Ajuste se quiser e gere seu primeiro treino.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <Label>Objetivo</Label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>
              {g}
            </Chip>
          ))}
        </div>
        {goal === "Reabilitação" && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            Recomendações médicas/fisioterapêuticas não são substituídas pela
            plataforma.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <Label>Frequência (dias/semana)</Label>
        <div className="flex flex-wrap gap-2">
          {FREQ.map((n) => (
            <Chip key={n} active={frequency === n} onClick={() => setFrequency(n)}>
              {n}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Duração</Label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((n) => (
            <Chip key={n} active={duration === n} onClick={() => setDuration(n)}>
              {n} min
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Equipamentos</Label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((e) => (
            <Chip
              key={e}
              active={equipment.includes(e)}
              onClick={() => toggle(equipment, e, setEquipment)}
            >
              {e.replaceAll("_", " ")}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Experiência</Label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE.map((e) => (
            <Chip key={e} active={experience === e} onClick={() => setExperience(e)}>
              {e}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Esporte</Label>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <Chip key={s} active={sport === s} onClick={() => setSport(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Disponibilidade</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <Chip
              key={d}
              active={availableDays.includes(d)}
              onClick={() => toggle(availableDays, d, setAvailableDays)}
            >
              {d}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Preferências</Label>
        <Textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          disabled={loading || !canGenerate}
          onClick={() => onSubmit("workout")}
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Gerando..." : "Gerar treino"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={loading || !canGenerate}
          onClick={() => onSubmit("periodization")}
          className="w-full"
        >
          ✨ Plano 4 semanas
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      )}

      {!!result && (
        <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-emerald-100/90">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
