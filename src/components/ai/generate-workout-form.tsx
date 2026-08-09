"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export function GenerateWorkoutForm() {
  const [goal, setGoal] = useState("Hipertrofia");
  const [frequency, setFrequency] = useState(4);
  const [duration, setDuration] = useState(60);
  const [equipment, setEquipment] = useState<string[]>(["academia_completa"]);
  const [experience, setExperience] = useState("Intermediário");
  const [sport, setSport] = useState("Futebol");
  const [availableDays, setAvailableDays] = useState(["SEG", "TER", "QUI", "SÁB"]);
  const [preferences, setPreferences] = useState(
    "Quero melhorar minha explosão para futebol.",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState("7/10 gerações utilizadas");

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
        <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
          {usage}
        </Badge>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
          ✨ Gerar treino com IA
        </h1>
        <p className="text-white/60">
          A IA seleciona exercícios da biblioteca e retorna JSON validado.
        </p>
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
          disabled={loading}
          onClick={() => onSubmit("workout")}
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Gerando..." : "Gerar treino"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={loading}
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
